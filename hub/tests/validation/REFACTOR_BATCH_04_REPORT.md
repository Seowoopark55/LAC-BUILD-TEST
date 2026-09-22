# AXE ONE WEB Refactor Batch 04 — Fund

## Scope

Reference: AXE ONE WEB 3.26.19 + Stage 2 Validation.

This batch restructures only WEB fund CSS and the source-string checks that describe the fund ledger contract. It does not change BOT/NET/server/DB/auth/API contracts or LIVE files.

Changed product/check files in this batch:
- `src/styles/fund.css`
- `scripts/fund-ledger-axis-specificity-check.mjs`
- `scripts/fund-ledger-alignment-check.mjs`
- cumulative refactor allow-list metadata

## Refactor performed

### Ledger
- Retired obsolete desktop six-column ledger generations.
- Retired superseded 760px eight-column ledger generations.
- Promoted the current 636px eight-column ledger rule to the authoritative desktop contract.
- Replaced historical nth-child axis correction with semantic header/data center-axis selectors.
- Preserved the historical hidden mobile header computed template in a mobile-only compatibility rule because it is part of the Stage 2 reference.

Current ledger contract remains:
`날짜 | 이름 | 계좌 | 내역 | 구분 | 금액 | 증빙 | 관리`

### Weekly payment
- Removed the obsolete global/desktop weekly grid generations.
- Preserved the existing mobile six-track rule explicitly. The known 7-cell/6-track Stage 2 defect is intentionally unchanged.

### Review queue
- Removed obsolete desktop review grid generations and retained only properties that still survive in the current cascade.
- Preserved the <=980px `grid-column:1/-1` action-lane behavior because A/B geometry proved it still affects the current reference at intermediate widths.
- Kept the final seven-column desktop review contract unchanged.

## Validation

PASS:
- `npm run check`
- refactor change inventory
- Stage 2 static validation available without external dependencies
- source asset chain
- renderer fixtures
- ledger A/B geometry at 12 widths
- weekly A/B geometry at 12 widths
- review A/B geometry at 12 widths
- fund/weekly/review desktop + mobile full-page A/B screenshots: 6/6, changed pixels = 0

Known defect fingerprint preserved:
- mobile weekly at 390px: 7 header cells, 7 data cells, 6 computed grid tracks
- existing intermediate-width behavior preserved by A/B geometry
- no JS was changed in this batch, so DEF-03 rerender path was not altered

Stage 2 screenshot baselines were not rewritten.

## Metrics

`src/styles/fund.css`:
- before: 782 lines
- after: 641 lines
- current nth-child/nth-of-type occurrences: 9
- current `!important` occurrences: 2

## Deferred gate

The official Vite production build and the original Node Playwright Stage 2 browser runner cannot be executed in this sandbox because the ZIP contains no `node_modules` and external npm registry DNS is unavailable. This is recorded as NOT RUN, not PASS.

The official production build/dist asset/browser gates remain mandatory before a Release Candidate can be declared.
