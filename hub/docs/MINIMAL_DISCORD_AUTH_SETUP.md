# AXE ONE · Discord 로그인 최소 권한 전환

## 목표
AXE ONE 로그인에서 Discord의 `이메일 주소 보기` 권한을 제거하고, 로그인 식별에 필요한 최소 범위인 `identify`만 요청합니다.

## 확인된 원인
Supabase의 기본 `discord` OAuth provider는 Discord 로그인 scope에 `email`과 `identify`를 기본으로 사용합니다. WEB에서 `scopes: identify`를 전달하는 것만으로 기본 `email` scope를 제거할 수 없습니다.

따라서 Hosted Supabase Auth에 **Custom OAuth2 Provider**를 별도로 만들고, WEB이 그 provider를 사용하도록 전환해야 합니다.

## Custom Provider 기본값
Supabase Dashboard → Auth → Providers → Custom OAuth Providers에서 Manual OAuth2 provider를 생성합니다.

- Identifier 예시: `custom:axe-discord`
- Authorization URL: `https://discord.com/oauth2/authorize`
- Token URL: `https://discord.com/api/oauth2/token`
- UserInfo URL: `https://discord.com/api/users/@me`
- Scope: `identify`
- Email optional: `true`
- Client ID / Client Secret: AXE ONE 로그인용 Discord OAuth application 값

Supabase 화면에 표시되는 Callback URL을 Discord Developer Portal의 Redirect URI에 그대로 등록합니다. Callback URL을 임의로 추측해서 입력하지 않습니다.

## 중요: Discord `id` → Supabase subject 검증
Discord UserInfo는 표준 OIDC의 `sub` 대신 `id` 필드를 반환합니다. Custom OAuth provider가 이 값을 Supabase의 안정적인 사용자 subject로 정상 인식하도록 **Hosted Supabase의 실제 Custom Provider 설정에서 claim/attribute mapping을 구성하고 STAGING에서 검증해야 합니다.**

현재 문서에는 검증되지 않은 mapping JSON을 하드코딩하지 않습니다. 다음을 실제 STAGING 로그인 결과로 확인한 뒤에만 provider를 활성 전환합니다.

1. 동일 Discord 계정으로 재로그인해도 같은 Supabase user id가 유지되는가
2. 다른 Discord 계정이 같은 user로 합쳐지지 않는가
3. Discord numeric user id가 identity의 안정적인 provider subject로 저장되는가
4. 승인창에 `이메일 주소 보기`가 더 이상 표시되지 않는가

## Vercel STAGING 환경변수
Custom provider 검증이 끝난 뒤에만 아래 값을 추가합니다.

`VITE_SUPABASE_DISCORD_AUTH_PROVIDER=custom:axe-discord`

이 값이 없으면 WEB은 기존 `discord` provider를 사용합니다. 서비스는 유지되지만 Discord 승인창의 이메일 권한도 계속 표시됩니다.

## 기존 로그인 사용자 주의
`discord`와 `custom:axe-discord`는 서로 다른 provider namespace입니다. 이미 기본 Discord provider로 로그인한 OWNER가 있는 상태에서 바로 전환하면 새 Supabase auth user가 생길 수 있습니다. 그러면 `company_memberships.user_id`와 기존 OWNER 권한 연결이 끊길 수 있습니다.

따라서 PRODUCT STAGING에서 다음 순서로 전환합니다.

1. Custom provider 생성
2. 테스트 Discord 계정으로 최소권한 로그인 검증
3. OWNER 계정 전환 전 현재 auth user id / membership user_id 기록
4. OWNER로 Custom provider 로그인 테스트
5. user id가 달라졌다면 실제 DB 상태를 보고 identity linking 또는 membership 이관 방식을 결정
6. 검증 완료 후 Vercel 환경변수를 Custom provider로 전환

추측으로 `company_memberships.user_id`를 UPDATE하지 않습니다.

## 개인정보 최소화 원칙
목표 수집 정보:

- Discord User ID
- 사용자명 / 표시명
- 아바타

AXE ONE 운영에 필요하지 않은 이메일, 전화번호, 친구 목록, DM 등은 요청하지 않습니다.
