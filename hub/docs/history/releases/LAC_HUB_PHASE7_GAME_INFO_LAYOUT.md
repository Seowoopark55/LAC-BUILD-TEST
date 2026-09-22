# LAC HUB — 게임 정보 2차 UI 고급화 (Phase 7)

- Phase 6 전체본 기반. 독립 게임 정보 화면의 외곽 도시 배경, 넓어진 히어로, 검색 오버레이, 다섯 실사용 탭, 목록 카드, 상세/빈 상태 레이아웃 재구성.
- 파일: `src/ui/render.js`, `src/styles.css`, `src/styles/game-center-v2.css` 및 신규 회귀검사.
- 카테고리별 생성 이미지 6개는 Phase 6 파일 그대로 재사용. 이미지는 대표 분위기 자산이며 실제 개별 아이템 사진이 아니다.
- `src/ui/infoPage.js`, 원래 회사 관리의 게임 정보 화면, 기존 DB/RLS/세션/이용권/로그인, 정보 데이터 및 메뉴 이벤트 로직 변경 없음.
- UI 시안의 가상 아이템, 보상액, 레시피, 제작 버튼 등은 실데이터로 추가하지 않음.
- 검증: `npm run check`, `node scripts/hub-phase7-independent-layout-check.mjs`, 기존 Phase 5·6 검사. 운영 사이트 및 실제 Discord 인증 검증 별도 필요.
