# AXE ONE WEB Refactor Batch 05 — Cooking + Service Management

## Scope

Reference: AXE ONE WEB 3.26.19 + Stage 2 Validation.

This batch restructures only WEB cooking/service-management CSS plus the source-string check that documents the current cooking rail contract. It does not change BOT/NET/server/DB/auth/API contracts or LIVE files.

Changed product/check files in this batch:
- `src/styles/management.css`
- `src/styles/settings.css`
- `scripts/ops-table-fund-standard-check.mjs`
- cumulative refactor allow-list metadata

## Refactor performed

### Cooking
- Removed the obsolete early cooking row/grid generations that were superseded by the final six-column operational lane.
- Confirmed by computed style that the current desktop cooking rail is 680px, not 636px. The lower-specificity 636px rule never won the current cascade.
- Promoted the real current rail contract explicitly: 680px at desktop, 100% at <=760px.
- Retained the final six-column header/body grid and center-axis contract.
- Preserved the surviving 26px minimum action-button height; A/B comparison proved this older value still contributes to the current rendered result.
- Removed four superseded `!important` declarations without changing rendered output.

### Service Management
- Removed the obsolete six-column desktop platform-company grid generation.
- Kept the current wide 760px eight-column contract authoritative.
- Promoted `display:grid` / `align-items:center` into the current rule instead of inheriting them from legacy CSS.
- Removed obsolete desktop nth-child alignment rules.
- Preserved the mobile Discord-cell placement explicitly because A/B computed geometry proved that historical `nth-child(2)` still affects the current mobile layout.

Current platform-company contract remains eight columns and keeps its wider rail rather than being forced into the 636/680px rails used by other operational screens.

## Validation

PASS:
- `npm run check`
- refactor change inventory
- product integrity/change summary checks
- source asset chain
- renderer fixtures
- cooking A/B geometry at 12 widths
- Service Management A/B geometry at 12 widths
- cooking desktop + mobile full-page A/B screenshots: 2/2, changed pixels = 0
- Service Management desktop + mobile full-page A/B screenshots: 2/2, changed pixels = 0

Stage 2 screenshot baselines were not rewritten.

Known defects were not intentionally changed. No JS was modified in this batch, so the existing member-modal rerender defect path was not altered.

## Metrics

Between Batch 04 reference and Batch 05 result:

`src/styles/management.css`:
- lines: 510 -> 513
- `nth-child` / `nth-of-type`: 12 -> 9
- `!important`: 9 -> 9

`src/styles/settings.css`:
- lines: 202 -> 200
- `!important`: 17 -> 13
- `nth-child` / `nth-of-type`: 2 -> 2

All WEB stylesheet files combined:
- `!important`: 82 -> 78
- `nth-child` / `nth-of-type`: 39 -> 36

The small line increase in `management.css` is intentional: surviving cascade behavior is now stated explicitly in the authoritative rule instead of being inherited from obsolete legacy blocks.

## Deferred gate

The official Vite production build remains NOT RUN in this sandbox. The prior npm installation left partial package directories but no executable Vite package, and external npm registry DNS is unavailable. This is recorded as NOT RUN, not PASS.

The official production build/dist asset/original Node Playwright browser gates remain mandatory before a Release Candidate can be declared.
