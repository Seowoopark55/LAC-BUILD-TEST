# LAC HUB + LAC BUILD 통합 운영 적용 후보본 — 먼저 읽기

**중요: 아직 운영 HUB에 적용하지 마세요.** 이 파일은 사용자 제공 최신 HUB (`hub.zip`) 및 BUILD (`build(2).zip`) 원본과 검증된 테스트 경로 패치를 결합한 **운영 적용 후보본**입니다. 업로드/Push하면 현 HUB가 곧바로 자동 배포될 수 있으므로 적용 전 사전 검증과 최종 승인이 필요합니다. 기존 독립 BUILD 사이트는 그대로 유지됩니다.

## 저장소 최상위 구조

`hub/`, `build/`, `api/`, `server/`, `scripts/`, `package.json`, `vercel.json`을 최상위에 둡니다. `build/` 안 파일만 업로드하거나 `hub/`만 업로드하면 작동하지 않습니다. 기존 운영 HUB 저장소에 적용할 시 기존 `.git` 폴더는 삭제하지 마세요. 운영 BUILD 저장소에는 적용하지 않습니다.

## 변경 범위

- HUB의 BUILD 카드만 새 탭 외부 링크에서 같은 탭 `/build/`로 전환하고 안내 문구 수정.
- BUILD 경로 `/build/`, `/build/builds`, `/build/notices`, `/build/presets`, `/build/modbooks`, `/build/weapons`, `/build/reports`, `/build/admin`; 해당 경로에 필요한 정적 라우팅·이미지 경로 분리.
- BUILD Discord 로그인 복귀 주소를 현재 접속 도메인의 `/build/`로 변경하여 HUB와 세션 공유.
- 루트의 Vercel 빌드가 HUB와 BUILD를 각각 빌드한 뒤 `hub/dist/build/`로 합침. 서버리스 `api/` 및 `server/`는 최신 HUB 소스와 동일하게 루트에 복제.
- DB 스키마, 마이그레이션, 등록 데이터, 기존 독립 BUILD 배포는 변경하지 않음. 사용자 원본의 HUB 검증 자료와 기존 BUILD 콘텐츠·의류 자산을 유지.

## 환경변수 (코드 저장소/ZIP에 실제 값 금지)

- 새 통합 Vercel 프로젝트(또는 기존 HUB 프로젝트)의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`는 기존 운영 HUB와 동일한 값이어야 함. root에서 Vite가 hub/build에 같은 값을 주입함.
- Discord 회사/봇 설정용 서버 변수는 **운영 HUB 기존 값 유지**. 예: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_OAUTH_STATE_SECRET`, `DISCORD_BOT_TOKEN`. 새 도메인으로 바뀌지 않으므로 운영 Discord/Supabase 리디렉션 주소는 수정하지 않음.
- 기존 독립 BUILD의 `VITE_SITE_URL`이 기존 BUILD 주소여도, 통합본의 BUILD 로그인은 현 도메인 `/build/`를 사용함. 운영 독립 BUILD 프로젝트에는 변경하지 않음.
- `.env.local` 파일은 사용자 제공 BUILD ZIP에 있었으나 **이 후보본에서 제외**. GitHub에 올리거나 공유하지 말 것.

## 검증·전환 원칙

- `npm install` → `npm run check` → `npm run build`로 소스 검사·생성물 검증을 하고, 테스트 프로젝트에서 동일 소스에 대해 HUB 로그인·BUILD 이동·계정 공유·공개 읽기·상세 이미지·권한과 회사 관리/API 회귀 검증 후 운영에 반영.
- 운영 배포 후 새 HUB 주소의 로그인, 회사 관리, 봇 연결 상태, BUILD 경로 및 기존 독립 BUILD 링크를 확인. 문제가 있으면 GitHub 이전 커밋으로 롤백하고 Vercel 배포 기록을 확인.
- 운영 데이터를 사용하는 테스트에서는 회사/게시글을 생성·수정·삭제하거나 디스코드 봇을 재연결하지 말 것.
