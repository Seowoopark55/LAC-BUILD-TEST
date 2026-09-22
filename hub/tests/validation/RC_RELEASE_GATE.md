# AXE ONE WEB Refactor RC1 — Release Gate

RC source status: **frozen**  
Deployment status: **HOLD until official build/browser gates are rerun**

## Required environment

Use a clean Node environment with registry access and the existing `package-lock.json`.
Do not edit product source, package versions, or Stage 2 baselines while completing this gate.

## Required commands

```bash
npm ci
npm run check
npm run validate:static
npm run validate:assets
npm run validate:build
npm run validate:fixtures
npm run validate:browser
npm run validate:negative
```

`validate:browser` / the full suite is expected to remain non-zero because Stage 2 intentionally retains DEF-01, DEF-02, and DEF-03. Therefore promotion must be based on the detailed JSON results, not only the shell exit code.

## Promotion conditions

1. Production Vite build succeeds.
2. `dist/index.html` references generated hashed JS/CSS and all referenced files exist.
3. Production smoke confirms actual JS boot and stylesheet CSSOM load.
4. CSS-404 negative control is detected.
5. Visual comparison remains 42/42 PASS against the existing baseline; do not record a new baseline.
6. Geometry baseline remains PASS.
7. Browser/layout failures contain only the already-recorded DEF-01 and DEF-02 fingerprint; no new defects.
8. Interaction result contains the existing DEF-03 failure only; the other five existing checks remain PASS.
9. Source asset chain remains PASS.
10. `index.html`, entry JS, package/lock chain and external contracts are unchanged unless separately approved.

If all conditions above hold, the exact same source may be promoted from `RC1_BUILD_GATE_PENDING` to the final refactor release candidate without another UI refactor pass.
