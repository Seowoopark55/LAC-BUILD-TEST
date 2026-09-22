# LAC HUB · Phase 25 공식 주소 전환 — 배포 전 점검용

공식 HUB: `https://lac-hub.vercel.app`
구형 별칭: `https://axe-product.vercel.app`

이 ZIP은 **코드 안에 하드코딩된 구형 URL만 공식 URL로 바꾸는 준비 패치**입니다. Vercel 환경변수·Supabase Auth URL 설정·Discord OAuth Redirect URI·기존 외부 링크·Vercel 도메인 설정은 이 ZIP으로 변경되지 않습니다. **배포 전에 아래의 실제 운영 설정을 확인해야 합니다. 구형 도메인은 아직 제거하지 마세요.**

## 소스 감사 결과 (Phase 24 전체본 기준)

- Discord 서버/BOT 연결 승인 콜백의 기본 URL: `server/discordSecurity.js` (구형 도메인 참조 2곳)
- 회사 질문 답변 Discord 알림 링크: `api/support/notify.js` (구형 도메인 참조 1곳)
- 회사 건의 답변 Discord 알림 링크: `api/suggestions/notify.js` (구형 도메인 참조 1곳)
- `.env.example`의 구형 URL 예시 2곳
- `axe_product` DB 스키마·버킷 이름, `axe_product_*` 로컬 저장 키, npm package 이름은 도메인 URL이 아닙니다. 변경하면 저장 데이터와 호환성이 깨질 수 있어 유지했습니다.

## 실제 운영 설정 확인 (사용자 작업 · 비밀키를 전송하지 마세요)

1. Vercel **HUB 프로젝트** Settings → Environment Variables → Production/Preview에서 `DISCORD_REDIRECT_URI`, `AXE_PRODUCT_APP_URL`, `LAC_HUB_APP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_DISCORD_AUTH_PROVIDER` **이름과 공개 가능한 값만** 확인. 기존 `AXE_PRODUCT_APP_URL` 값이 구형이면 `LAC_HUB_APP_URL=https://lac-hub.vercel.app`를 설정하고, 구형 `AXE_PRODUCT_APP_URL`는 다른 코드/배포가 쓰는지 확인 후 제거하거나 공식 URL로 갱신. `DISCORD_REDIRECT_URI`는 새 콜백이 Discord 개발자 포털에 등록된 뒤 `https://lac-hub.vercel.app/api/discord/callback`으로 갱신. **환경변수 변경에는 재배포가 필요할 수 있습니다.**
2. Discord Developer Portal → 해당 **봇/서버 연결 OAuth 애플리케이션** → Redirects: `https://lac-hub.vercel.app/api/discord/callback`을 먼저 추가. 기존 구형 콜백은 성공 테스트 후 제거. **Supabase Discord 로그인에 사용하는 Redirect URI와 BOT 서버 연결용 Redirect URI는 서로 다른 인증 흐름일 수 있으므로 혼동하지 마세요.**
3. Supabase Auth → URL Configuration의 Site URL / Redirect URLs: 공식 HUB 주소와 로그인 반환 경로 확인. 현재 `VITE_SUPABASE_DISCORD_AUTH_PROVIDER` 설정과 승인된 OAuth Redirect URI도 확인. 기존 사용자 ID/Provider를 변경하는 조치는 이번 작업에서 금지.
4. Vercel 다른 프로젝트(BUILD 포함)의 HUB 링크, Discord 공지 및 봇 설정, 공유한 주소/북마크, 외부 서비스 Webhook·OAuth 설정 중 구형 URL 참조 확인. 구형 주소가 달린 기존 사용자가 있다면 제거 전에 일정 기간 공식 주소로 리디렉션하는 방법 고려.
5. **구형 도메인 유지 상태**에서 HUB 공식 주소 로그인·로그아웃·새로고침·회사 생성/가입·회사 관리·게임 정보·게시판·첨부·Discord 봇 연결/재승인·DM 알림 링크·BUILD 단방향 연결 테스트.
6. 1~5 모두 확인한 **이후에만** Vercel 프로젝트 Settings → Domains에서 `axe-product.vercel.app` 도메인 연결을 제거. 프로젝트/배포/DB 삭제 금지. 구형 링크를 계속 살리려면 제거 대신 301/308 리디렉션용으로 보존할 수도 있습니다.

## 이번 코드의 호환 처리

- `LAC_HUB_APP_URL`이 있으면 사용하고, 없으면 기존 `AXE_PRODUCT_APP_URL` 설정을 우선합니다. 둘 다 없을 때만 공식 HUB 주소 기본값을 사용합니다. 그러므로 **Vercel에 이전 URL 값이 남아 있으면 기존 URL이 사용될 수 있습니다.**
- `DISCORD_REDIRECT_URI` 환경변수가 있으면 그것이 코드의 공식 주소 기본값보다 우선합니다. OAuth 애플리케이션의 실제 허용 Redirect URI와 동일해야 합니다.
- UI/DB/RLS/로그인 Provider/회사 생성 및 BUILD 동작은 변경하지 않습니다.

점검 명령: `node scripts/hub-phase25-domain-cutover-check.mjs` → `npm run check`. 라이브 인증 테스트를 대신하지 않습니다.
