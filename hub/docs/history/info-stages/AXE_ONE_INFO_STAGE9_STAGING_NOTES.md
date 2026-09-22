# AXE ONE WEB — INFO STAGE 9 / legacy modbook classification (STAGING ONLY)

Baseline: `AXE_ONE_WEB_INFO_STAGE8_MODBOOK_STAGING_R1.zip` (WEB-only, full-source ZIP).
Deploy only to AXE ONE WEB **STAGING** using the established GitHub/Vercel flow. Never deploy to AXE NET, LIVE, or BOT.

## Scope
- For records whose stored `category` is blank or merely matches `type` (`접두`/`접미`), retain the Stage 8 priority: first recognize explicit category labels; then fully recognized application labels in `parts`.
- If neither identifies an application and the **option descriptions explicitly mention the previously verified game skills** `채집` and/or `요리`, use those as provisional display-only category labels. `돌판의` -> `생활 > 접미 > 채집`; `냄비의` -> `생활 > 접미 > 요리`.
- If both confirmed skill terms occur, show one original row in each appropriate category, not duplicate database records or global search results.
- Display details disclose when displayed application labels come from options; stored DB values stay unchanged.
- Keep uncertain cases in `분류 미확인`; do not blindly infer from item's name, ingredient names, or general keywords. An exception chip is still shown if truly ambiguous entries exist.
- Existing company-scoped read path, RLS, prefix blue/suffix red, all other screens, and bot/DB remain unchanged.

## Changed files relative to Stage 8
- `src/ui/infoPage.js`: narrow verified option effect fallback, display hint.
- `scripts/info-catalog-stage9-check.mjs`: synthetic classification and regression tests.
- This note.

## Local checks
- Stage 9: 11/11 synthetic checks PASS.
- Stage 8: 11/11 synthetic checks PASS.
- Stage 7: 14/14 synthetic checks PASS.
- Stage 6: 18/18 synthetic checks PASS.
- `npm run check`: PASS.
- `node --check src/ui/infoPage.js`: PASS.
- Production build and authenticated browser rendering: NOT verified locally (no Vite executable). Validate in STAGING.
- Stage 8 screenshots and all legacy baseline images are unchanged, not rebaselined.

## First STAGING acceptance step
Open `게임 정보 → 개조서 → 생활 → 접미` and check `채집` contains `돌판의` and `요리` contains `냄비의`. Then confirm `분류 미확인` no longer contains those entries. If additional unmatched entries remain, collect their details before expanding classification rules.
