# AXE ONE Layout Studio · Phase 1

## Goal
Create a PLATFORM OWNER-only, human-readable layout calibration tool on top of the refactored operational UI standard without changing DB schema, RPCs, auth, BOT/NET, or LIVE infrastructure.

## What Phase 1 adds
- PLATFORM OWNER account-menu entry: `레이아웃 스튜디오`
- Easy controls:
  - 글자 크기: 작게 / 기본 / 조금 크게 / 크게
  - 행 간격: 촘촘 / 기본 / 여유
  - 표 너비: 조금 좁게 / 기본 유지 / 조금 넓게
  - 상태·관리 요소: 작게 / 기본 / 크게
- Collapsible advanced controls with +/- steppers
- Live member-table preview
- Changes apply immediately to operational UI tokens in the current browser
- Save/revert/default controls
- Browser-local persistence only (`localStorage`) in Phase 1

## Token additions
Default values preserve the refactor RC result:
- `--ops-table-header-font-size: 8.5px`
- `--ops-table-primary-font-size: 10.2px`
- `--ops-table-secondary-font-size: 9px`
- `--ops-table-control-font-size: 9.6px`
- `--ops-table-status-font-size: 8.3px`
- existing standard rail/density/action tokens remain authoritative

Management, FUND, Cooking, and Platform operational tables now consume these typography tokens while preserving their existing default computed values.

## Member management change
The redundant WEB `+ 멤버 등록` CTA was removed from the member-management page.
Existing registration paths remain:
- Discord user context menu -> App -> AXE member registration
- Initial guided setup / bulk member registration
- Existing server direct-registration API remains intact as compatibility/safety infrastructure

## Safety boundary
Phase 1 does NOT modify:
- Supabase schema / RPC / trigger / function
- authentication / permissions
- AXE BOT / AXE NET / PM2
- external API contracts
- LIVE environment

The saved Layout Studio profile is browser-local. Platform-wide persistence is intentionally deferred to a later phase after the interaction model is approved.

## Validation
- `npm run check`: PASS
- `scripts/layout-studio-check.mjs`: 15/15 PASS
- `validate:assets`: PASS
- `validate:fixtures`: PASS
- Layout helper preset/adjust/clamp logic: PASS
- Desktop/mobile A/B against Refactor RC defaults:
  - FUND: pixel diff 0
  - Accounts: pixel diff 0
  - Assets: pixel diff 0
  - Cooking: pixel diff 0
  - Platform Service Management: pixel diff 0
  - Members: only intentional WEB registration CTA removal differs
- Layout Studio desktop render: visually inspected
- Layout Studio mobile render: visually inspected

## Next phase after user validation
1. Tune intuitive labels/preset ranges from real usage.
2. Decide platform-wide persistence architecture.
3. Only then connect approved Studio values to a server/global configuration source.
