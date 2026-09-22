# AXE ONE WEB — INFO STAGE 6 (STAGING ONLY)

Baseline: AXE_ONE_WEB_INFO_STAGE5_STAGING_R1.zip. Complete WEB repository ZIP. **Do not deploy this to AXE NET or to LIVE.**

## Changes

- Four top-level information tabs remain 제작법 / 생산 / 퀘스트 / 스킬 등급. All "전체" browse chips were removed. Browsing defaults to a valid category (제작법 → 근접무기, 생산 → 목재, 퀘스트 → 벌목, 스킬 등급 → 생활).
- 퀘스트 grade chips are optional: clicking an active grade again removes the grade constraint; there is no "전체" grade chip.
- 스킬 등급 no longer has a dropdown. The category (생활·생산·전투·기술) and its contained skills are directly visible buttons. The initial list prompts for a skill; selecting one shows only its levels.
- Global search is outside all category filters. It searches craft recipes and linked material names, separate weapon-part combinations, production, quests and skill ranks, while respecting inactive visibility. Each result states its source path; opening a result navigates to the relevant category and selects its detail. Emptying search restores the current browse context.
- The 95 craft-material rows remain connected to the original craft and are searchable through their parent craft; no duplicate free-standing "필요 재료" list is reinstated.
- Existing authentication, sidebar, company operational pages, APIs, BOT and database are unchanged. This WEB release is still information READ ONLY; PLATFORM OWNER editing UI is not part of this stage.

## Changed files relative to Stage 5

- src/ui/infoPage.js (navigation and global search rendering)
- src/main.js (category chip toggles and cross-category result navigation; initial group state)
- src/styles/info.css (global search result path layout)
- visual-check-local.html (static mock preview only)
- scripts/info-stage6-preview.mjs (static mock generator)
- scripts/info-catalog-stage6-check.mjs (synthetic regression fixture)
- AXE_ONE_INFO_STAGE6_STAGING_NOTES.md (this file)

## Verification

- JS syntax: PASS for src/ui/infoPage.js and src/main.js.
- `node scripts/info-catalog-stage6-check.mjs`: 18/18 PASS on SYNTHETIC fixture; not a live DB/login test.
- `npm run check`: PASS (existing WEB-wide static and logic checks).
- `npm run build`: NOT VERIFIED: Vite binary unavailable (`vite: not found`) in the local environment.
- Chromium static-preview screenshot: NOT VERIFIED: local headless browser timed out. Visual and live session checks must be done in STAGING.

## STAGING acceptance test (one step at a time)

1. After Vercel Ready, enter 게임 정보 → 스킬 등급. Confirm four fields and directly visible skills, no dropdown and no 전체 chip. Select 생활 → 벌목; verify levels and required points.
2. In another category (e.g. 생산 → 목재), type `화약` into global search. Confirm craft source is shown, open its result, confirm 제작법 → 부품·원재료 and detail, then clear search.
3. Check 제작법의 무기부품 2 조합 and its linked materials, 생산 목재/재련, 퀘스트 grade filter and former app sidebar/support screens.
4. Verify same search as a non-platform-admin account; no edit actions, no inactive records.

No SQL needs to be run for this release.
