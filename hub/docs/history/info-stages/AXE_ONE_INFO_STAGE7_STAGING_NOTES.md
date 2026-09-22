# AXE ONE WEB — INFO STAGE 7 / 개조서 조회 통합 (STAGING ONLY)

Baseline: user-uploaded `axe one(3).zip` (INFO STAGE 6). This ZIP is a **complete WEB source**, not a BOT patch or a migration. Deploy ONLY to AXE ONE WEB STAGING, not AXE NET (`new_axe_net`) or LIVE.

## Changes
- 게임 정보의 기존 four tabs are retained; a fifth top-level `개조서` tab is added without adding sidebar items.
- 개조서 data is read directly from the **existing** `axe_product.modbook_catalog` with an explicit `company_id` filter for the currently selected AXE ONE company and the existing member-read RLS. `modbook_requests` and the original modbook approval, pricing and company-admin write workflows are not changed.
- The modbook browser has three main groups `무기 / 생활 / 전투`, then `접두 / 접미`, then a context-specific detailed category. No `전체` browsing chip. Composite categories (e.g. `근접무기, 채광`) appear under each matching group without duplicating records in the DB or global search.
- Three existing records with raw category `접두` or `접미` have no verified semantic group. They remain accessible via the visibly labelled `분류 확인` exception control and global search; the DB category is not silently guessed or rewritten.
- Existing global search also covers the currently selected company's modbooks. It is NOT a cross-company modbook search. Detail shows existing options, parts, success rate, recorded recent price and its date/notes without modifying the source.
- Cached company-scoped rows are invalidated when switching company/account; stale asynchronous responses cannot re-populate the new company's information. A modbook-only read error is shown without blanking the other information modules.
- PLATFORM OWNER information editing UI is not part of this stage. The original company OWNER / ADMIN modbook write permissions are untouched; this new information panel is read-only.

## Changed/new files
- `src/lib/productApi.js`: company-scoped read-only modbook query, paginated 500 rows at a time.
- `src/main.js`: selected-company fetch/invalidation and browse/search event wiring.
- `src/ui/infoPage.js`: group filter, global search, safe modbook details and unclassified exception view.
- `src/styles/info.css`: five tab layout, modbook exception chip.
- `scripts/info-catalog-stage7-check.mjs`: synthetic Stage 7 regression fixture.
- `scripts/info-catalog-stage6-check.mjs`: older invariant check expected tab count changed from four to five (its other 17 checks unchanged).
- This note file.

## Local checks performed
- JS syntax: PASS.
- `node scripts/info-catalog-stage6-check.mjs`: 18/18 PASS (synthetic Stage 6 behavior compatibility, fifth tab accepted).
- `node scripts/info-catalog-stage7-check.mjs`: 14/14 PASS (synthetic Stage 7 fixture; **not** a live login/RLS test).
- `npm run check`: exit 0 / PASS (existing source-wide static tests).
- `npm ci --offline`: NOT AVAILABLE (Vite tarball is not in the container cache); `npm run build`: NOT VERIFIED (`vite: not found`). Must verify Vercel production build + actual logged-in browser interactions in STAGING.
- Historical screenshots under `validation-results` have NOT been rebaselined. Existing WEB styling and non-information pages have not been intentionally changed.

## STAGING acceptance sequence (one step at a time)
1. Deploy full source to AXE ONE WEB STAGING. Check Vercel build is Ready.
2. As a member of the AXE company, go to 게임 정보 → 개조서 → 무기 → 접두 → SMG. Confirm the count and readable detail; provide screenshot.
3. Check 접미 and 생활 / 전투 filters, including a compound category and `분류 확인` exception rows.
4. Search a modbook by name in the shared search, open result, confirm navigation back to company-scoped detail.
5. If multiple AXE ONE companies exist, switch to another company; ensure previous-company names/prices never appear, including after an in-flight refresh. Verify a non-member cannot use this screen to read that company's catalog.
6. Verify existing BOT and original company modbook management are unaffected. No SQL execution is needed for this WEB stage.
