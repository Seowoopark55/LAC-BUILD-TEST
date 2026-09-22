# AXE ONE WEB Refactor Batch 06 — Operational UI Standard

## Scope

Reference: AXE ONE WEB 3.26.19 + Stage 2 Validation, using Batch 05 as the immediate A/B reference.

This batch formalizes only UI values already proven common by the prior screen-by-screen cleanup. It does not redesign any screen and does not change renderer markup, application JS, BOT/NET/server/DB/auth/API contracts, or LIVE files.

Runtime style files changed:
- `src/styles/tokens.css`
- `src/styles/components.css`
- `src/styles/management.css`
- `src/styles/fund.css`
- `src/styles/settings.css`

Validation source checks were updated so they verify token value + token usage rather than requiring old hard-coded CSS strings.

## Standard promoted from current computed UI

Shared tokens now control:
- standard operational rail: 636px
- table header height: 27px
- data row height: 40px
- table gap: 4px
- horizontal cell padding: 8px
- compact action minimum width: 42px
- compact action horizontal padding: 6px
- compact action font size: 8.4px

The standard rail is used by Members, Assets/Returns, Accounts and FUND table views.

Cooking remains 680px on desktop and Service Management remains a 760px wide rail. Their current widths were intentionally not forced into the standard rail.

## Empty-state consolidation

The byte-equivalent `.ops-mgmt-empty` and `.axe-fund-ledger-empty` visual declarations were removed from their feature files and replaced by one shared rule in `components.css`.

Cooking/platform empty states remain separate because their current UI differs.

## Validation

PASS:
- `npm run check`
- refactor change inventory
- product integrity/change summary
- source asset chain
- 21 renderer fixtures
- A/B full-page screenshots, changed pixels = 0:
  - Members desktop/mobile
  - Accounts desktop/mobile
  - Assets desktop/mobile
  - Returns desktop/mobile
  - FUND ledger desktop/mobile
  - FUND weekly desktop/mobile
  - FUND review desktop/mobile
  - Cooking desktop/mobile
  - empty Members/FUND/Assets/Accounts desktop/mobile
- computed A/B at responsive boundaries 760 / 761 / 980 / 981px for Members, Accounts, Assets, Returns, FUND ledger, Weekly, Review and Cooking: all identical

Stage 2 screenshot baselines were not rewritten.

## Known defects

No known defect was fixed in this batch.

- DEF-01 weekly mobile remains reproducible: 7 header/row cells with a 6-track computed grid at 390px.
- DEF-02 intermediate-width behavior was not redesigned; A/B computed geometry at the 760/761 and 980/981 boundaries remains identical to Batch 05.
- DEF-03 remains in source: `setNotice()` still performs the production `render()` path that can replace an open member modal draft.

## Interaction risk

No JS or renderer markup changed in Batch 06. Event binding and application interaction paths are byte-identical to Batch 05. CSS A/B screenshots and computed geometry are identical on all affected screens tested above. The official Node Playwright interaction suite remains part of the deferred RC gate because the sandbox cannot currently restore the package installation.

## Deferred production gate

Official Vite production build / generated dist asset validation / official Node Playwright browser suite remain NOT RUN in this sandbox because the local npm installation is incomplete and external npm registry DNS is unavailable.

This is NOT treated as PASS. These gates remain mandatory before Release Candidate declaration.

## Result

Batch 06 establishes a real shared operational UI contract without imposing one layout on every screen. Future changes to the proven common density values can now be made in `tokens.css`, while column definitions and feature-specific rail widths remain local to their feature rules.
