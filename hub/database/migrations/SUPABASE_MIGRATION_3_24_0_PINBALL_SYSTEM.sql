-- AXE PRODUCT 3.24.0
-- Multi-tenant PINBALL recruitment module
-- Generic items + exact modbook enrichment, anti-spam, restart-safe DB state.
-- STAGING FIRST. Schema: axe_product

begin;

-- -----------------------------------------------------------------------------
-- 1) Module catalog + existing companies
-- -----------------------------------------------------------------------------
insert into axe_product.module_catalog (
  module_key, display_name, description, default_enabled, sort_order, active, updated_at
)
values (
  'pinball',
  '핀볼 모집',
  '개조서와 일반 아이템의 참여 모집 · 핀볼 명단 생성',
  false,
  45,
  true,
  now()
)
on conflict (module_key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

insert into axe_product.company_modules (company_id, module_key, enabled, settings)
select c.id, 'pinball', false, '{}'::jsonb
from axe_product.companies c
on conflict (company_id, module_key) do nothing;

-- -----------------------------------------------------------------------------
-- 2) Persistent state
-- -----------------------------------------------------------------------------
create table if not exists axe_product.pinball_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  guild_id text not null,
  channel_id text not null,
  message_id text,
  host_discord_user_id text not null,
  host_display_name text not null,
  item_name text not null,
  item_name_key text not null,
  item_kind text not null default 'item',
  item_detail jsonb not null default '{}'::jsonb,
  balls_per_person integer not null default 1,
  note text,
  status text not null default 'open',
  request_key text not null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  closed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pinball_sessions_guild_id_format check (guild_id ~ '^[0-9]{15,22}$'),
  constraint pinball_sessions_channel_id_format check (channel_id ~ '^[0-9]{15,22}$'),
  constraint pinball_sessions_message_id_format check (message_id is null or message_id ~ '^[0-9]{15,22}$'),
  constraint pinball_sessions_host_id_format check (host_discord_user_id ~ '^[0-9]{15,22}$'),
  constraint pinball_sessions_item_name_len check (char_length(btrim(item_name)) between 1 and 60),
  constraint pinball_sessions_item_kind_check check (item_kind in ('item','modbook')),
  constraint pinball_sessions_balls_check check (balls_per_person between 1 and 20),
  constraint pinball_sessions_note_len check (note is null or char_length(note) <= 200),
  constraint pinball_sessions_status_check check (status in ('open','closed','cancelled','expired')),
  constraint pinball_sessions_request_key_len check (char_length(request_key) between 8 and 120),
  constraint pinball_sessions_company_request_key unique (company_id, request_key)
);

create table if not exists axe_product.pinball_participants (
  session_id uuid not null references axe_product.pinball_sessions(id) on delete cascade,
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  discord_user_id text not null,
  display_name text not null,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (session_id, discord_user_id),
  constraint pinball_participants_user_id_format check (discord_user_id ~ '^[0-9]{15,22}$'),
  constraint pinball_participants_display_len check (char_length(btrim(display_name)) between 1 and 100)
);

create table if not exists axe_product.pinball_help_panels (
  company_id uuid primary key references axe_product.companies(id) on delete cascade,
  channel_id text not null,
  message_id text,
  updated_at timestamptz not null default now(),
  constraint pinball_help_panels_channel_id_format check (channel_id ~ '^[0-9]{15,22}$'),
  constraint pinball_help_panels_message_id_format check (message_id is null or message_id ~ '^[0-9]{15,22}$')
);

create index if not exists idx_pinball_sessions_company_status_created
  on axe_product.pinball_sessions(company_id, status, created_at desc);
create index if not exists idx_pinball_sessions_host_status
  on axe_product.pinball_sessions(company_id, host_discord_user_id, status, created_at desc);
create index if not exists idx_pinball_sessions_channel_status
  on axe_product.pinball_sessions(company_id, channel_id, status, created_at desc);
create index if not exists idx_pinball_participants_active
  on axe_product.pinball_participants(session_id, active, joined_at asc);

alter table axe_product.pinball_sessions enable row level security;
alter table axe_product.pinball_participants enable row level security;
alter table axe_product.pinball_help_panels enable row level security;
revoke all on table axe_product.pinball_sessions from anon, authenticated;
revoke all on table axe_product.pinball_participants from anon, authenticated;
revoke all on table axe_product.pinball_help_panels from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3) Private helpers
-- -----------------------------------------------------------------------------
create or replace function axe_product.pinball_runtime_require_key(p_runtime_key text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_key_id uuid;
begin
  if p_runtime_key is null
     or char_length(p_runtime_key) < 48
     or char_length(p_runtime_key) > 160 then
    raise exception 'Invalid runtime credential.' using errcode = '42501';
  end if;

  select k.id into v_key_id
  from axe_product.bot_runtime_keys k
  where k.status = 'active'
    and k.key_hash = extensions.digest(p_runtime_key, 'sha256')
  limit 1;

  if v_key_id is null then
    raise exception 'Invalid runtime credential.' using errcode = '42501';
  end if;

  update axe_product.bot_runtime_keys
  set last_used_at = now()
  where id = v_key_id;

  return v_key_id;
end;
$$;

revoke all on function axe_product.pinball_runtime_require_key(text) from public, anon, authenticated;

create or replace function axe_product.pinball_session_payload(p_session_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  select jsonb_build_object(
    'id', s.id,
    'company_id', s.company_id,
    'guild_id', s.guild_id,
    'channel_id', s.channel_id,
    'message_id', s.message_id,
    'host_discord_user_id', s.host_discord_user_id,
    'host_display_name', s.host_display_name,
    'item_name', s.item_name,
    'item_kind', s.item_kind,
    'item_detail', s.item_detail,
    'balls_per_person', s.balls_per_person,
    'note', s.note,
    'status', s.status,
    'expires_at', s.expires_at,
    'closed_at', s.closed_at,
    'cancelled_at', s.cancelled_at,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object(
        'discord_user_id', p.discord_user_id,
        'display_name', p.display_name,
        'joined_at', p.joined_at
      ) order by p.joined_at asc, p.discord_user_id)
      from axe_product.pinball_participants p
      where p.session_id = s.id and p.active = true
    ), '[]'::jsonb)
  )
  from axe_product.pinball_sessions s
  where s.id = p_session_id;
$$;

revoke all on function axe_product.pinball_session_payload(uuid) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4) Runtime config + panel persistence
-- -----------------------------------------------------------------------------
create or replace function axe_product.bot_runtime_get_pinball_configs(p_runtime_key text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_result jsonb;
begin
  perform axe_product.pinball_runtime_require_key(p_runtime_key);

  select coalesce(jsonb_agg(jsonb_build_object(
    'company_id', c.id,
    'company_name', c.name,
    'guild_id', dc.guild_id,
    'guild_name', dc.guild_name,
    'enabled', cm.enabled,
    'channel_id', nullif(btrim(cm.settings->>'channel_id'), ''),
    'settings', cm.settings,
    'help_channel_id', hp.channel_id,
    'help_message_id', hp.message_id,
    'updated_at', cm.updated_at
  ) order by c.created_at, c.id), '[]'::jsonb)
  into v_result
  from axe_product.companies c
  join axe_product.discord_connections dc
    on dc.company_id = c.id and dc.status = 'connected'
  join axe_product.company_modules cm
    on cm.company_id = c.id and cm.module_key = 'pinball'
  left join axe_product.pinball_help_panels hp
    on hp.company_id = c.id
  where c.status = 'active';

  return v_result;
end;
$$;

create or replace function axe_product.bot_runtime_save_pinball_help_panel(
  p_runtime_key text,
  p_company_id uuid,
  p_channel_id text,
  p_message_id text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform axe_product.pinball_runtime_require_key(p_runtime_key);
  if p_channel_id is null or p_channel_id !~ '^[0-9]{15,22}$' then
    raise exception 'Invalid channel id.' using errcode = '22023';
  end if;
  if p_message_id is not null and p_message_id !~ '^[0-9]{15,22}$' then
    raise exception 'Invalid message id.' using errcode = '22023';
  end if;

  insert into axe_product.pinball_help_panels(company_id, channel_id, message_id, updated_at)
  values (p_company_id, p_channel_id, p_message_id, now())
  on conflict (company_id) do update set
    channel_id = excluded.channel_id,
    message_id = excluded.message_id,
    updated_at = now();
end;
$$;

-- -----------------------------------------------------------------------------
-- 5) Session creation / anti-spam
-- -----------------------------------------------------------------------------
create or replace function axe_product.bot_runtime_create_pinball_session(
  p_runtime_key text,
  p_guild_id text,
  p_channel_id text,
  p_host_discord_user_id text,
  p_host_display_name text,
  p_item_name text,
  p_item_kind text,
  p_item_detail jsonb,
  p_balls_per_person integer,
  p_note text,
  p_request_key text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_company_id uuid;
  v_item_name text := regexp_replace(btrim(coalesce(p_item_name,'')), '\s+', ' ', 'g');
  v_item_key text;
  v_host_name text := left(regexp_replace(btrim(coalesce(p_host_display_name,'')), '\s+', ' ', 'g'), 100);
  v_note text := nullif(left(btrim(coalesce(p_note,'')), 200), '');
  v_kind text := case when p_item_kind = 'modbook' then 'modbook' else 'item' end;
  v_id uuid;
  v_existing uuid;
  v_active_company integer;
  v_active_host integer;
begin
  perform axe_product.pinball_runtime_require_key(p_runtime_key);

  if p_guild_id !~ '^[0-9]{15,22}$' or p_channel_id !~ '^[0-9]{15,22}$'
     or p_host_discord_user_id !~ '^[0-9]{15,22}$' then
    raise exception 'Discord 정보가 올바르지 않습니다.' using errcode = '22023';
  end if;
  if char_length(v_item_name) < 1 or char_length(v_item_name) > 60 then
    raise exception '아이템 이름은 1~60자로 입력해주세요.' using errcode = '22023';
  end if;
  if v_item_name ~* '(https?://|www\.|discord\.gg|<@|@everyone|@here)' then
    raise exception '아이템 이름에는 링크나 Discord 멘션을 사용할 수 없습니다.' using errcode = '22023';
  end if;
  if coalesce(p_balls_per_person,0) < 1 or p_balls_per_person > 20 then
    raise exception '1인당 볼 수는 1~20개만 설정할 수 있습니다.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_request_key,'')) < 8 or char_length(p_request_key) > 120 then
    raise exception '요청 키가 올바르지 않습니다.' using errcode = '22023';
  end if;
  if v_host_name = '' then v_host_name := '멤버'; end if;
  v_item_key := lower(v_item_name);

  select c.id into v_company_id
  from axe_product.companies c
  join axe_product.discord_connections dc
    on dc.company_id = c.id and dc.status = 'connected' and dc.guild_id = p_guild_id
  join axe_product.company_modules cm
    on cm.company_id = c.id and cm.module_key = 'pinball' and cm.enabled = true
  where c.status = 'active'
    and nullif(btrim(cm.settings->>'channel_id'),'') = p_channel_id
  limit 1;

  if v_company_id is null then
    raise exception '핀볼 모집 채널 설정을 찾을 수 없습니다.' using errcode = '42501';
  end if;

  if not exists(
    select 1 from axe_product.company_memberships m
    where m.company_id = v_company_id
      and m.discord_user_id = p_host_discord_user_id
      and m.status = 'active'
  ) then
    raise exception 'AXE PRODUCT 활동 멤버만 모집을 만들 수 있습니다.' using errcode = '42501';
  end if;

  -- Serialize company creation checks so company/host caps and idempotency stay race-safe.
  perform pg_advisory_xact_lock(hashtextextended('pinball-create:' || v_company_id::text, 0));

  -- Idempotency after the lock: Discord retry/double-submit returns the same session.
  select s.id into v_existing
  from axe_product.pinball_sessions s
  where s.company_id = v_company_id and s.request_key = p_request_key
  limit 1;
  if v_existing is not null then
    return axe_product.pinball_session_payload(v_existing);
  end if;

  update axe_product.pinball_sessions
  set status = 'expired', updated_at = now()
  where company_id = v_company_id and status = 'open' and expires_at <= now();

  if exists(
    select 1 from axe_product.pinball_sessions s
    where s.company_id = v_company_id
      and s.host_discord_user_id = p_host_discord_user_id
      and s.created_at > now() - interval '10 seconds'
  ) then
    raise exception '모집을 너무 빠르게 연속 생성하고 있습니다. 잠시 후 다시 시도해주세요.' using errcode = '22023';
  end if;

  if (
    select count(*)
    from axe_product.pinball_sessions s
    where s.company_id = v_company_id
      and s.host_discord_user_id = p_host_discord_user_id
      and s.created_at > now() - interval '10 minutes'
  ) >= 6 then
    raise exception '짧은 시간에 모집 생성이 너무 많습니다. 잠시 후 다시 시도해주세요.' using errcode = '22023';
  end if;

  select count(*) into v_active_company
  from axe_product.pinball_sessions s
  where s.company_id = v_company_id and s.status = 'open';
  if v_active_company >= 8 then
    raise exception '회사에서 동시에 진행할 수 있는 핀볼 모집은 최대 8개입니다.' using errcode = '22023';
  end if;

  select count(*) into v_active_host
  from axe_product.pinball_sessions s
  where s.company_id = v_company_id
    and s.host_discord_user_id = p_host_discord_user_id
    and s.status = 'open';
  if v_active_host >= 2 then
    raise exception '한 사람이 동시에 진행할 수 있는 핀볼 모집은 최대 2개입니다.' using errcode = '22023';
  end if;

  if exists(
    select 1 from axe_product.pinball_sessions s
    where s.company_id = v_company_id
      and s.host_discord_user_id = p_host_discord_user_id
      and s.status = 'open'
      and s.item_name_key = v_item_key
  ) then
    raise exception '같은 아이템으로 이미 진행 중인 모집이 있습니다.' using errcode = '22023';
  end if;

  insert into axe_product.pinball_sessions(
    company_id, guild_id, channel_id,
    host_discord_user_id, host_display_name,
    item_name, item_name_key, item_kind, item_detail,
    balls_per_person, note, request_key, expires_at
  ) values (
    v_company_id, p_guild_id, p_channel_id,
    p_host_discord_user_id, v_host_name,
    v_item_name, v_item_key, v_kind, coalesce(p_item_detail,'{}'::jsonb),
    p_balls_per_person, v_note, p_request_key, now() + interval '24 hours'
  ) returning id into v_id;

  return axe_product.pinball_session_payload(v_id);
end;
$$;

create or replace function axe_product.bot_runtime_save_pinball_message(
  p_runtime_key text,
  p_session_id uuid,
  p_message_id text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform axe_product.pinball_runtime_require_key(p_runtime_key);
  if p_message_id is not null and p_message_id !~ '^[0-9]{15,22}$' then
    raise exception 'Invalid message id.' using errcode = '22023';
  end if;
  update axe_product.pinball_sessions
  set message_id = p_message_id, updated_at = now()
  where id = p_session_id;
  if not found then raise exception '핀볼 모집을 찾을 수 없습니다.' using errcode = '22023'; end if;
  return axe_product.pinball_session_payload(p_session_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) Active sessions + participant toggle
-- -----------------------------------------------------------------------------
create or replace function axe_product.bot_runtime_get_pinball_active_sessions(p_runtime_key text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_result jsonb;
begin
  perform axe_product.pinball_runtime_require_key(p_runtime_key);

  update axe_product.pinball_sessions
  set status = 'expired', updated_at = now()
  where status = 'open' and expires_at <= now();

  -- Turning the module off or moving its channel retires old open recruitments instead
  -- of letting them reappear later or keep consuming the company active-session cap.
  update axe_product.pinball_sessions s
  set status = 'cancelled', cancelled_at = coalesce(s.cancelled_at, now()), updated_at = now()
  where s.status = 'open'
    and not exists (
      select 1
      from axe_product.company_modules cm
      where cm.company_id = s.company_id
        and cm.module_key = 'pinball'
        and cm.enabled = true
        and nullif(btrim(cm.settings->>'channel_id'),'') = s.channel_id
    );

  select coalesce(jsonb_agg(axe_product.pinball_session_payload(s.id) order by s.created_at asc), '[]'::jsonb)
  into v_result
  from axe_product.pinball_sessions s
  join axe_product.companies c on c.id = s.company_id and c.status = 'active'
  join axe_product.discord_connections dc on dc.company_id = s.company_id and dc.status = 'connected'
  where s.status = 'open';

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

create or replace function axe_product.bot_runtime_toggle_pinball_participant(
  p_runtime_key text,
  p_session_id uuid,
  p_discord_user_id text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_session axe_product.pinball_sessions%rowtype;
  v_name text := left(regexp_replace(btrim(coalesce(p_display_name,'')), '\s+', ' ', 'g'), 100);
  v_active boolean;
  v_updated timestamptz;
  v_count integer;
  v_joined boolean;
begin
  perform axe_product.pinball_runtime_require_key(p_runtime_key);
  if p_discord_user_id !~ '^[0-9]{15,22}$' then
    raise exception 'Discord 사용자 정보가 올바르지 않습니다.' using errcode = '22023';
  end if;
  if v_name = '' then v_name := '참가자'; end if;

  select * into v_session
  from axe_product.pinball_sessions
  where id = p_session_id
  for update;
  if not found then raise exception '핀볼 모집을 찾을 수 없습니다.' using errcode = '22023'; end if;

  if v_session.status = 'open' and v_session.expires_at <= now() then
    update axe_product.pinball_sessions set status='expired', updated_at=now() where id=v_session.id;
    raise exception '모집 시간이 만료되었습니다.' using errcode = '22023';
  end if;
  if v_session.status <> 'open' then
    raise exception '이미 종료된 모집입니다.' using errcode = '22023';
  end if;

  if not exists(
    select 1 from axe_product.company_modules cm
    where cm.company_id = v_session.company_id
      and cm.module_key = 'pinball'
      and cm.enabled = true
      and nullif(btrim(cm.settings->>'channel_id'),'') = v_session.channel_id
  ) then
    raise exception '현재 회사에서 핀볼 모집 기능을 사용할 수 없습니다.' using errcode = '42501';
  end if;

  if not exists(
    select 1 from axe_product.company_memberships m
    where m.company_id = v_session.company_id
      and m.discord_user_id = p_discord_user_id
      and m.status = 'active'
  ) then
    raise exception 'AXE PRODUCT 활동 멤버만 참여할 수 있습니다.' using errcode = '42501';
  end if;

  select p.active, p.updated_at into v_active, v_updated
  from axe_product.pinball_participants p
  where p.session_id = p_session_id and p.discord_user_id = p_discord_user_id
  for update;

  if v_updated is not null and v_updated > now() - interval '1 second' then
    raise exception '버튼을 너무 빠르게 누르고 있습니다. 잠시 후 다시 시도해주세요.' using errcode = '22023';
  end if;

  if coalesce(v_active, false) then
    update axe_product.pinball_participants
    set active=false, left_at=now(), updated_at=now(), display_name=v_name
    where session_id=p_session_id and discord_user_id=p_discord_user_id;
    v_joined := false;
  else
    select count(*) into v_count
    from axe_product.pinball_participants p
    where p.session_id = p_session_id and p.active = true;
    if v_count >= 40 then
      raise exception '한 모집에는 최대 40명까지 참여할 수 있습니다.' using errcode = '22023';
    end if;

    insert into axe_product.pinball_participants(
      session_id, company_id, discord_user_id, display_name, active, joined_at, left_at, updated_at
    ) values (
      p_session_id, v_session.company_id, p_discord_user_id, v_name, true, now(), null, now()
    )
    on conflict (session_id, discord_user_id) do update set
      active=true,
      display_name=excluded.display_name,
      joined_at=now(),
      left_at=null,
      updated_at=now();
    v_joined := true;
  end if;

  update axe_product.pinball_sessions set updated_at=now() where id=p_session_id;
  return jsonb_build_object('joined', v_joined, 'session', axe_product.pinball_session_payload(p_session_id));
end;
$$;

-- -----------------------------------------------------------------------------
-- 7) Close / cancel
-- -----------------------------------------------------------------------------
create or replace function axe_product.bot_runtime_finish_pinball_session(
  p_runtime_key text,
  p_session_id uuid,
  p_actor_discord_user_id text,
  p_is_admin boolean,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_session axe_product.pinball_sessions%rowtype;
  v_action text := lower(btrim(coalesce(p_action,'')));
begin
  perform axe_product.pinball_runtime_require_key(p_runtime_key);
  if p_actor_discord_user_id !~ '^[0-9]{15,22}$' then
    raise exception 'Discord 사용자 정보가 올바르지 않습니다.' using errcode = '22023';
  end if;
  if v_action not in ('close','cancel') then
    raise exception '종료 동작이 올바르지 않습니다.' using errcode = '22023';
  end if;

  select * into v_session
  from axe_product.pinball_sessions
  where id = p_session_id
  for update;
  if not found then raise exception '핀볼 모집을 찾을 수 없습니다.' using errcode = '22023'; end if;

  if v_session.status <> 'open' then
    raise exception '이미 종료된 모집입니다.' using errcode = '22023';
  end if;

  if p_actor_discord_user_id <> v_session.host_discord_user_id and coalesce(p_is_admin,false) = false then
    raise exception '주최자 또는 회사 관리자만 모집을 종료할 수 있습니다.' using errcode = '42501';
  end if;

  if v_action = 'close' and not exists(
    select 1 from axe_product.pinball_participants p
    where p.session_id = v_session.id and p.active = true
  ) then
    raise exception '참여자가 없어 마감할 수 없습니다. 모집 취소를 사용해주세요.' using errcode = '22023';
  end if;

  if v_action = 'close' then
    update axe_product.pinball_sessions
    set status='closed', closed_at=now(), updated_at=now()
    where id=v_session.id;
  else
    update axe_product.pinball_sessions
    set status='cancelled', cancelled_at=now(), updated_at=now()
    where id=v_session.id;
  end if;

  return axe_product.pinball_session_payload(v_session.id);
end;
$$;

-- -----------------------------------------------------------------------------
-- 8) Grants: runtime key remains the real authorization boundary.
-- -----------------------------------------------------------------------------
revoke all on function axe_product.bot_runtime_get_pinball_configs(text) from public;
revoke all on function axe_product.bot_runtime_save_pinball_help_panel(text,uuid,text,text) from public;
revoke all on function axe_product.bot_runtime_create_pinball_session(text,text,text,text,text,text,text,jsonb,integer,text,text) from public;
revoke all on function axe_product.bot_runtime_save_pinball_message(text,uuid,text) from public;
revoke all on function axe_product.bot_runtime_get_pinball_active_sessions(text) from public;
revoke all on function axe_product.bot_runtime_toggle_pinball_participant(text,uuid,text,text) from public;
revoke all on function axe_product.bot_runtime_finish_pinball_session(text,uuid,text,boolean,text) from public;

grant execute on function axe_product.bot_runtime_get_pinball_configs(text) to anon, authenticated, service_role;
grant execute on function axe_product.bot_runtime_save_pinball_help_panel(text,uuid,text,text) to anon, authenticated, service_role;
grant execute on function axe_product.bot_runtime_create_pinball_session(text,text,text,text,text,text,text,jsonb,integer,text,text) to anon, authenticated, service_role;
grant execute on function axe_product.bot_runtime_save_pinball_message(text,uuid,text) to anon, authenticated, service_role;
grant execute on function axe_product.bot_runtime_get_pinball_active_sessions(text) to anon, authenticated, service_role;
grant execute on function axe_product.bot_runtime_toggle_pinball_participant(text,uuid,text,text) to anon, authenticated, service_role;
grant execute on function axe_product.bot_runtime_finish_pinball_session(text,uuid,text,boolean,text) to anon, authenticated, service_role;

commit;
