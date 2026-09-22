# AXE ONE Discord Guided Setup · Category Layout R1

## Scope
Guided Setup quick channel creation only. Existing channel-ID bindings remain the functional source of truth.

## Recommended Discord layout

- AXE ONE · 무법지대
  - 3시-총알
  - 10시-총알
  - 핀볼-모집
  - 전적-등록
- AXE ONE · 회사운영
  - 공금현황판
  - 계좌조회
- AXE ONE · 편의기능
  - 개조서
  - 요리-주문

Only channels required by enabled company modules are created.

## Compatibility
- Direct channel connection flow unchanged.
- Legacy single-category API payload remains accepted.
- Category membership is presentation-only; feature bindings still persist channel IDs.
- Re-running quick setup reuses matching category/channel names under the same category.
- Automatic category creation is capped at three categories.

## Validation
- `npm run check`: PASS
- Guided category layout contract: 10/10 PASS
- `npm run validate:static`: PASS
- `npm run validate:assets`: PASS
- `npm run validate:fixtures`: PASS
- Production Vite build: NOT RUN in ChatGPT sandbox (`vite: not found`); run normal GitHub/Vercel STAGING build before promotion.
