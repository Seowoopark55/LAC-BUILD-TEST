# AXE ONE WEB — INFO STAGE 4 (STAGING only)

Baseline: AXE_ONE_WEB_INFO_STAGE3_STAGING_R1.zip, previously deployed by the user to AXE ONE WEB STAGING. This is a full WEB project snapshot, not a SQL migration or BOT patch.

Scope: only the game information presentation and its filter state.

- Five top tabs: 제작법 / 재료 조합 / 가공 / 퀘스트 / 스킬 등급. Original six axe_product information tables remain the read source, including all 95 info_craft_materials rows.
- 제작법 subnavigation: 전체 → 근접무기(나이프) / 총기류(피스톨, 리볼버, SMG) / 제작 재료(부품·원재료, 필요 재료) / 기타 제작품(도구·소모품, 탄약, 기타). Source `ETC`, `KNIFE`, `PISTOL`, `REVOLVER`, `SMG` values, IDs and FK links remain unchanged.
- The 95 ingredient rows are accessed under 제작법 > 제작 재료 > 필요 재료. A single list row per parent craft shows only that craft's name; selecting it displays every linked ingredient with quantities. Ingredient-name search stays available. Five imported ETC part recipes are separately available under 부품·원재료.
- 가공: job first; the secondary process type is shown only if a selected job has multiple actual types. 퀘스트: job first; rank is shown only when multiple ranks exist for that job or overall view. Null ranks are never excluded implicitly.
- 스킬 등급: 생활(7 skills), 생산(목재 가공, 재련), 전투(6 skills), 기술(9 skills). A dependent skill select follows the group selector. Unknown future skills and craft categories stay in 기타 rather than vanishing.
- The sidebar, owner auth/permissions, support boards, information read API, Supabase schema, all operation modules and BOT were not modified. Administrator editing is not enabled in this stage.

Modified: src/ui/infoPage.js, src/main.js, src/styles/info.css; new scripts/info-catalog-stage4-check.mjs and this note. Historical Stage 2/3 info tests assert superseded six-tab layouts and are kept as historical checks, not Stage 4 acceptance tests.

Validation: `npm run check` PASS; `node scripts/info-catalog-stage4-check.mjs` 19/19 PASS. `node --check src/main.js` and `node --check src/ui/infoPage.js` PASS. Production Vite build, live Supabase login and interactive browser testing have not been verified in this local workspace; verify Vercel Ready and STAGING on deployment.

First STAGING visual check: 게임 정보 > 제작법 > 총기류 > 피스톨, then 제작 재료 > 필요 재료. Confirm parent names have no `· 재료명` suffix, and selected detail shows required ingredients. Then verify 생활/생산/전투/기술.
