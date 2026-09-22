-- AXE PRODUCT 3.25.0
-- Private suggestion board (author <-> PLATFORM OWNER only)
-- Replaces the customer-facing feedback modal with a private site-native thread board.
-- STAGING FIRST. Schema: axe_product

begin;

-- -----------------------------------------------------------------------------
-- 1) Private suggestion threads
-- -----------------------------------------------------------------------------
create table if not exists axe_product.suggestions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_membership_id uuid references axe_product.company_memberships(id) on delete set null,
  author_name text not null,
  author_discord_user_id text,
  category text not null default 'improvement',
  title text not null,
  body text not null,
  status text not null default 'pending',
  platform_unread boolean not null default true,
  customer_unread boolean not null default false,
  answered_at timestamptz,
  answered_by_user_id uuid references auth.users(id) on delete set null,
  dm_notified_at timestamptz,
  dm_notification_error text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suggestions_category_check check (category in ('improvement','bug','other')),
  constraint suggestions_status_check check (status in ('pending','checking','complete')),
  constraint suggestions_title_check check (char_length(btrim(title)) between 1 and 120),
  constraint suggestions_body_check check (char_length(btrim(body)) between 1 and 4000)
);

create table if not exists axe_product.suggestion_messages (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references axe_product.suggestions(id) on delete cascade,
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_type text not null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint suggestion_messages_author_type_check check (author_type in ('customer','platform')),
  constraint suggestion_messages_body_check check (char_length(btrim(body)) between 1 and 4000)
);

create table if not exists axe_product.suggestion_attachments (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references axe_product.suggestions(id) on delete cascade,
  message_id uuid references axe_product.suggestion_messages(id) on delete cascade,
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  storage_path text not null unique,
  file_name text,
  mime_type text not null,
  size_bytes bigint not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint suggestion_attachments_mime_check check (mime_type in ('image/jpeg','image/png','image/webp')),
  constraint suggestion_attachments_size_check check (size_bytes > 0 and size_bytes <= 10485760)
);

create index if not exists idx_suggestions_author_last
  on axe_product.suggestions(created_by_user_id, last_message_at desc);
create index if not exists idx_suggestions_company_author_last
  on axe_product.suggestions(company_id, created_by_user_id, last_message_at desc);
create index if not exists idx_suggestions_platform_queue
  on axe_product.suggestions(status, platform_unread, last_message_at desc);
create index if not exists idx_suggestion_messages_thread_created
  on axe_product.suggestion_messages(suggestion_id, created_at asc);
create index if not exists idx_suggestion_attachments_thread
  on axe_product.suggestion_attachments(suggestion_id, message_id, created_at asc);

alter table axe_product.suggestions enable row level security;
alter table axe_product.suggestion_messages enable row level security;
alter table axe_product.suggestion_attachments enable row level security;
revoke all on table axe_product.suggestions from anon, authenticated;
revoke all on table axe_product.suggestion_messages from anon, authenticated;
revoke all on table axe_product.suggestion_attachments from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2) Private attachment bucket
-- -----------------------------------------------------------------------------
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'axe-suggestion-attachments',
  'axe-suggestion-attachments',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function axe_product.suggestion_storage_can_read(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_company_text text := split_part(coalesce(p_name,''), '/', 1);
  v_suggestion_text text := split_part(coalesce(p_name,''), '/', 2);
  v_company uuid;
  v_suggestion uuid;
  v_owner uuid;
begin
  if auth.uid() is null then return false; end if;
  if v_company_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or v_suggestion_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;

  v_company := v_company_text::uuid;
  v_suggestion := v_suggestion_text::uuid;
  select s.created_by_user_id into v_owner
  from axe_product.suggestions s
  where s.id = v_suggestion and s.company_id = v_company;
  if not found then return false; end if;

  if axe_product.platform_is_admin() then return true; end if;
  if v_owner is distinct from auth.uid() then return false; end if;

  return exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id = v_company
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  );
end;
$$;

create or replace function axe_product.suggestion_storage_can_write(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_company_text text := split_part(coalesce(p_name,''), '/', 1);
  v_suggestion_text text := split_part(coalesce(p_name,''), '/', 2);
  v_user_text text := split_part(coalesce(p_name,''), '/', 3);
  v_company uuid;
  v_suggestion uuid;
  v_owner uuid;
begin
  if auth.uid() is null then return false; end if;
  if v_company_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or v_suggestion_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or v_user_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;
  if v_user_text::uuid <> auth.uid() then return false; end if;

  v_company := v_company_text::uuid;
  v_suggestion := v_suggestion_text::uuid;
  select s.created_by_user_id into v_owner
  from axe_product.suggestions s
  where s.id = v_suggestion and s.company_id = v_company;
  if not found then return false; end if;

  if axe_product.platform_is_admin() then return true; end if;
  if v_owner is distinct from auth.uid() then return false; end if;

  return exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id = v_company
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  );
end;
$$;

create or replace function axe_product.suggestion_storage_can_delete(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_company_text text := split_part(coalesce(p_name,''), '/', 1);
  v_suggestion_text text := split_part(coalesce(p_name,''), '/', 2);
  v_company uuid;
  v_suggestion uuid;
  v_owner uuid;
begin
  if auth.uid() is null then return false; end if;
  if v_company_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or v_suggestion_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;

  v_company := v_company_text::uuid;
  v_suggestion := v_suggestion_text::uuid;
  select s.created_by_user_id into v_owner
  from axe_product.suggestions s
  where s.id = v_suggestion and s.company_id = v_company;
  if not found then return false; end if;

  if axe_product.platform_is_admin() then return true; end if;
  if v_owner is distinct from auth.uid() then return false; end if;

  return exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id = v_company
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  );
end;
$$;

drop policy if exists axe_suggestion_attachments_read on storage.objects;
create policy axe_suggestion_attachments_read
on storage.objects for select to authenticated
using (bucket_id = 'axe-suggestion-attachments' and axe_product.suggestion_storage_can_read(name));

drop policy if exists axe_suggestion_attachments_insert on storage.objects;
create policy axe_suggestion_attachments_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'axe-suggestion-attachments' and axe_product.suggestion_storage_can_write(name));

drop policy if exists axe_suggestion_attachments_delete on storage.objects;
create policy axe_suggestion_attachments_delete
on storage.objects for delete to authenticated
using (bucket_id = 'axe-suggestion-attachments' and axe_product.suggestion_storage_can_delete(name));

-- -----------------------------------------------------------------------------
-- 3) Customer board: ONLY the logged-in author's own posts
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_suggestion_list(
  p_company_id uuid,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit,100),200));
  v_member boolean;
  v_counts jsonb;
  v_items jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  select exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  ) into v_member;
  if not v_member then
    raise exception '현재 회사의 활동 멤버만 건의게시판을 사용할 수 있습니다.' using errcode='42501';
  end if;

  select jsonb_build_object(
    'pending', count(*) filter (where s.status='pending'),
    'checking', count(*) filter (where s.status='checking'),
    'complete', count(*) filter (where s.status='complete'),
    'unread', count(*) filter (where s.customer_unread),
    'total', count(*)
  ) into v_counts
  from axe_product.suggestions s
  where s.company_id = p_company_id
    and s.created_by_user_id = auth.uid();

  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc),'[]'::jsonb)
  into v_items
  from (
    select
      s.id,
      s.company_id,
      s.category,
      s.title,
      left(s.body,260) as body_preview,
      s.status,
      s.author_name,
      s.created_at,
      s.updated_at,
      s.last_message_at,
      s.answered_at,
      s.dm_notified_at,
      s.customer_unread as unread,
      true as is_mine,
      (1 + (select count(*) from axe_product.suggestion_messages m where m.suggestion_id=s.id))::integer as message_count
    from axe_product.suggestions s
    where s.company_id = p_company_id
      and s.created_by_user_id = auth.uid()
    order by s.last_message_at desc
    limit v_limit
  ) x;

  return jsonb_build_object(
    'configured',true,
    'private',true,
    'counts',coalesce(v_counts,jsonb_build_object('pending',0,'checking',0,'complete',0,'unread',0,'total',0)),
    'items',coalesce(v_items,'[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4) Create suggestion with duplicate/rate guards
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_suggestion_create(
  p_company_id uuid,
  p_category text,
  p_title text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_membership axe_product.company_memberships%rowtype;
  v_category text := lower(btrim(coalesce(p_category,'improvement')));
  v_title text := btrim(coalesce(p_title,''));
  v_body text := btrim(coalesce(p_body,''));
  v_id uuid;
  v_name text;
  v_open_count integer;
  v_daily_count integer;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  if v_category not in ('improvement','bug','other') then
    raise exception '올바른 건의 유형이 아닙니다.' using errcode='22023';
  end if;
  if char_length(v_title) < 1 or char_length(v_title) > 120 then
    raise exception '제목은 1~120자로 입력해 주세요.' using errcode='22023';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 4000 then
    raise exception '내용은 1~4000자로 입력해 주세요.' using errcode='22023';
  end if;

  select cm.* into v_membership
  from axe_product.company_memberships cm
  where cm.company_id=p_company_id
    and cm.user_id=auth.uid()
    and coalesce(cm.status,'active')='active'
  limit 1;
  if not found then
    raise exception '현재 회사의 활동 멤버만 건의를 등록할 수 있습니다.' using errcode='42501';
  end if;

  -- Prevent accidental double submit from creating duplicate threads.
  select s.id into v_id
  from axe_product.suggestions s
  where s.company_id=p_company_id
    and s.created_by_user_id=auth.uid()
    and s.category=v_category
    and s.title=v_title
    and s.body=v_body
    and s.created_at > now() - interval '15 seconds'
  order by s.created_at desc
  limit 1;
  if v_id is not null then return v_id; end if;

  select count(*) into v_open_count
  from axe_product.suggestions s
  where s.company_id=p_company_id
    and s.created_by_user_id=auth.uid()
    and s.status in ('pending','checking');
  if v_open_count >= 10 then
    raise exception '처리 중인 건의가 10건입니다. 기존 건의가 처리된 뒤 새 건의를 등록해 주세요.' using errcode='22023';
  end if;

  select count(*) into v_daily_count
  from axe_product.suggestions s
  where s.created_by_user_id=auth.uid()
    and s.created_at > now() - interval '24 hours';
  if v_daily_count >= 30 then
    raise exception '24시간 내 건의 등록 한도를 초과했습니다.' using errcode='22023';
  end if;

  v_name := coalesce(
    nullif(btrim(v_membership.alias_name),''),
    nullif(btrim(v_membership.display_name),''),
    nullif(btrim(v_membership.discord_display_name),''),
    '사용자'
  );

  insert into axe_product.suggestions(
    company_id,created_by_user_id,created_by_membership_id,author_name,author_discord_user_id,
    category,title,body,status,platform_unread,customer_unread,last_message_at,created_at,updated_at
  ) values (
    p_company_id,auth.uid(),v_membership.id,v_name,nullif(btrim(v_membership.discord_user_id),''),
    v_category,v_title,v_body,'pending',true,false,now(),now(),now()
  ) returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5) Private thread detail: author OR PLATFORM OWNER only
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_suggestion_get(p_suggestion_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_s axe_product.suggestions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
  v_messages jsonb;
  v_root_attachments jsonb;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into v_s from axe_product.suggestions where id=p_suggestion_id;
  if not found then raise exception '건의를 찾을 수 없습니다.' using errcode='22023'; end if;

  select exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id=v_s.company_id
      and cm.user_id=auth.uid()
      and coalesce(cm.status,'active')='active'
  ) into v_member;

  if not v_platform and (not v_member or v_s.created_by_user_id is distinct from auth.uid()) then
    raise exception '이 건의는 작성자와 AXE PRODUCT 운영자만 볼 수 있습니다.' using errcode='42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'storage_path',a.storage_path,'file_name',a.file_name,'mime_type',a.mime_type,
    'size_bytes',a.size_bytes,'created_at',a.created_at
  ) order by a.created_at asc),'[]'::jsonb)
  into v_root_attachments
  from axe_product.suggestion_attachments a
  where a.suggestion_id=v_s.id and a.message_id is null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,
    'author_type',m.author_type,
    'author_name',m.author_name,
    'body',m.body,
    'created_at',m.created_at,
    'attachments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'storage_path',a.storage_path,'file_name',a.file_name,'mime_type',a.mime_type,
        'size_bytes',a.size_bytes,'created_at',a.created_at
      ) order by a.created_at asc)
      from axe_product.suggestion_attachments a
      where a.message_id=m.id
    ),'[]'::jsonb)
  ) order by m.created_at asc),'[]'::jsonb)
  into v_messages
  from axe_product.suggestion_messages m
  where m.suggestion_id=v_s.id;

  return jsonb_build_object(
    'id',v_s.id,
    'company_id',v_s.company_id,
    'company_name',(select c.name from axe_product.companies c where c.id=v_s.company_id),
    'category',v_s.category,
    'title',v_s.title,
    'body',v_s.body,
    'status',v_s.status,
    'author_name',v_s.author_name,
    'created_at',v_s.created_at,
    'updated_at',v_s.updated_at,
    'last_message_at',v_s.last_message_at,
    'answered_at',v_s.answered_at,
    'dm_notified_at',v_s.dm_notified_at,
    'unread',case when v_platform then v_s.platform_unread else v_s.customer_unread end,
    'viewer_is_platform',v_platform,
    'viewer_can_answer',v_platform,
    'viewer_can_follow_up',not v_platform and v_s.created_by_user_id=auth.uid(),
    'viewer_can_delete',v_platform or v_s.created_by_user_id=auth.uid(),
    'attachments',coalesce(v_root_attachments,'[]'::jsonb),
    'messages',coalesce(v_messages,'[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) Replies: PLATFORM answer / author follow-up only
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_suggestion_add_message(
  p_suggestion_id uuid,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_s axe_product.suggestions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member axe_product.company_memberships%rowtype;
  v_body text := btrim(coalesce(p_body,''));
  v_name text;
  v_message_id uuid;
  v_message_count integer;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  if char_length(v_body)<1 or char_length(v_body)>4000 then
    raise exception '답변 내용은 1~4000자로 입력해 주세요.' using errcode='22023';
  end if;

  select * into v_s from axe_product.suggestions where id=p_suggestion_id for update;
  if not found then raise exception '건의를 찾을 수 없습니다.' using errcode='22023'; end if;

  select count(*) into v_message_count
  from axe_product.suggestion_messages m
  where m.suggestion_id=v_s.id;
  if v_message_count >= 100 then
    raise exception '이 건의는 메시지 한도에 도달했습니다. 새 건의로 이어서 남겨 주세요.' using errcode='22023';
  end if;

  if v_platform then
    v_name := 'AXE PRODUCT 운영자';
    insert into axe_product.suggestion_messages(suggestion_id,company_id,author_user_id,author_type,author_name,body)
    values(v_s.id,v_s.company_id,auth.uid(),'platform',v_name,v_body)
    returning id into v_message_id;

    update axe_product.suggestions
    set status='complete',platform_unread=false,customer_unread=true,
        answered_at=now(),answered_by_user_id=auth.uid(),dm_notified_at=null,dm_notification_error=null,
        last_message_at=now(),updated_at=now()
    where id=v_s.id;
  else
    select cm.* into v_member
    from axe_product.company_memberships cm
    where cm.company_id=v_s.company_id
      and cm.user_id=auth.uid()
      and coalesce(cm.status,'active')='active'
    limit 1;
    if not found then raise exception '현재 회사의 활동 멤버만 사용할 수 있습니다.' using errcode='42501'; end if;
    if v_s.created_by_user_id is distinct from auth.uid() then
      raise exception '추가 메시지는 최초 작성자만 등록할 수 있습니다.' using errcode='42501';
    end if;

    v_name := coalesce(
      nullif(btrim(v_member.alias_name),''),
      nullif(btrim(v_member.display_name),''),
      nullif(btrim(v_member.discord_display_name),''),
      '사용자'
    );
    insert into axe_product.suggestion_messages(suggestion_id,company_id,author_user_id,author_type,author_name,body)
    values(v_s.id,v_s.company_id,auth.uid(),'customer',v_name,v_body)
    returning id into v_message_id;

    update axe_product.suggestions
    set status='pending',platform_unread=true,customer_unread=false,
        answered_at=null,answered_by_user_id=null,dm_notified_at=null,dm_notification_error=null,
        last_message_at=now(),updated_at=now()
    where id=v_s.id;
  end if;

  return jsonb_build_object(
    'message_id',v_message_id,
    'status',case when v_platform then 'complete' else 'pending' end,
    'viewer_is_platform',v_platform
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 7) Attach image metadata
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_suggestion_attach_file(
  p_suggestion_id uuid,
  p_message_id uuid,
  p_storage_path text,
  p_file_name text default null,
  p_mime_type text default null,
  p_size_bytes bigint default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_s axe_product.suggestions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
  v_id uuid;
  v_count integer;
  v_mime text := lower(btrim(coalesce(p_mime_type,'')));
  v_path text := btrim(coalesce(p_storage_path,''));
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into v_s from axe_product.suggestions where id=p_suggestion_id;
  if not found then raise exception '건의를 찾을 수 없습니다.' using errcode='22023'; end if;

  select exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id=v_s.company_id
      and cm.user_id=auth.uid()
      and coalesce(cm.status,'active')='active'
  ) into v_member;

  if not v_platform and (not v_member or v_s.created_by_user_id is distinct from auth.uid()) then
    raise exception '건의 작성자만 사진을 첨부할 수 있습니다.' using errcode='42501';
  end if;
  if v_mime not in ('image/jpeg','image/png','image/webp') then
    raise exception 'JPG, PNG, WEBP 이미지만 첨부할 수 있습니다.' using errcode='22023';
  end if;
  if coalesce(p_size_bytes,0)<=0 or p_size_bytes>10485760 then
    raise exception '사진 한 장은 10MB 이하만 첨부할 수 있습니다.' using errcode='22023';
  end if;
  if split_part(v_path,'/',1)<>v_s.company_id::text
     or split_part(v_path,'/',2)<>v_s.id::text
     or split_part(v_path,'/',3)<>auth.uid()::text then
    raise exception '건의 첨부파일 경로가 올바르지 않습니다.' using errcode='22023';
  end if;

  if p_message_id is not null and not exists(
    select 1 from axe_product.suggestion_messages m
    where m.id=p_message_id and m.suggestion_id=v_s.id
  ) then
    raise exception '메시지를 찾을 수 없습니다.' using errcode='22023';
  end if;

  select count(*) into v_count
  from axe_product.suggestion_attachments a
  where a.suggestion_id=v_s.id
    and a.message_id is not distinct from p_message_id;
  if v_count>=5 then
    raise exception '게시글 또는 답변 하나에는 사진을 최대 5장까지 첨부할 수 있습니다.' using errcode='22023';
  end if;

  insert into axe_product.suggestion_attachments(
    suggestion_id,message_id,company_id,storage_path,file_name,mime_type,size_bytes,created_by_user_id
  ) values (
    v_s.id,p_message_id,v_s.company_id,v_path,
    nullif(left(btrim(coalesce(p_file_name,'')),240),''),v_mime,p_size_bytes,auth.uid()
  ) returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 8) Delete thread
-- -----------------------------------------------------------------------------
create or replace function axe_product.web_suggestion_delete(p_suggestion_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_s axe_product.suggestions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into v_s from axe_product.suggestions where id=p_suggestion_id for update;
  if not found then return false; end if;

  select exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id=v_s.company_id
      and cm.user_id=auth.uid()
      and coalesce(cm.status,'active')='active'
  ) into v_member;

  if not v_platform and (not v_member or v_s.created_by_user_id is distinct from auth.uid()) then
    raise exception '건의 작성자만 삭제할 수 있습니다.' using errcode='42501';
  end if;

  delete from axe_product.suggestions where id=v_s.id;
  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9) PLATFORM OWNER status / read markers / global queue
-- -----------------------------------------------------------------------------
create or replace function axe_product.platform_suggestion_set_status(
  p_suggestion_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_status text := lower(btrim(coalesce(p_status,'')));
  v_rows integer;
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  if v_status not in ('pending','checking','complete') then
    raise exception '올바른 상태가 아닙니다.' using errcode='22023';
  end if;

  update axe_product.suggestions
  set status=v_status,
      platform_unread=false,
      customer_unread=case when v_status='complete' then true else customer_unread end,
      answered_at=case when v_status='complete' then coalesce(answered_at,now()) else answered_at end,
      answered_by_user_id=case when v_status='complete' then coalesce(answered_by_user_id,auth.uid()) else answered_by_user_id end,
      updated_at=now()
  where id=p_suggestion_id;
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception '건의를 찾을 수 없습니다.' using errcode='22023'; end if;

  return jsonb_build_object('updated',true,'status',v_status);
end;
$$;

create or replace function axe_product.web_suggestion_mark_seen(p_suggestion_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_s axe_product.suggestions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into v_s from axe_product.suggestions where id=p_suggestion_id;
  if not found then return false; end if;

  select exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id=v_s.company_id
      and cm.user_id=auth.uid()
      and coalesce(cm.status,'active')='active'
  ) into v_member;

  if not v_platform and (not v_member or v_s.created_by_user_id is distinct from auth.uid()) then
    raise exception '이 건의를 확인할 권한이 없습니다.' using errcode='42501';
  end if;

  if v_platform then
    update axe_product.suggestions set platform_unread=false where id=p_suggestion_id;
  else
    update axe_product.suggestions set customer_unread=false
    where id=p_suggestion_id and created_by_user_id=auth.uid();
  end if;
  return true;
end;
$$;

create or replace function axe_product.platform_suggestion_list(p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_limit integer := greatest(1,least(coalesce(p_limit,100),200));
  v_counts jsonb;
  v_items jsonb;
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;

  select jsonb_build_object(
    'pending',count(*) filter(where s.status='pending'),
    'checking',count(*) filter(where s.status='checking'),
    'complete',count(*) filter(where s.status='complete'),
    'unread',count(*) filter(where s.platform_unread),
    'total',count(*)
  ) into v_counts
  from axe_product.suggestions s;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_status,x.last_message_at desc),'[]'::jsonb)
  into v_items
  from (
    select
      s.id,
      s.company_id,
      c.name as company_name,
      s.category,
      s.title,
      s.status,
      s.author_name,
      s.platform_unread as unread,
      s.created_at,
      s.last_message_at,
      s.answered_at,
      s.dm_notified_at,
      (1 + (select count(*) from axe_product.suggestion_messages m where m.suggestion_id=s.id))::integer as message_count,
      case s.status when 'pending' then 0 when 'checking' then 1 else 2 end as sort_status
    from axe_product.suggestions s
    join axe_product.companies c on c.id=s.company_id
    order by case s.status when 'pending' then 0 when 'checking' then 1 else 2 end,s.last_message_at desc
    limit v_limit
  ) x;

  return jsonb_build_object(
    'counts',coalesce(v_counts,jsonb_build_object('pending',0,'checking',0,'complete',0,'unread',0,'total',0)),
    'items',coalesce(v_items,'[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 10) Discord notification target/result (PLATFORM OWNER only)
-- -----------------------------------------------------------------------------
create or replace function axe_product.platform_suggestion_notification_target(p_suggestion_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_s axe_product.suggestions%rowtype;
  v_company_name text;
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  select * into v_s from axe_product.suggestions where id=p_suggestion_id;
  if not found then raise exception '건의를 찾을 수 없습니다.' using errcode='22023'; end if;
  select c.name into v_company_name from axe_product.companies c where c.id=v_s.company_id;

  return jsonb_build_object(
    'suggestion_id',v_s.id,
    'company_id',v_s.company_id,
    'company_name',v_company_name,
    'title',v_s.title,
    'category',v_s.category,
    'discord_user_id',coalesce(
      (select nullif(btrim(cm.discord_user_id),'') from axe_product.company_memberships cm where cm.id=v_s.created_by_membership_id limit 1),
      v_s.author_discord_user_id
    ),
    'status',v_s.status
  );
end;
$$;

create or replace function axe_product.platform_suggestion_mark_dm_result(
  p_suggestion_id uuid,
  p_sent boolean,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  update axe_product.suggestions
  set dm_notified_at=case when coalesce(p_sent,false) then now() else null end,
      dm_notification_error=case when coalesce(p_sent,false) then null else nullif(left(coalesce(p_error,''),500),'') end,
      updated_at=now()
  where id=p_suggestion_id;
  return found;
end;
$$;

-- -----------------------------------------------------------------------------
-- 11) Grants: browser uses RPCs only
-- -----------------------------------------------------------------------------
revoke all on function axe_product.suggestion_storage_can_read(text) from public;
revoke all on function axe_product.suggestion_storage_can_write(text) from public;
revoke all on function axe_product.suggestion_storage_can_delete(text) from public;
revoke all on function axe_product.web_suggestion_list(uuid,integer) from public;
revoke all on function axe_product.web_suggestion_create(uuid,text,text,text) from public;
revoke all on function axe_product.web_suggestion_get(uuid) from public;
revoke all on function axe_product.web_suggestion_add_message(uuid,text) from public;
revoke all on function axe_product.web_suggestion_attach_file(uuid,uuid,text,text,text,bigint) from public;
revoke all on function axe_product.web_suggestion_delete(uuid) from public;
revoke all on function axe_product.platform_suggestion_set_status(uuid,text) from public;
revoke all on function axe_product.web_suggestion_mark_seen(uuid) from public;
revoke all on function axe_product.platform_suggestion_list(integer) from public;
revoke all on function axe_product.platform_suggestion_notification_target(uuid) from public;
revoke all on function axe_product.platform_suggestion_mark_dm_result(uuid,boolean,text) from public;

grant execute on function axe_product.suggestion_storage_can_read(text) to authenticated;
grant execute on function axe_product.suggestion_storage_can_write(text) to authenticated;
grant execute on function axe_product.suggestion_storage_can_delete(text) to authenticated;
grant execute on function axe_product.web_suggestion_list(uuid,integer) to authenticated;
grant execute on function axe_product.web_suggestion_create(uuid,text,text,text) to authenticated;
grant execute on function axe_product.web_suggestion_get(uuid) to authenticated;
grant execute on function axe_product.web_suggestion_add_message(uuid,text) to authenticated;
grant execute on function axe_product.web_suggestion_attach_file(uuid,uuid,text,text,text,bigint) to authenticated;
grant execute on function axe_product.web_suggestion_delete(uuid) to authenticated;
grant execute on function axe_product.platform_suggestion_set_status(uuid,text) to authenticated;
grant execute on function axe_product.web_suggestion_mark_seen(uuid) to authenticated;
grant execute on function axe_product.platform_suggestion_list(integer) to authenticated;
grant execute on function axe_product.platform_suggestion_notification_target(uuid) to authenticated;
grant execute on function axe_product.platform_suggestion_mark_dm_result(uuid,boolean,text) to authenticated;

commit;
