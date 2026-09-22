# LAC HUB 리브랜딩 · STAGING R6

## 기준
이 전체본은 사용자가 적용한 최신 LAC ONE WEB STAGING R5(표 글씨 확대 / 가로 스크롤 수정)를 기준으로 합니다. R5 동작 및 구조를 유지하고 사용자에게 보이는 브랜드 문자열 `LAC ONE`만 `LAC HUB`로 변경합니다.

## 포함
- 로그인 화면, 로딩 화면, 홈페이지 내부 브랜드 문구, 브라우저 제목/메타, 게임 정보, 회사 설정 및 초기설정 기본 Discord 카테고리 이름.
- 고객 문의/건의 Discord 알림에 사용되는 서비스 이름.
- 로고형 파비콘의 접근성 이름 (아이콘 모양은 동일).

## 변경하지 않은 항목
- 기존 로그인 화면, 금색/검정 배경 이미지와 파일 경로, UI 레이아웃/표 글씨 배율 및 기존 설정 저장값.
- 회사 생성 코드/DB 권한 검사 설정. DB SQL 추가 실행 없음.
- `axe_product` 스키마, 환경변수, Supabase 및 기존 회사 ID/초대코드 키, 인증/권한/호출 경로.
- 기존 Discord 서버에 이미 생성된 카테고리/채널 이름. 자동으로 이름을 변경하면 각 회사 설정이 덮어써질 수 있어 제외.
- 별도 STAGING BOT 소스/운영 BOT. BOT 사용자 노출 이름은 별도의 최신 BOT 소스 기준으로 변경해야 함.
- Discord OAuth 승인 화면의 애플리케이션 표시 이름과 이메일 권한은 Discord Developer Portal 및 OAuth 설정에 속하며 WEB의 이 ZIP만으로 변경되지 않음.

## 적용/검증
최신 LAC ONE WEB STAGING GitHub 프로젝트 폴더에 전체 덮어쓰기 (운영 WEB, 구 AXE NET/BOT 제외).
`npm run check` 및 `node scripts/lac-hub-brand-r6-check.mjs` 를 통한 소스 검사를 권장.
기존에 생성된 회사 카테고리 명칭은 회사 관리자와 협의 후 별도 변경.
