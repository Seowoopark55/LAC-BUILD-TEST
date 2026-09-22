# LAC ONE WEB — STAGING R3 (회사 개설 코드 + 균형형 글씨 크기)

## 기준 및 적용 범위
- 베이스: 직전 LAC ONE WEB 리브랜딩 R2 전체본 (`LAC_ONE_WEB_REBRAND_STAGING_FULL_R2_LOGIN_STUDIO_FIX.zip`).
- STAGING WEB 전체본. **기존 AXE NET, 기존 AXE BOT, STAGING AI BOT 수정 없음.**
- 직전 배경 `public/brand/lac-one-shell-clean.png`, 로그인 배경 `public/brand/lac-one-login-calm.png`, 로그인 카드/Discord OAuth 유지.
- 코드 스키마는 **AXE ONE → AXE HUB → `axe_product`**, **AXE NET `new_axe_net` 아님**. 기존 DB/서버 내부 식별자 및 기존 회사 데이터는 바꾸지 않음.

## 회사 개설 보안
1. 서비스 운영자(기존 platform_admins)만 WEB → 서비스 관리 → [회사 개설 코드]에서 **회사 이름에 묶인 일회용 코드** 발급 가능. 24h/3d/7d 유효기간 선택.
2. 로그인 화면에서 신규 개설자는 선택적으로 코드를 미리 입력할 수 있음. 기존 회원은 그대로 Discord 로그인. **사전 입력은 편의 기능이고, 인증/코드 유효성 검증은 로그인 이후 서버에서 실행됨.**
3. 새로운 회사 생성 화면에서는 코드 + 발급 당시 등록한 **정확히 같은 회사 이름** 필수. 서버 RPC가 코드를 사용자의 로그인 ID/회사 이름에 예약한 뒤 기존 `create_company`를 호출함.
4. DB의 `companies` BEFORE INSERT 트리거가 15분 내 서버 예약 및 만료/일회 사용 여부를 **모든 INSERT 경로에서** 검사. 정상 신규 생성 후 코드는 소모됨. 기존 회사의 멤버 사전 등록/Discord 로그인은 코드 없이 유지. trusted service_role용 예외는 유지.
5. 코드의 원문은 DB에 저장하지 않고 해시만 저장하며, 발급 화면에서 원문은 그 자리에서 한 번만 보여줌. 일회성으로 공유되는 코드이므로 안전한 채널로 전달할 것.

### 매우 중요: DB 적용 필요
- WEB ZIP을 덮어쓰기만 하면 **DB 보안 차단이 활성화되지 않습니다.** 신규 회사 생성을 테스트하려면 별도 SQL 파일 `LAC_ONE_STAGE12_COMPANY_CREATION_CODE_GUARD.sql`을 해당 Supabase 프로젝트 SQL Editor에 적용해야 합니다.
- SQL은 **`axe_product.companies` 테이블의 미래 INSERT 모두에 영향을 줍니다.** STAGING WEB이 운영 WEB과 같은 DB를 사용한다면 운영 회사 생성에도 즉시 영향을 줍니다. **DB 연결 및 백업/운영 영향 확인 전에는 SQL을 실행하지 마세요.**
- SQL은 기존 회사, 기존 회원, 회사 소속 멤버 가입 흐름을 마이그레이션하지 않습니다. 다른 방식으로 회사를 생성하는 외부 API/관리 자동화가 있다면 트리거 영향 검토가 필요합니다.
- SQL 실행 및 실제 신규 회사 생성/무코드 차단/오타·만료·중복 사용 차단은 **실서버 검증이 필요**합니다. 정적 코드 검사는 실 DB 검증을 대신하지 않습니다.

## 글씨 크기
- WEB → 레이아웃 스튜디오에 90~150% 범위의 **전체 글씨 크기 슬라이더 한 개**.
- 기존 `axe_layout_studio_profile_v1` 세부 조정값은 이 버전부터 더 이상 적용하지 않음. 새 로컬 저장 키 `lac_one_type_scale_v1` 사용.
- 100%에서는 기존 글씨 기본 수치 보존. CSS `font-size` 선언 700개 이상을 같은 배율에 연결하고, 기존 운영 테이블의 폰트 토큰 10개도 배율 연동.
- 확대 시 일부 좁은 다열 표는 가로 스크롤을 사용할 수 있음. 모바일·브라우저 확대·글자 끊김은 실제 브라우저에서 검증 필요.

## 로컬 점검 결과
- `npm run check`: 38개 기존 검증 스크립트 전체 통과 (사전 구형 폰트 **기본 수치** 확인은 유지하고 동일한 `calc(기본값 × 배율)` 표기 허용).
- `node scripts/lac-one-stage12-invite-typography-check.mjs`: 8/8 통과.
- JS 구문 검사 4개 파일 통과; CSS 선언 정적 파서 에러 0.
- 이 작업 환경에서는 Vite 실행 파일이 없어 **`npm run build`는 실행 완료되지 못함**. STAGING GitHub/Vercel build 및 실제 브라우저/DB 테스트 필수.

## STAGING 확인 목록
1. 기존 로그인 디자인/배경 변화 없음. 기존 회원은 초대코드 없이 Discord 로그인.
2. 신규 개설자: 선택적 로그인 코드 입력 → Discord 로그인 → 회사 이름+코드 제출 → 정확한 회사 1개 생성.
3. 없는 코드, 회사 이름 불일치, 만료 코드, 재사용 코드로 새 회사 생성 불가. 로그인 화면만 우회하여 직접 RPC 요청해도 DB INSERT 차단.
4. 서비스 운영자만 코드 발급 가능. 회원 등 일반 계정으로 발급 RPC 접근 차단.
5. 공금내역/멤버/자산/계좌/대시보드에서 100/120/140% 확대 시 모든 글씨가 함께 커지고 제목·본문·보조 문구의 기본 크기 순서 유지; 저장·재접속 유지.
6. 기존 회사 데이터 조회/저장/초기설정/Discord 연동·모바일 레이아웃 점검.
