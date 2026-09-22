# LAC HUB + BUILD: GitHub/Vercel 테스트 프로젝트 전용 전체본

> **LAC-BUILD-TEST 저장소 전용 · 운영 HUB / BUILD 저장소에 적용 금지.** 이 ZIP은 먼저 실제 Vercel 빌드/로그인을 검증하기 위한 시범 배포 소스이며, 운영 적용본이 아닙니다.

## ZIP 내용과 배포 구조
- 저장소 최상위의 `package.json`, `vercel.json`, `api/`, `server/`, `scripts/`, `hub/`, `build/`를 **그대로** 새 테스트 저장소의 최상위에 둡니다. ZIP 안의 상위 폴더 자체를 한 겹 더 넣지 마세요.
- Vercel은 저장소 루트에서 `npm install` 후 `npm run build`로 HUB와 BUILD를 각각 빌드하고 최종 정적 결과를 `hub/dist/`로 통합합니다. `api/`와 `server/`는 HUB의 서버리스 API 원본을 테스트용 루트에 복제한 것입니다.
- HUB는 `/`, BUILD는 `/build/`, BUILD 자산은 `/build/assets/`입니다. **운영 주소와 운영 저장소는 변경하지 않습니다.**
- `npm run check`: 파일·라우팅·배포 구조의 정적 점검. 브라우저와 실제 OAuth, Vercel 설치/빌드는 아직 확인하지 못했습니다.

## 배포 전 반드시 구분할 것
1. 이 ZIP에는 운영 비밀값이나 `.env`가 없습니다. Vercel의 새 **테스트 프로젝트** 환경변수에 운영 HUB와 동일 Supabase 프로젝트의 공개 URL/키를 입력해야 합니다: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. 공개 저장소에 **서비스 역할 키, Discord 비밀값, `.env` 파일을 올리지 마세요.**
2. Supabase 인증 테스트 전에는 새 Vercel 테스트 도메인 `https://<실제-테스트-도메인>/**`을 Supabase Authentication → URL Configuration → Redirect URLs에 **추가**해야 합니다. 운영 HUB와 BUILD의 기존 허용 주소는 삭제하지 마세요. 테스트 도메인 확정 전에 임의의 주소를 등록하지 마세요.
3. Discord **서버 봇 연결을 테스트할 경우에만** 테스트 Vercel 프로젝트의 서버 전용 `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_OAUTH_STATE_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_REDIRECT_URI=https://<실제-테스트-도메인>/api/discord/callback`, `LAC_HUB_APP_URL=https://<실제-테스트-도메인>`를 별도로 설정하고, 같은 테스트 콜백을 정확히 해당 Discord 애플리케이션의 OAuth2 Redirects에 **추가**해야 합니다. 운영 공식 콜백은 유지하세요. 이 구성을 하기 전에는 테스트 사이트에서 Discord 서버 연결/재승인 버튼을 누르지 마세요.
4. **테스트 배포는 운영 DB와 분리되지 않았습니다.** 운영 Supabase 값을 넣으면 계정/회사/BUILD 데이터는 실제 운영 데이터와 연결됩니다. 테스트 중 회사 생성·삭제, 관리자/역할 변경, 채널 재설정, BUILD 데이터 저장/삭제 등 변경 동작은 하지 말고 먼저 화면 열람·이동·로그인만 확인하세요.
5. 운영 HUB와 BUILD 양쪽 로그인은 같은 Supabase 프로젝트 및 같은 테스트 도메인에서 자동으로 세션을 공유할 수 있게 설계했지만, 실제 브라우저 재로그인·새로고침·로그아웃은 테스트 후에만 확인할 수 있습니다.

## 순서
(1) 새 `LAC-BUILD-TEST` 저장소에만 전체본 업로드 → (2) 새 Vercel 프로젝트에 저장소 연결 → (3) TEST 빌드 상태/테스트 도메인 확인 → (4) Supabase 테스트 도메인 추가 → (5) 로그인 및 HUB→BUILD 경로·에셋·세션 확인 → (6) 이상 없다면 운영 적용본을 별도로 준비.
