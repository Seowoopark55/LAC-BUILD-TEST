# AXE ONE WEB 3.26.19 — Refactor Batch 09 Release Candidate Report

Date: 2026-09-17

## Status

**Source RC candidate: PASS**  
**Release/deployment gate: HOLD — official production build/browser dependencies unavailable in this sandbox**

Batch 09 made no product-code changes. It freezes the Batch 08 source and validates it against the original Stage 2 source/reference.

## Scope

- No design change
- No feature addition
- No known-defect fix
- No BOT / NET / PM2 / DB / RPC / trigger / auth / external API / LIVE change
- No screenshot baseline update

## Final source validation

- Existing product/source checks: PASS
- Refactor change inventory: PASS
- Refactor-aware product integrity: PASS
- Syntax: PASS
- Legacy checks: PASS
- Source asset chain: PASS
- Renderer fixtures: 21/21 PASS

Critical chain files are SHA-256 identical to Stage 2:

- `index.html`
- `package.json`
- `package-lock.json`
- `src/main.js`
- `src/ui/render.js`

All product `src/**/*.js` files are identical to Stage 2.

## Full visual equivalence

The original `AXE_ONE_3.26.19_STAGE2_VALIDATION` source and this RC source were rendered side-by-side with the same system Chromium, locale, timezone, DPR, reduced-motion setting, fixed date, fixture states, renderer, and viewport.

- Desktop 1440×1000: 21/21 exact matches
- Mobile 390×844: 21/21 exact matches
- Total: **42/42 exact matches**
- Different pixels: **0 for every image**

The Stage 2 baseline directory itself remains byte-identical:

- 45 files checked
- 0 changed
- 0 added
- 0 removed

No baseline was re-recorded.

## Intermediate-width geometry equivalence

The following screens were compared between Stage 2 and RC:

- FUND ledger
- Weekly payment
- Members
- Cooking
- Service Management / Platform

Widths:

- 560
- 561
- 760
- 761
- 900
- 901
- 980
- 981
- 1280
- 1281

Result: **50/50 computed geometry comparisons identical**.

Metrics included container rectangles, header/row grids, cell positions, labels, overflow, and clipped-button observations.

## Known defects preserved

### DEF-01 — mobile weekly payment 7 cells / 6 tracks

At 390 / 560 / 561 / 760px:

- header cells: 7
- row cells: 7
- header grid tracks: 6
- row grid tracks: 6

Stage 2 and RC are identical.

### DEF-02 — intermediate-width clipping

All 13 recorded Stage 2 combinations remain present and A/B-identical:

- FUND 761
- Cooking 761
- Platform 761
- FUND 900
- Platform 900
- FUND 901
- Platform 901
- Platform 980
- FUND 981
- Members 981
- Cooking 981
- Platform 981
- Platform 1281

No clipping defect was accidentally fixed or worsened during refactoring.

### DEF-03 — member modal draft loss on notice rerender

Product JS is byte-identical to Stage 2. `setNotice()` still sets notice state and immediately invokes `render()`. Existing Stage 2 interaction evidence remains:

- search focus/cursor: PASS
- filter + pagination: PASS
- dropdown open/close: PASS
- modal draft survives notice rerender: existing FAIL
- select value survives rerender: PASS
- mocked member save: PASS

This defect remains intentionally deferred to the separate defect-fix phase.

## Refactor outcome metrics

| Metric | Stage 2 | RC | Delta |
|---|---:|---:|---:|
| Total CSS lines | 2665 | 2309 | -356 |
| `!important` | 122 | 94 | -28 |
| `nth-child` / `nth-of-type` | 70 | 36 | -34 |
| `@media` occurrences | 83 | 73 | -10 |
| Selector occurrences* | 2777 | 2507 | -270 |
| Repeated exact selectors* | 560 | 512 | -48 |
| Duplicate-selector excess* | 789 | 652 | -137 |

\* Exact-selector metrics are a normalized static scan used for before/after trend measurement, not a full CSS parser/specificity proof.

## Common Operational UI Standard created

The refactor now exposes shared operational values in `src/styles/tokens.css`:

- `--ops-rail-standard: 636px`
- `--ops-table-header-height: 27px`
- `--ops-table-row-height: 40px`
- `--ops-table-gap: 4px`
- `--ops-table-cell-pad-inline: 8px`
- `--ops-table-action-min-width: 42px`
- `--ops-table-action-pad-inline: 6px`
- `--ops-table-action-font-size: 8.4px`

Screen-specific rail/column models remain intentionally separate where the current UI differs, including Cooking 680px and Service Management 760px.

This is the intended basis for a future AXE ONE Layout Studio without forcing every screen into the same column model.

## Official gates unavailable in this sandbox

### Production build

`npm run validate:build` => `NOT RUN`.

Reason: Vite is not installed in the current incomplete `node_modules`, and registry DNS is unavailable. This is not treated as PASS.

### Official Node browser suite

`npm run validate:browser` cannot start because Node package `playwright` is unavailable.

The 42-image and 50-geometry A/B checks above used the available system Chromium + Python Playwright. They do not replace the official dependency-backed browser gate.

### Negative controls

`npm run validate:negative` cannot start because Node package `pngjs` is unavailable (`pixelmatch`/Playwright dependencies are also not installed).

This is not treated as PASS.

## Release decision

The source refactor is frozen as **RC1 / build-gate-pending**.

Do not deploy this RC solely from this report. Promotion requires a dependency-complete environment to run the official Stage 2 gates without changing product source or baselines.

See `tests/validation/RC_RELEASE_GATE.md`.
