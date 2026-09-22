-- AXE PRODUCT 3.26.4h
-- PRODUCT STAGING ONLY
-- Final company hard-delete ordering fix for audit_events FK failure.
--
-- Root cause confirmed by exact PostgreSQL diagnostics:
--   audit_events_company_id_fkey
--   audit trigger attempted to INSERT an audit row for a company after
--   the parent companies row had already disappeared during parent CASCADE.
--
-- Fix strategy:
-- 1) Keep the company parent row alive while deleting all company-owned children.
-- 2) Resolve all diagnosed RESTRICT leaf dependencies first.
-- 3) Explicitly delete direct ON DELETE CASCADE company children while the parent
--    company still exists, so ordinary audit triggers can safely write audit_events.
-- 4) Explicitly delete company_memberships with its USER triggers temporarily
--    disabled (last-owner guard must not block full-company destruction).
-- 5) Delete all audit_events for the company LAST, after every audited child delete.
-- 6) Finally delete the now-childless companies row.
--
-- Global FK rules and normal membership/audit behavior are NOT weakened.

begin;

create or replace function axe_product.platform_admin_delete_company(
  p_company_id uuid,
  p_confirm_name text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_company axe_product.companies%rowtype;
  v_confirm text := btrim(coalesce(p_confirm_name, ''));
  v_membership_triggers_disabled boolean := false;

  v_fk record;

  v_ammo_orders bigint := 0;
  v_ammo_makers bigint := 0;
  v_fund_ledger bigint := 0;
  v_fund_exemptions bigint := 0;
  v_fund_requests bigint := 0;
  v_invite_redemptions bigint := 0;
  v_memberships bigint := 0;
  v_audit_events bigint := 0;

  v_constraint text;
  v_table text;
  v_schema text;
  v_detail text;
  v_message text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if not axe_product.platform_is_admin() then
    raise exception 'PLATFORM OWNER 권한이 필요합니다.' using errcode = '42501';
  end if;

  if p_company_id is null then
    raise exception '삭제할 회사를 확인하지 못했습니다.' using errcode = '22023';
  end if;

  select c.*
    into v_company
  from axe_product.companies c
  where c.id = p_company_id
  for update;

  if not found then
    raise exception '이미 삭제되었거나 존재하지 않는 회사입니다.' using errcode = 'P0002';
  end if;

  if v_confirm = '' or v_confirm <> btrim(v_company.name) then
    raise exception '회사 이름이 일치하지 않습니다.' using errcode = '22023';
  end if;

  /*
   * Serialize the destructive membership phase.
   */
  lock table axe_product.company_memberships in access exclusive mode;

  ---------------------------------------------------------------------------
  -- STEP 1: Known RESTRICT leaf rows from the complete FK graph diagnosis.
  -- All deletes happen while the company parent still exists, so audit triggers
  -- can safely insert company-scoped audit_events.
  ---------------------------------------------------------------------------

  delete from axe_product.ammo_orders
  where company_id = v_company.id;
  get diagnostics v_ammo_orders = row_count;

  delete from axe_product.ammo_makers
  where company_id = v_company.id;
  get diagnostics v_ammo_makers = row_count;

  -- fund_ledger blocks both fund_requests and memberships.
  delete from axe_product.fund_ledger
  where company_id = v_company.id;
  get diagnostics v_fund_ledger = row_count;

  delete from axe_product.fund_exemptions
  where company_id = v_company.id;
  get diagnostics v_fund_exemptions = row_count;

  delete from axe_product.fund_requests
  where company_id = v_company.id;
  get diagnostics v_fund_requests = row_count;

  -- invite_redemptions blocks company_invites.
  delete from axe_product.invite_redemptions ir
  where ir.invite_id in (
    select ci.id
    from axe_product.company_invites ci
    where ci.company_id = v_company.id
  );
  get diagnostics v_invite_redemptions = row_count;

  ---------------------------------------------------------------------------
  -- STEP 2: Delete every remaining DIRECT company-owned CASCADE child
  -- while companies.id still exists.
  --
  -- We derive these tables from PostgreSQL catalogs instead of hardcoding the
  -- ever-growing AXE PRODUCT schema.
  --
  -- Exclusions:
  --   company_memberships -> special last-owner USER trigger handling below
  --   audit_events        -> must be deleted last, after all audited deletes
  ---------------------------------------------------------------------------

  for v_fk in
    select distinct
      fk.conrelid,
      a.attname as child_column
    from pg_catalog.pg_constraint fk
    join pg_catalog.pg_attribute a
      on a.attrelid = fk.conrelid
     and a.attnum = fk.conkey[1]
     and not a.attisdropped
    where fk.contype = 'f'
      and fk.confrelid = 'axe_product.companies'::regclass
      and fk.confdeltype = 'c'
      and cardinality(fk.conkey) = 1
      and fk.conrelid <> 'axe_product.company_memberships'::regclass
      and fk.conrelid <> 'axe_product.audit_events'::regclass
  loop
    execute format(
      'delete from %s where %I = $1',
      v_fk.conrelid::regclass,
      v_fk.child_column
    )
    using v_company.id;
  end loop;

  ---------------------------------------------------------------------------
  -- STEP 3: Memberships.
  --
  -- The last-owner guard is correct during ordinary administration but must
  -- not veto destruction of the whole company. Disable USER triggers only for
  -- this short locked delete; PostgreSQL internal FK triggers remain enabled.
  ---------------------------------------------------------------------------

  alter table axe_product.company_memberships disable trigger user;
  v_membership_triggers_disabled := true;

  begin
    delete from axe_product.company_memberships
    where company_id = v_company.id;
    get diagnostics v_memberships = row_count;
  exception
    when others then
      alter table axe_product.company_memberships enable trigger user;
      v_membership_triggers_disabled := false;
      raise;
  end;

  alter table axe_product.company_memberships enable trigger user;
  v_membership_triggers_disabled := false;

  ---------------------------------------------------------------------------
  -- STEP 4: Remove company-scoped audit history LAST.
  --
  -- Any audit rows generated by STEP 1/2 were valid because the company still
  -- existed. They are intentionally removed now as part of permanent company
  -- destruction. The platform deletion log below survives separately.
  ---------------------------------------------------------------------------

  delete from axe_product.audit_events
  where company_id = v_company.id;
  get diagnostics v_audit_events = row_count;

  ---------------------------------------------------------------------------
  -- STEP 5: Delete the now-childless company row.
  -- No audited company child should remain to generate a post-parent audit row.
  ---------------------------------------------------------------------------

  delete from axe_product.companies
  where id = v_company.id;

  if not found then
    raise exception '회사 삭제 상태를 확인하지 못했습니다.' using errcode = 'P0002';
  end if;

  ---------------------------------------------------------------------------
  -- STEP 6: Persistent platform-level deletion record.
  ---------------------------------------------------------------------------

  insert into axe_product.platform_company_deletion_log(
    company_id,
    company_name,
    company_slug,
    deleted_by
  ) values (
    v_company.id,
    v_company.name,
    v_company.slug,
    v_uid
  );

  return jsonb_build_object(
    'deleted', true,
    'company_id', v_company.id,
    'company_name', v_company.name,
    'deleted_at', now(),
    'deleted_rows', jsonb_build_object(
      'ammo_orders', v_ammo_orders,
      'ammo_makers', v_ammo_makers,
      'fund_ledger', v_fund_ledger,
      'fund_exemptions', v_fund_exemptions,
      'fund_requests', v_fund_requests,
      'invite_redemptions', v_invite_redemptions,
      'memberships', v_memberships,
      'audit_events', v_audit_events
    )
  );

exception
  when foreign_key_violation then
    get stacked diagnostics
      v_constraint = constraint_name,
      v_table = table_name,
      v_schema = schema_name,
      v_detail = pg_exception_detail,
      v_message = message_text;

    if v_membership_triggers_disabled then
      alter table axe_product.company_memberships enable trigger user;
    end if;

    raise exception 'DELETE_FK_DEBUG | constraint=% | table=%.% | message=% | detail=%',
      coalesce(v_constraint, '?'),
      coalesce(v_schema, '?'),
      coalesce(v_table, '?'),
      coalesce(v_message, '?'),
      coalesce(v_detail, '?')
      using errcode = '23503';

  when others then
    if v_membership_triggers_disabled then
      alter table axe_product.company_memberships enable trigger user;
    end if;
    raise;
end;
$$;

revoke all on function axe_product.platform_admin_delete_company(uuid,text) from public;
revoke all on function axe_product.platform_admin_delete_company(uuid,text) from anon;
grant execute on function axe_product.platform_admin_delete_company(uuid,text) to authenticated;
grant execute on function axe_product.platform_admin_delete_company(uuid,text) to service_role;

comment on function axe_product.platform_admin_delete_company(uuid,text) is
'AXE PRODUCT 3.26.4h: hard delete with parent-alive child cleanup to prevent audit_events FK failure; catalog-driven direct CASCADE cleanup; normal FK/audit protections unchanged outside full company deletion.';

commit;
