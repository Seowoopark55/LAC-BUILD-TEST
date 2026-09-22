# AXE ONE WEB — INFO STAGE 10 (STAGING ONLY)

Baseline: `AXE_ONE_WEB_INFO_STAGE9_MODBOOK_STAGING_R1.zip` (full WEB source). Apply to AXE ONE WEB STAGING only via GitHub/Vercel, not AXE NET, LIVE or BOT.

## Exact scope
- Add five consistent, restrained inline SVG line icons to the top game-information categories: 제작법 / 생산 / 퀘스트 / 스킬 등급 / 개조서.
- Remove counts only from the five top-level category tabs; preserve counts in detailed lists and lower-level filters.
- Keep the established top tab height, navigation, selected-state gold underline, modbook prefix/suffix colors, global search, company-scoped data access, and all other WEB functionality unchanged.
- No Supabase SQL, data edits, BOT changes, RLS changes or new image/font dependencies.

## Source changes relative to Stage 9
- `src/ui/infoPage.js`: five icon paths and top-tab markup only.
- `src/styles/info.css`: scoped top-tab inline icon alignment; remove two obsolete count-specific declarations.
- `scripts/info-catalog-stage10-check.mjs`: focused synthetic regression checks.
- This note.

## Local validation
- Stage 10 synthetic 10/10 PASS.
- Stage 9 11/11, Stage 8 11/11, Stage 7 14/14, Stage 6 18/18 PASS.
- `node --check src/ui/infoPage.js`: PASS.
- `npm run check`: PASS.
- `npm run build`: NOT VERIFIED: local Vite executable is absent (`sh: 1: vite: not found`).
- Authenticated STAGING browser rendering and responsive layout: NOT VERIFIED. Preserve earlier screenshots; do not rebaseline until reviewed.

## STAGING first acceptance check
After Vercel reports Ready, open 게임 정보 and confirm all five top tabs show a small symbol and a label without counts. Ensure the selected tab's gold underline, lower-level counts and search function remain intact; check side-bar/menu at the usual browser size.
