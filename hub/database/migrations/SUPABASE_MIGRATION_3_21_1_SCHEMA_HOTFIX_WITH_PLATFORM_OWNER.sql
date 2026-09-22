-- AXE PRODUCT 3.21.1 · SCHEMA HOTFIX R1
-- PLATFORM OWNER subscriptions + FUND ledger evidence attachments
-- IMPORTANT: PRODUCT STAGING ONLY. Do not apply to LIVE AXE.
-- Correct schema: axe_product (the WEB client is configured with db.schema = 'axe_product').
-- This script is intentionally idempotent and includes the PLATFORM OWNER bootstrap UUID.

begin;

create extension if not exists pgcrypto;

-- Fail clearly if this is the wrong database/project.
do $$
begin
  if to_regnamespace('axe_product') is null then
    raise exception 'axe_product schema does not exist in this database';
  end if;
  if to_regclass('axe_product.companies') is null then
    raise exception 'axe_product.companies does not exist in this database';
  end if;
  if to_regclass('axe_product.company_memberships') is null then
    raise exception 'axe_product.company_memberships does not exist in this database';
  end if;
end $$;

-- ============================================================
-- 1) PLATFORM OWNER / SUPER ADMIN
-- ============================================================
create table if not exists axe_product.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table axe_product.platform_admins enable row level security;
revoke all on table axe_product.platform_admins from anon, authenticated;

-- Create the current 3.21 subscription shape when the table does not exist.
create table if not exists axe_product.company_subscriptions (
  company_id uuid primary key references axe_product.companies(id) on delete cascade,
  plan text not null default 'standard',
  status text not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  grace_until timestamptz,
  memo text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility upgrade for the earlier 3.20.2 draft shape, if it was ever applied.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='plan_code'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='plan'
  ) then
    execute 'alter table axe_product.company_subscriptions rename column plan_code to plan';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='starts_on'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='starts_at'
  ) then
    execute 'alter table axe_product.company_subscriptions rename column starts_on to starts_at';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='ends_on'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='ends_at'
  ) then
    execute 'alter table axe_product.company_subscriptions rename column ends_on to ends_at';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='notes'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='axe_product' and table_name='company_subscriptions' and column_name='memo'
  ) then
    execute 'alter table axe_product.company_subscriptions rename column notes to memo';
  end if;
end $$;

-- Ensure every current 3.21 column exists even after an older draft migration.
alter table axe_product.company_subscriptions add column if not exists plan text;
alter table axe_product.company_subscriptions add column if not exists starts_at timestamptz;
alter table axe_product.company_subscriptions add column if not exists ends_at timestamptz;
alter table axe_product.company_subscriptions add column if not exists grace_until timestamptz;
alter table axe_product.company_subscriptions add column if not exists memo text;
alter table axe_product.company_subscriptions add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table axe_product.company_subscriptions add column if not exists created_at timestamptz not null default now();
alter table axe_product.company_subscriptions add column if not exists updated_at timestamptz not null default now();

-- If an earlier draft left DATE columns, promote them to timestamptz using Korea midnight/end-of-day semantics.
do $$
declare
  v_type text;
begin
  select data_type into v_type from information_schema.columns
  where table_schema='axe_product' and table_name='company_subscriptions' and column_name='starts_at';
  if v_type = 'date' then
    execute $q$alter table axe_product.company_subscriptions alter column starts_at type timestamptz using (starts_at::timestamp at time zone 'Asia/Seoul')$q$;
  end if;

  select data_type into v_type from information_schema.columns
  where table_schema='axe_product' and table_name='company_subscriptions' and column_name='ends_at';
  if v_type = 'date' then
    execute $q$alter table axe_product.company_subscriptions alter column ends_at type timestamptz using ((ends_at::timestamp + interval '23 hours 59 minutes 59 seconds') at time zone 'Asia/Seoul')$q$;
  end if;

  select data_type into v_type from information_schema.columns
  where table_schema='axe_product' and table_name='company_subscriptions' and column_name='grace_until';
  if v_type = 'date' then
    execute $q$alter table axe_product.company_subscriptions alter column grace_until type timestamptz using ((grace_until::timestamp + interval '23 hours 59 minutes 59 seconds') at time zone 'Asia/Seoul')$q$;
  end if;
end $$;

-- Normalize the earlier draft values before replacing the status constraint.
alter table axe_product.company_subscriptions drop constraint if exists company_subscriptions_status_check;
update axe_product.company_subscriptions
set status = case status
  when 'suspended' then 'paused'
  when 'unlimited' then 'lifetime'
  else status
end;
update axe_product.company_subscriptions set plan='standard' where plan is null or btrim(plan)='';
alter table axe_product.company_subscriptions alter column plan set default 'standard';
alter table axe_product.company_subscriptions alter column plan set not null;
alter table axe_product.company_subscriptions alter column status set default 'active';
alter table axe_product.company_subscriptions alter column status set not null;
alter table axe_product.company_subscriptions add constraint company_subscriptions_status_check
  check (status in ('trial','active','paused','expired','lifetime'));

alter table axe_product.company_subscriptions enable row level security;
revoke all on table axe_product.company_subscriptions from anon, authenticated;

-- Existing companies remain usable; no accidental lockout during migration.
insert into axe_product.company_subscriptions(company_id, plan, status, starts_at, ends_at, memo)
select c.id, 'legacy', 'active', c.created_at, null, '3.21.1 migration - existing company'
from axe_product.companies c
on conflict (company_id) do nothing;

-- New companies receive a 7-day trial automatically.
create or replace function axe_product.platform_seed_company_subscription()
returns trigger
language plpgsql
security definer
set search_path = axe_product, public, auth
as $$
begin
  insert into axe_product.company_subscriptions(company_id, plan, status, starts_at, ends_at, memo)
  values (new.id, 'trial', 'trial', now(), now() + interval '7 days', 'automatic 7-day trial')
  on conflict (company_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_platform_seed_company_subscription on axe_product.companies;
create trigger trg_platform_seed_company_subscription
after insert on axe_product.companies
for each row execute function axe_product.platform_seed_company_subscription();

create or replace function axe_product.platform_is_admin()
returns boolean
language sql
stable
security definer
set search_path = axe_product, public, auth
as $$
  select exists(
    select 1 from axe_product.platform_admins pa where pa.user_id = auth.uid()
  );
$$;

create or replace function axe_product.platform_get_company_subscription(p_company_id uuid)
returns table(
  company_id uuid,
  plan text,
  status text,
  effective_status text,
  starts_at timestamptz,
  ends_at timestamptz,
  grace_until timestamptz,
  memo text,
  days_remaining integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = axe_product, public, auth
as $$
begin
  if not exists(
    select 1 from axe_product.company_memberships cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  ) and not axe_product.platform_is_admin() then
    raise exception 'company membership required' using errcode = '42501';
  end if;

  return query
  select s.company_id,
         s.plan,
         s.status,
         case
           when s.status = 'lifetime' then 'active'
           when s.status = 'paused' then 'paused'
           when s.status = 'expired' then 'expired'
           when s.ends_at is not null and coalesce(s.grace_until, s.ends_at) < now() then 'expired'
           else s.status
         end as effective_status,
         s.starts_at,
         s.ends_at,
         s.grace_until,
         s.memo,
         case when s.ends_at is null then null
              else ceil(extract(epoch from (s.ends_at - now())) / 86400.0)::integer end,
         s.updated_at
  from axe_product.company_subscriptions s
  where s.company_id = p_company_id;
end;
$$;

create or replace function axe_product.platform_admin_list_companies()
returns table(
  company_id uuid,
  company_name text,
  company_slug text,
  company_status text,
  owner_name text,
  owner_user_id uuid,
  member_count bigint,
  guild_name text,
  guild_status text,
  plan text,
  subscription_status text,
  effective_status text,
  starts_at timestamptz,
  ends_at timestamptz,
  grace_until timestamptz,
  memo text,
  days_remaining integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = axe_product, public, auth
as $$
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode = '42501';
  end if;

  return query
  select c.id,
         c.name,
         c.slug,
         c.status,
         owner_row.display_name,
         owner_row.user_id,
         coalesce(member_row.member_count, 0),
         dc.guild_name,
         dc.status,
         coalesce(s.plan, 'unassigned'),
         coalesce(s.status, 'active'),
         case
           when coalesce(s.status, 'active') = 'lifetime' then 'active'
           when coalesce(s.status, 'active') = 'paused' then 'paused'
           when coalesce(s.status, 'active') = 'expired' then 'expired'
           when s.ends_at is not null and coalesce(s.grace_until, s.ends_at) < now() then 'expired'
           else coalesce(s.status, 'active')
         end,
         s.starts_at,
         s.ends_at,
         s.grace_until,
         s.memo,
         case when s.ends_at is null then null
              else ceil(extract(epoch from (s.ends_at - now())) / 86400.0)::integer end,
         coalesce(s.updated_at, c.updated_at)
  from axe_product.companies c
  left join lateral (
    select coalesce(cm.alias_name, cm.display_name, cm.discord_display_name, 'OWNER') as display_name,
           cm.user_id
    from axe_product.company_memberships cm
    where cm.company_id = c.id
      and cm.role = 'owner'
      and coalesce(cm.status,'active') = 'active'
    order by cm.created_at asc
    limit 1
  ) owner_row on true
  left join lateral (
    select count(*)::bigint as member_count
    from axe_product.company_memberships cm
    where cm.company_id = c.id and coalesce(cm.status,'active') = 'active'
  ) member_row on true
  left join axe_product.discord_connections dc
    on dc.company_id = c.id and dc.status = 'connected'
  left join axe_product.company_subscriptions s on s.company_id = c.id
  order by c.created_at asc;
end;
$$;

create or replace function axe_product.platform_admin_update_subscription(
  p_company_id uuid,
  p_plan text,
  p_status text,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_grace_until timestamptz default null,
  p_memo text default null
)
returns axe_product.company_subscriptions
language plpgsql
security definer
set search_path = axe_product, public, auth
as $$
declare
  v_row axe_product.company_subscriptions;
begin
  if not axe_product.platform_is_admin() then
    raise exception 'platform admin required' using errcode = '42501';
  end if;
  if not exists(select 1 from axe_product.companies c where c.id=p_company_id) then
    raise exception 'company not found' using errcode='22023';
  end if;
  if p_status not in ('trial','active','paused','expired','lifetime') then
    raise exception 'invalid subscription status' using errcode='22023';
  end if;
  if p_ends_at is not null and p_starts_at is not null and p_ends_at < p_starts_at then
    raise exception 'end date must be after start date' using errcode='22023';
  end if;
  if p_grace_until is not null and p_ends_at is not null and p_grace_until < p_ends_at then
    raise exception 'grace date must be on or after end date' using errcode='22023';
  end if;

  insert into axe_product.company_subscriptions(
    company_id, plan, status, starts_at, ends_at, grace_until, memo, updated_by, updated_at
  ) values (
    p_company_id,
    coalesce(nullif(trim(p_plan), ''), 'standard'),
    p_status,
    p_starts_at,
    case when p_status = 'lifetime' then null else p_ends_at end,
    case when p_status = 'lifetime' then null else p_grace_until end,
    nullif(trim(coalesce(p_memo, '')), ''),
    auth.uid(),
    now()
  )
  on conflict (company_id) do update set
    plan = excluded.plan,
    status = excluded.status,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    grace_until = excluded.grace_until,
    memo = excluded.memo,
    updated_by = auth.uid(),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================
-- 2) FUND LEDGER PHOTO / SCREENSHOT ATTACHMENTS
-- Reuses the existing private bucket: axe-fund-evidence
-- ============================================================
create table if not exists axe_product.fund_ledger_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references axe_product.companies(id) on delete cascade,
  entry_id uuid not null,
  storage_path text not null unique,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_fund_ledger_attachments_company_entry
  on axe_product.fund_ledger_attachments(company_id, entry_id, created_at);

alter table axe_product.fund_ledger_attachments enable row level security;
revoke all on table axe_product.fund_ledger_attachments from anon, authenticated;

create or replace function axe_product.fund_ledger_evidence_is_company_admin(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = axe_product, public, auth
as $$
  select exists(
    select 1
    from axe_product.company_memberships cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
      and cm.role in ('owner','admin')
  );
$$;

create or replace function axe_product.fund_admin_list_ledger_attachments(
  p_company_id uuid,
  p_entry_id uuid default null
)
returns table(
  id uuid,
  company_id uuid,
  entry_id uuid,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = axe_product, public, auth
as $$
begin
  if not axe_product.fund_ledger_evidence_is_company_admin(p_company_id) then
    raise exception 'company admin required' using errcode = '42501';
  end if;

  return query
  select a.id, a.company_id, a.entry_id, a.storage_path, a.file_name, a.mime_type, a.size_bytes, a.created_at
  from axe_product.fund_ledger_attachments a
  where a.company_id = p_company_id
    and (p_entry_id is null or a.entry_id = p_entry_id)
  order by a.created_at asc;
end;
$$;

create or replace function axe_product.fund_admin_attach_ledger_evidence(
  p_company_id uuid,
  p_entry_id uuid,
  p_storage_path text,
  p_file_name text default null,
  p_mime_type text default null,
  p_size_bytes bigint default null
)
returns axe_product.fund_ledger_attachments
language plpgsql
security definer
set search_path = axe_product, public, auth
as $$
declare
  v_row axe_product.fund_ledger_attachments;
begin
  if not axe_product.fund_ledger_evidence_is_company_admin(p_company_id) then
    raise exception 'company admin required' using errcode = '42501';
  end if;
  if p_entry_id is null then
    raise exception 'ledger entry is required' using errcode='22023';
  end if;
  if nullif(trim(coalesce(p_storage_path,'')), '') is null then
    raise exception 'storage path is required' using errcode='22023';
  end if;
  if split_part(p_storage_path, '/', 1) <> p_company_id::text then
    raise exception 'invalid evidence path' using errcode='22023';
  end if;

  insert into axe_product.fund_ledger_attachments(
    company_id, entry_id, storage_path, file_name, mime_type, size_bytes, created_by
  ) values (
    p_company_id, p_entry_id, p_storage_path,
    nullif(trim(coalesce(p_file_name,'')), ''),
    nullif(trim(coalesce(p_mime_type,'')), ''),
    p_size_bytes,
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================
-- 3) RPC permissions
-- ============================================================
revoke all on function axe_product.platform_seed_company_subscription() from public;
revoke all on function axe_product.platform_is_admin() from public;
revoke all on function axe_product.platform_get_company_subscription(uuid) from public;
revoke all on function axe_product.platform_admin_list_companies() from public;
revoke all on function axe_product.platform_admin_update_subscription(uuid,text,text,timestamptz,timestamptz,timestamptz,text) from public;
revoke all on function axe_product.fund_ledger_evidence_is_company_admin(uuid) from public;
revoke all on function axe_product.fund_admin_list_ledger_attachments(uuid,uuid) from public;
revoke all on function axe_product.fund_admin_attach_ledger_evidence(uuid,uuid,text,text,text,bigint) from public;

grant execute on function axe_product.platform_is_admin() to authenticated;
grant execute on function axe_product.platform_get_company_subscription(uuid) to authenticated;
grant execute on function axe_product.platform_admin_list_companies() to authenticated;
grant execute on function axe_product.platform_admin_update_subscription(uuid,text,text,timestamptz,timestamptz,timestamptz,text) to authenticated;
grant execute on function axe_product.fund_admin_list_ledger_attachments(uuid,uuid) to authenticated;
grant execute on function axe_product.fund_admin_attach_ledger_evidence(uuid,uuid,text,text,text,bigint) to authenticated;

-- ============================================================
-- 4) PLATFORM OWNER bootstrap — already filled with the user's Supabase Auth UID
-- ============================================================
insert into axe_product.platform_admins(user_id, note)
values ('72a5e0e4-047f-4b74-9d17-b3bcbbfe70d3'::uuid, 'AXE PRODUCT PLATFORM OWNER')
on conflict (user_id) do update set note=excluded.note;

commit;

-- ============================================================
-- 5) Verification output (read-only)
-- ============================================================
select
  to_regclass('axe_product.companies') as companies_table,
  to_regclass('axe_product.platform_admins') as platform_admins_table,
  to_regclass('axe_product.company_subscriptions') as subscriptions_table,
  to_regclass('axe_product.fund_ledger_attachments') as fund_attachments_table,
  exists(
    select 1 from axe_product.platform_admins
    where user_id='72a5e0e4-047f-4b74-9d17-b3bcbbfe70d3'::uuid
  ) as platform_owner_registered;
