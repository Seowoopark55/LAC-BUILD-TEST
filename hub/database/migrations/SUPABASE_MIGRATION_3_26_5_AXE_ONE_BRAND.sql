-- AXE ONE 3.26.5
-- Customer-facing brand migration only.
-- Internal schema/function/env identifiers intentionally remain axe_product / AXE_PRODUCT_*.
-- PRODUCT STAGING FIRST.
--
-- Safety design:
-- Rather than restoring old function bodies from historical migrations, this migration reads
-- each CURRENT axe_product function definition from PostgreSQL itself and only replaces the
-- customer-facing literal "AXE PRODUCT" with "AXE ONE". Current function logic is preserved.

begin;

-- Rebrand all current axe_product function definitions that still contain the legacy
-- customer-facing brand. Technical identifiers such as axe_product remain untouched.
do $$
declare
  r record;
  v_definition text;
begin
  for r in
    select p.oid
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'axe_product'
      and position('AXE PRODUCT' in pg_catalog.pg_get_functiondef(p.oid)) > 0
  loop
    v_definition := pg_catalog.pg_get_functiondef(r.oid);
    execute replace(v_definition, 'AXE PRODUCT', 'AXE ONE');
  end loop;
end
$$;

-- Rebrand already-stored platform reply labels without touching customer names.
update axe_product.support_question_messages
set author_name = 'AXE ONE 운영자'
where author_type = 'platform' and author_name = 'AXE PRODUCT 운영자';

update axe_product.suggestion_messages
set author_name = 'AXE ONE 운영자'
where author_type = 'platform' and author_name = 'AXE PRODUCT 운영자';

-- Internal admin note can be safely updated as display metadata only.
update axe_product.platform_admins
set note = 'AXE ONE PLATFORM OWNER'
where note = 'AXE PRODUCT PLATFORM OWNER';

commit;
