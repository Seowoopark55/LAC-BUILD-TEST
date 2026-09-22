# Phase 24 — HUB → LAC BUILD 단방향 진입

- 기준: LAC HUB Phase 23 전체본. BUILD 프로젝트는 수정하지 않습니다.
- HUB의 LAC BUILD 콘텐츠 카드가 기존 독립 사이트 `https://axe-hub-peach.vercel.app/`을 새 탭으로 엽니다.
- 도메인 변경 시 HUB Vercel 환경변수 `VITE_LAC_BUILD_URL`에 HTTPS 공개 주소를 설정한 뒤 재배포할 수 있습니다. 미설정 시 기존 독립 주소가 사용됩니다.
- 회사 가입 여부로 BUILD 카드 진입을 막지 않습니다. 카드의 '무료' 표기는 기존 운영 방향이며, 이용권/서버 권한 통합이 완료되었다는 뜻이 아닙니다.
- BUILD → HUB 복귀 링크는 BUILD Phase 02의 비노출 상태를 유지합니다.
- 회사 관리, 게임 정보, COOK 카드 및 콘텐츠 운영 DB/RLS/인증 코드는 변경하지 않습니다.
- 추가 SQL은 없습니다.
- 운영 BUILD URL의 브라우저 응답은 이 소스 패치의 자동 검사 범위 밖이므로, 배포 후 새 탭 실제 이동을 확인하세요.
