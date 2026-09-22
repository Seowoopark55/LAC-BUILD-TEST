# AXE ONE Operational Table Standard — Refactor Baseline

Reference: AXE ONE WEB 3.26.19 + Stage 2 Validation, Refactor Batch 06.

This document records only rules proven by the current rendered UI. It is not a redesign specification.

## Shared density tokens

Defined in `src/styles/tokens.css`:

- `--ops-rail-standard: 636px`
- `--ops-table-header-height: 27px`
- `--ops-table-row-height: 40px`
- `--ops-table-gap: 4px`
- `--ops-table-cell-pad-inline: 8px`
- `--ops-table-action-min-width: 42px`
- `--ops-table-action-pad-inline: 6px`
- `--ops-table-action-font-size: 8.4px`

These values are intended to become future Layout Studio controls only after the surrounding feature contract is proven stable.

## Rail policy

The shared rail is not universal.

- Standard operational rail: 636px — Members, Assets/Returns, Accounts, FUND ledger/weekly/review.
- Cooking: current computed desktop rail remains 680px.
- Service Management: current wide rail remains 760px.
- Mobile: feature rules retain their existing full-width/stack behavior.

Do not force Cooking or Service Management into the 636px rail merely for visual uniformity.

## Column policy

Header and data row for a feature must use the same column definition. Column count and tracks remain feature-specific.

Current examples:

- Members: 6 columns
- Accounts: 5 columns
- Assets: 7 columns
- Returns: 6 columns
- FUND ledger: 8 columns
- FUND weekly: 7 cells with the known <=760px 6-track defect preserved for the separate defect-fix phase
- FUND review: 7 columns
- Cooking: 6 columns
- Service Management: 8 columns / wide rail

## Shared empty state

The identical Members/Assets/Accounts empty state and FUND ledger empty state are now defined once in `src/styles/components.css`.

Cooking and platform empty states remain feature-specific because their current presentation differs.

## Responsive policy

Batch 06 does not redesign responsive behavior. Existing stack/overflow rules and known defects remain reference behavior. Responsive consolidation belongs to the later global/responsive cleanup batch.

## Non-goals for this standard

- No forced universal rail width.
- No universal column count.
- No Layout Studio implementation in this phase.
- No known defect fixes.
- No BOT/NET/server/DB/auth/API contract changes.
