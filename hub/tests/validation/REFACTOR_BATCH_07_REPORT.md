# AXE ONE WEB Refactor Batch 07 Report

## Scope

Batch 07 cleans the root cascade and removes demonstrably dead CSS without changing the reference UI.

### 1. Root shell cascade cleanup
- Removed the fully shadowed 3.18.11 operational `margin-left:0` declaration.
- Removed the fully shadowed 3.21.2 operational offsets (`32px / 16px / 0`).
- Preserved the authoritative 3.21.3 offsets (`72px / 48px / 12px`) and header-centering behavior.
- Updated `platform-shell-balance-check.mjs` to verify the actual final shell contract instead of historical intermediate values.

### 2. Retired legacy feedback modal CSS
- Confirmed `feedback-modal`, `feedback-type-row`, `feedback-submit` and related markup have no JS/renderer references.
- Removed their obsolete rules from `overlays.css` and `brand-skin.css`.

### 3. Retired old FUND History layout CSS
- Confirmed current renderer only reuses these historical class names: `axe-fund-history-select`, `axe-fund-history-select--month`, `axe-fund-history-reset`, and `axe-fund-history-action`.
- Preserved those live controls.
- Removed 46 unused History layout rules covering the old history board, day groups, rows, titles, money, metadata, toolbar and responsive layout.
- Removed the corresponding dead brand-skin rules.

## CSS reduction

Batch 06 -> Batch 07:
- Total CSS lines: 2442 -> 2322 (-120)
- Total `!important` declarations: 118 -> 94 (-24)
- `src/styles.css`: 365 -> 345 lines
- `src/styles/fund.css`: 640 -> 547 lines
- `src/styles/brand-skin.css`: 136 -> 130 lines
- `src/styles/overlays.css`: 36 -> 35 lines
- `brand-skin.css` `!important`: 45 -> 26
- `nth-child` / `nth-of-type`: unchanged in this batch (36); no positional selector was removed without a separate DOM/cascade proof.

## Validation

Passed:
- Existing source check suite
- Refactor change inventory
- Product integrity allowlist check
- Syntax validation
- Source asset chain validation
- 21 renderer fixtures

A/B visual validation against Batch 06 reference:
- 1440px: FUND, Members, Assets, Accounts, Settings, Platform — exact pixel diff 0
- Shell geometry at 760/761/980/981/1280/1281px for FUND, Settings, Platform — identical
- Legacy feedback removal: Modal, Questions, Suggestions desktop/mobile — exact pixel diff 0
- FUND legacy-history removal: FUND, Weekly, Review desktop/mobile — exact pixel diff 0

Known defects intentionally preserved:
- Mobile weekly payment 7-cell markup / 6-track grid mismatch
- Existing intermediate-width clipping defects
- Member modal draft loss path caused by full rerender

## Not run in this sandbox

The official Vite production build / generated dist asset validation / Node Playwright Stage 2 browser runner remain NOT RUN because this sandbox does not contain a complete Vite installation and external npm registry access is unavailable. They remain mandatory Release Candidate gates and are not counted as PASS.

## External contracts

No changes to:
- AXE BOT / AXE NET
- server runtime / PM2
- Supabase schema, RPC, trigger, function
- auth or permissions
- external API contracts
- LIVE environment
