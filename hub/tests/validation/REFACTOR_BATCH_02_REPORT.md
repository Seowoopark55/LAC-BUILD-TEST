# REFACTOR BATCH 02 — ACCOUNTS

Status: SOURCE/CASCADE VALIDATED. Official Vite build/browser suite remains pending because this sandbox cannot install the ZIP's missing npm dependencies.

## Scope
- `src/styles/management.css`
- `scripts/dense-ops-system-check.mjs`
- validation allow-list metadata

## Change
- Removed obsolete desktop 4-column account lane generations that preceded the current 5-column account DOM.
- Removed legacy 540px account rail overrides superseded by the current 636px operational rail.
- Removed obsolete account `nth-child` centering rules superseded by the final 5-column center-axis block.
- Preserved the historical hidden mobile header computed template in a mobile-only compatibility rule because Stage 2 geometry records it.
- Updated the dense-ops source contract to assert the real final 5-column account grid rather than the obsolete legacy selector.

## Validation
- `npm run check`: PASS
- source asset chain: PASS
- refactor change inventory: PASS
- renderer markup unchanged
- account geometry A/B: 12/12 viewport widths identical
- account desktop full-page screenshot A/B: 0 changed pixels
- account mobile full-page screenshot A/B: 0 changed pixels
- Stage 2 baseline files: unchanged
- API/server/database/auth/LIVE: unchanged

## Deferred environment gate
`node_modules` is absent from the supplied ZIP and external npm registry DNS is blocked in this sandbox. Therefore the official Vite production build and Node Playwright Stage 2 browser runner cannot be truthfully marked PASS here. Release Candidate remains blocked on that gate.
