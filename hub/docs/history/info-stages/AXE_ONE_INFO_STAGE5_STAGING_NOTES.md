# AXE ONE WEB — INFO STAGE 5 (STAGING ONLY)

Baseline: AXE_ONE_WEB_INFO_STAGE4_STAGING_R1.zip. This is a complete WEB project, not a SQL script or BOT patch.

Source of truth: existing six axe_product info tables; no database changes, migration, source category overwrite, record deletion, or ID/FK changes.

UI changes:
- Four top tabs: 제작법 / 생산 / 퀘스트 / 스킬 등급.
- Former top-level 재료 조합 is available at 제작법 > 무기부품; the two independent `info_material_recipes` records are presented there with their original input names and quantities. If `info_crafts` contains an item of exactly the same name, its separate craft recipe and linked ingredient rows are also shown in the detail. No database join or relationship is introduced.
- 제작법 navigation now offers 근접무기, 총기류, 부품·원재료, 무기부품, 기타 제작품. The prior 제작 재료 > 필요 재료 list is removed as a separate browse view; the existing 95 required-ingredient records are still loaded and shown in each parent craft's detail. 부품·원재료 presents 고철, 화약, 소형 탄피(20); the two named weapon parts are accessed via 무기부품. 기타 제작품 retains tools/consumables/ammunition.
- 제작법 > 전체 still shows 32 original `info_crafts` rows. The two additional combination records come from a separate source table, accessible in 무기부품; the 32 is not the sum of every database row across every table.
- Top-level 가공 is renamed 생산, with no 전체 option. Existing 벌목 rows display under 목재, existing 채광 rows under 재련. If a new unexpected job appears, a 기타 option keeps it discoverable.
- 퀘스트 직업/등급 and 스킬 등급 생활/생산/전투/기술 remain as in Stage 4.
- Sidebar, authentication, permission checks, all operational pages, database, and BOT are unchanged. Information remains read-only in this WEB stage; owner edit UI is not implemented.

Changes relative to Stage 4: src/ui/infoPage.js and src/styles/info.css only; new scripts/info-catalog-stage5-check.mjs and this note. Prior stage-specific visual preview and tests are historical and do not represent Stage 5 acceptance criteria.

Checks: `node --check src/ui/infoPage.js` PASS; `npm run check` PASS; `node scripts/info-catalog-stage5-check.mjs` 13/13 PASS (synthetic fixture). Production `npm run build` could not run locally because the Vite executable is absent; STAGING Vercel build and live session/data rendering still require user verification.

STAGING check order: 게임 정보 > 제작법 > 무기부품 (two combination records, quantities and linked craft information), then 부품·원재료 (고철 / 화약 / 소형 탄피), then 생산 > 목재 and 재련 (4 records each). Verify craft details still list required ingredients and sidebar/support/operational views remain available.
