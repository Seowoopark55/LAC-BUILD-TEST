# AXE ONE WEB — INFO STAGE 3 (STAGING only)

Baseline: AXE_ONE_WEB_INFO_STAGE2_STAGING_R1.zip (originally user-provided axe one(2).zip).

Scope: compact secondary filters in the existing read-only game information page.
- Crafts: dynamically derive source categories from info_crafts.category; for ETC, UI-only subgroups based on the 19 provided existing item names: 부품·재료 (5), 도구·소모품 (10), 탄약 (4). Unrecognized/new ETC items are shown under 기타 as well as ETC 전체. No DB category values are changed.
- Craft materials: share parent craft's category and ETC subgroup; do not replace or modify their craft_id links.
- Quests: job chips + dependent rank chips, including 미지정 for null ranks.
- Skill ranks: 24 distinct skills in a select (derived from DB rows), and show only the chosen skill's rank rows. The existing search input works within the selected group.
- Processes: job chips + dependent process_type chips.
- Material recipes: no extra subcategories for the 2 available recipes.
- Switching an upper category or a primary filter resets dependent filters and selected detail. Existing 6-tab navigation, sidebar, support board UI, detail pane, and read-only API remain unchanged.

Modified: src/ui/infoPage.js, src/styles/info.css, src/main.js. Added scripts/info-catalog-stage3-check.mjs and these notes. No changes to Supabase, DB, permissions, BOT, or any existing operations module.

Validation: npm run check PASS; Stage 1 info 10/10 PASS; Stage 2 info 11/11 PASS; Stage 3 info 14/14 PASS. Production build and authenticated Chromium rendering are NOT verified in this workspace (no local node_modules / Vite). Deploy only to WEB STAGING and verify in browser before further changes.
