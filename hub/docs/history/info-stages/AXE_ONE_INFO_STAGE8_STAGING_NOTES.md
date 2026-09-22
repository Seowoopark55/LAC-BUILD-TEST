# AXE ONE WEB — INFO STAGE 8 / 개조서 카테고리 표현 개선 (STAGING ONLY)

Baseline: `AXE_ONE_WEB_INFO_STAGE7_MODBOOK_STAGING_R1.zip`, itself based on user-uploaded `axe one(3).zip`.
Deploy this **complete WEB source** only to AXE ONE WEB STAGING. Do not deploy to AXE NET, LIVE, or BOT.

## Scope
- Existing top-level 정보 and company-scoped `axe_product.modbook_catalog` read path retained.
- Small restrained inline SVG symbols added to 개조서 분야 (무기/생활/전투) and 접두/접미 chips; no emoji font dependency.
- 접두 gets muted blue and 접미 muted red only in the modbook filter row and the selected modbook detail badge. Non-modbook UI is unchanged.
- Multi-value category labels (e.g. `SMG, 피스톨, 라이플` or `근접무기, 채광`) continue to appear in each applicable filter but are returned once in the unified search. No DB duplicates.
- For legacy rows whose stored category is merely their type (`접두` or `접미`) or blank, and whose `parts` is **entirely** a comma-separated list of known applicable labels, the existing parts are treated as *provisional, display-only* category hints. For example `category=접미; parts=SMG, 라이플` appears under SMG and 라이플 and does not appear under 분류 미확인. Its detail displays `필요 부품 표기 기준 · 분류 확인 필요` to disclose the inference. Stored category and parts are not changed.
- If no reliable category is present and parts includes any unknown label or ingredient-like text, the entry stays in 분류 미확인 so it is never silently dropped or guessed. The actual total remaining exception count requires checking logged-in STAGING data; a screenshot alone cannot establish whether all 3 original exceptions were resolved.

## Files changed/added
- `src/ui/infoPage.js` (display-only routing, icons, detail badge)
- `src/styles/info.css` (scoped icon size/type accent)
- `scripts/info-catalog-stage8-check.mjs` (synthetic regression fixture)
- This note

## Checks
- Stage 8 synthetic: 11/11 PASS (including duplicate handling, conditional inference, unknown retention, cross-company stale data).
- Stage 7 synthetic: 14/14 PASS.
- Stage 6 synthetic: 18/18 PASS.
- `npm run check`: exit 0.
- `node --check src/ui/infoPage.js`: PASS.
- Production build NOT VERIFIED here: Vite is unavailable in this local environment (Stage 7 had `vite: not found`). Headless Chromium screenshot did not complete in this environment; no new visual baseline was accepted or rebaselined.

## STAGING acceptance: do one step at a time
1. Deploy full source to AXE ONE WEB STAGING and ensure Vercel build is Ready.
2. Open 게임 정보 → 개조서 → 무기 → 접미 → SMG. Confirm colors/icons and the legacy `차분한` entry if its parts field is still `SMG, 라이플`; compare 라이플 chip and see the same row without duplicating it in the search.
3. Confirm 접두 blue, 접미 red, and any remaining 분류 미확인 exception. Do not assume the original three entries all had recognized parts labels.
4. Confirm existing company-scoped modbook access and the untouched WEB/BOT operation flows.
No SQL or DB updates required.
