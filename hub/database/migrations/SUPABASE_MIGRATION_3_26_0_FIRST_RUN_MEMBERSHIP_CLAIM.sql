-- AXE PRODUCT 3.26.0
-- First-run onboarding / Discord membership auto-claim
-- PRODUCT STAGING only.

-- Guided Setup은 로그인 전 Discord ID만 확보된 멤버 placeholder를 저장하므로
-- user_id는 해당 시점에는 NULL일 수 있어야 한다. 이미 nullable이면 no-op이다.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'axe_product'
      and table_name = 'company_memberships'
      and column_name = 'user_id'
      and is_nullable = 'NO'
  ) then
    alter table axe_product.company_memberships
      alter column user_id drop not null;
  end if;
end;
$$;

create or replace function axe_product.web_claim_discord_memberships()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_discord_id text;
  v_display_name text;
  v_claimed integer := 0;
  v_linked integer := 0;
  v_row record;
  v_company_ids jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  select
    coalesce(
      nullif(btrim(u.raw_user_meta_data->>'provider_id'), ''),
      nullif(btrim(u.raw_user_meta_data->>'sub'), ''),
      (
        select coalesce(
          nullif(btrim(i.identity_data->>'provider_id'), ''),
          nullif(btrim(i.identity_data->>'sub'), '')
        )
        from auth.identities i
        where i.user_id = v_uid
          and lower(coalesce(i.provider, '')) like '%discord%'
        order by i.created_at asc
        limit 1
      )
    ),
    coalesce(
      nullif(btrim(u.raw_user_meta_data->>'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data->>'name'), ''),
      nullif(btrim(u.raw_user_meta_data->>'user_name'), ''),
      nullif(btrim(u.raw_user_meta_data->>'preferred_username'), ''),
      'Discord 사용자'
    )
  into v_discord_id, v_display_name
  from auth.users u
  where u.id = v_uid;

  -- Discord identity가 없으면 안전하게 no-op.
  if v_discord_id is null or v_discord_id !~ '^[0-9]{15,22}$' then
    return jsonb_build_object(
      'discord_linked', false,
      'claimed_count', 0,
      'linked_count', 0,
      'company_ids', '[]'::jsonb
    );
  end if;

  -- 초기설정에서 Discord ID만으로 미리 등록된 멤버 row를
  -- 실제 로그인 auth user에 안전하게 귀속한다.
  for v_row in
    select m.id, m.company_id
    from axe_product.company_memberships m
    join axe_product.companies c on c.id = m.company_id
    where m.user_id is null
      and m.status = 'active'
      and c.status = 'active'
      and btrim(coalesce(m.discord_user_id, '')) = v_discord_id
    order by m.created_at asc
    for update of m
  loop
    -- 같은 회사에 이미 현재 auth user membership이 있으면 중복 row를 claim하지 않는다.
    if exists (
      select 1
      from axe_product.company_memberships current_m
      where current_m.company_id = v_row.company_id
        and current_m.user_id = v_uid
    ) then
      continue;
    end if;

    update axe_product.company_memberships m
    set user_id = v_uid,
        display_name = coalesce(nullif(btrim(m.display_name), ''), v_display_name),
        discord_user_id = v_discord_id,
        discord_display_name = coalesce(nullif(btrim(m.discord_display_name), ''), v_display_name),
        joined_at = coalesce(m.joined_at, now()),
        updated_at = now()
    where m.id = v_row.id
      and m.user_id is null;

    if found then
      v_claimed := v_claimed + 1;
    end if;
  end loop;

  -- 초대코드 참가 / 회사 생성처럼 user_id는 이미 연결돼 있지만
  -- Discord 정보가 비어 있는 membership도 현재 로그인 identity로 보강한다.
  update axe_product.company_memberships m
  set discord_user_id = coalesce(nullif(btrim(m.discord_user_id), ''), v_discord_id),
      discord_display_name = coalesce(nullif(btrim(m.discord_display_name), ''), v_display_name),
      display_name = coalesce(nullif(btrim(m.display_name), ''), v_display_name),
      updated_at = now()
  where m.user_id = v_uid
    and m.status = 'active'
    and (m.discord_user_id is null or btrim(m.discord_user_id) = '' or btrim(m.discord_user_id) = v_discord_id)
    and not exists (
      select 1
      from axe_product.company_memberships other_m
      where other_m.company_id = m.company_id
        and other_m.id <> m.id
        and btrim(coalesce(other_m.discord_user_id, '')) = v_discord_id
    );
  get diagnostics v_linked = row_count;

  select coalesce(jsonb_agg(x.company_id order by x.created_at), '[]'::jsonb)
  into v_company_ids
  from (
    select m.company_id, min(m.created_at) as created_at
    from axe_product.company_memberships m
    join axe_product.companies c on c.id = m.company_id
    where m.user_id = v_uid
      and m.status = 'active'
      and c.status = 'active'
    group by m.company_id
  ) x;

  return jsonb_build_object(
    'discord_linked', true,
    'discord_user_id', v_discord_id,
    'claimed_count', v_claimed,
    'linked_count', v_linked,
    'company_ids', v_company_ids
  );
end;
$$;

revoke all on function axe_product.web_claim_discord_memberships() from public;
revoke all on function axe_product.web_claim_discord_memberships() from anon;
grant execute on function axe_product.web_claim_discord_memberships() to authenticated;
grant execute on function axe_product.web_claim_discord_memberships() to service_role;

comment on function axe_product.web_claim_discord_memberships() is
'AXE PRODUCT 3.26.0: Discord 로그인 identity와 초기설정에서 미리 등록된 company_memberships.discord_user_id를 안전하게 연결한다.';
