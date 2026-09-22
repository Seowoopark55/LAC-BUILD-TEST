-- LAC ONE → AXE HUB → axe_product (NOT legacy AXE NET new_axe_net)
-- STAGING FIRST. Install only after confirming current create_company inserts into
-- axe_product.companies in the same authenticated transaction (expected WEB RPC).
-- This migration does not touch existing companies or company-member invitations.
-- It protects every future INSERT INTO companies, including direct RPC attempts.
BEGIN;

CREATE TABLE IF NOT EXISTS axe_product.lac_company_create_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL CHECK (char_length(btrim(company_name)) BETWEEN 1 AND 80),
  code_hash text NOT NULL UNIQUE,
  issued_by uuid NOT NULL REFERENCES auth.users(id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  reserved_by uuid REFERENCES auth.users(id),
  reserved_at timestamptz,
  consumed_by uuid REFERENCES auth.users(id),
  consumed_at timestamptz,
  created_company_id uuid UNIQUE
);
ALTER TABLE axe_product.lac_company_create_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE axe_product.lac_company_create_codes FROM PUBLIC, anon, authenticated;

-- A 128-bit unpredictable one-use token is returned only once, to the owner.
-- Its hash, not the plaintext, remains in the database.
CREATE OR REPLACE FUNCTION axe_product.lac_issue_company_create_code(
  p_company_name text, p_expires_hours integer DEFAULT 24
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, axe_product, auth
AS $$
DECLARE v_code text; v_name text := btrim(coalesce(p_company_name,''));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM axe_product.platform_admins p WHERE p.user_id=auth.uid()
  ) THEN
    RAISE EXCEPTION '서비스 운영자만 개설 코드를 발급할 수 있습니다.' USING ERRCODE='42501';
  END IF;
  IF char_length(v_name) NOT BETWEEN 1 AND 80 OR p_expires_hours NOT IN (24,72,168) THEN
    RAISE EXCEPTION '회사 이름 또는 코드 유효기간을 확인해 주세요.' USING ERRCODE='22023';
  END IF;
  v_code := upper(replace(gen_random_uuid()::text,'-',''));
  INSERT INTO axe_product.lac_company_create_codes(company_name,code_hash,issued_by,expires_at)
  VALUES (v_name, md5(v_code),auth.uid(),now()+make_interval(hours=>p_expires_hours));
  RETURN v_code;
END $$;

CREATE OR REPLACE FUNCTION axe_product.lac_redeem_company_create_code(
  p_code text, p_company_name text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, axe_product, auth
AS $$
DECLARE v_code text := upper(btrim(coalesce(p_code,'')));
DECLARE v_name text := btrim(coalesce(p_company_name,''));
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Discord 로그인 후 개설 코드를 확인해 주세요.' USING ERRCODE='42501';
  END IF;
  IF length(v_code) != 32 OR v_code !~ '^[0-9A-F]{32}$' OR length(v_name) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION '개설 코드와 회사 이름을 확인해 주세요.' USING ERRCODE='22023';
  END IF;
  -- Reserve against this exact user and exact company name. A used/reserved
  -- code cannot authorize another user, even if its plaintext is leaked.
  UPDATE axe_product.lac_company_create_codes
     SET reserved_by=auth.uid(),reserved_at=now()
   WHERE code_hash=md5(v_code)
     AND company_name=v_name
     AND expires_at>now()
     AND consumed_at IS NULL
     AND (reserved_by IS NULL OR reserved_by=auth.uid())
   RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RAISE EXCEPTION '개설 코드가 유효하지 않거나 회사 이름이 다릅니다.' USING ERRCODE='42501';
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION axe_product.lac_guard_new_company_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, axe_product, auth
AS $$
DECLARE v_code_id uuid;
BEGIN
  -- Trusted server-to-server housekeeping can still create companies.
  -- Ordinary authenticated users (including platform owners) need a code.
  IF auth.role()='service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.' USING ERRCODE='42501';
  END IF;
  UPDATE axe_product.lac_company_create_codes
     SET consumed_by=auth.uid(), consumed_at=now(),created_company_id=NEW.id
   WHERE id=(
     SELECT id FROM axe_product.lac_company_create_codes
      WHERE reserved_by=auth.uid() AND company_name=btrim(NEW.name)
        AND consumed_at IS NULL AND reserved_at>now()-interval '15 minutes'
        AND expires_at>now()
      ORDER BY reserved_at DESC, issued_at DESC LIMIT 1
   )
     AND consumed_at IS NULL
   RETURNING id INTO v_code_id;
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION '유효한 회사 개설 코드가 필요합니다.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS lac_new_company_create_code_guard ON axe_product.companies;
CREATE TRIGGER lac_new_company_create_code_guard
BEFORE INSERT ON axe_product.companies
FOR EACH ROW EXECUTE FUNCTION axe_product.lac_guard_new_company_insert();

REVOKE ALL ON FUNCTION axe_product.lac_issue_company_create_code(text,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION axe_product.lac_redeem_company_create_code(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION axe_product.lac_issue_company_create_code(text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION axe_product.lac_redeem_company_create_code(text,text) TO authenticated;
REVOKE ALL ON FUNCTION axe_product.lac_guard_new_company_insert() FROM PUBLIC,anon,authenticated;
COMMIT;
