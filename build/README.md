# LAC BUILD · 브랜드 전환 1차

기존 BUILD(1).zip의 프로젝트를 기준으로 작업한 **브랜드 전환 전체본**입니다.

- AXE 로고/인원 모집 UI를 제거하고 LAC HUB의 실제 심볼로 교체했습니다.
- 기존 회사·사용자·추천세팅·개조서·댓글·투표·닉네임 신청·의류 이미지 및 DB 테이블/SQL은 수정하지 않았습니다.
- 기존 공개 조회 및 독립 Discord 로그인 정책도 아직 변경하지 않았습니다.
- HUB 통합 인증·이용권 연동 점검이 끝날 때까지 BUILD 화면의 **HUB 메인 이동 링크와 홍보 패널을 임시 제거**했습니다. BUILD의 내부 `홈`/빠른 메뉴는 그대로 이용할 수 있습니다.
- BUILD의 기존 관리 권한(public.profiles.is_admin)과 HUB 최고관리자(axe_product.platform_is_admin)는 별개입니다. 운영 DB 권한을 점검·합의한 뒤 통합해야 합니다.
- 사용자 데이터에 저장된 과거 회사명/작성자 AXE는 그대로 노출될 수 있습니다. 기존 사용자 작성 이력을 일괄 변경하지 않습니다.
- 기존 AXE 팀복 4장과 무기·장비 세팅은 그대로 유지합니다.

## 안전한 적용

기존 BUILD GitHub 프로젝트 폴더에 **이 전체본을 복사/덮어쓰기**하세요. 구버전의 비사용 AXE 이미지 파일은 덮어쓰기만으로 자동 삭제되지 않을 수 있지만, 새 코드에서는 참조하지 않습니다. 서버의 기존 .env.local 및 Vercel 환경변수는 보존하세요. 이 ZIP에는 비밀 정보가 들어 있는 .env.local을 포함하지 않았습니다.

현재의 BUILD 웹사이트 주소와 HUB 프로젝트의 VITE_SUPABASE_URL / anon key가 같은 프로젝트인지, 배포 두 사이트에 Discord 로그인했을 때 auth.uid()가 일치하는지를 확인해야 합니다. 확인 전까지 통합 로그인·이용권 차단을 적용하지 않습니다.

## 설정

현재 BUILD 화면에서는 `VITE_LAC_HUB_URL`을 사용하지 않습니다. 빌드할 때 기존 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY 또는 VITE_SUPABASE_ANON_KEY를 그대로 사용하세요.

## 업데이트 내역 문서 보관

기존 최상위 `UPDATE-V*.txt` 파일 38개를 **`docs/updates/`** 폴더에 내용 변경 없이 보관했습니다. 프로그램 실행에 필요한 소스·환경설정·SQL 경로는 변경하지 않았습니다.

**기존 BUILD 폴더에 ZIP을 복사·덮어쓰기만 하면 오래된 최상위 TXT는 자동 삭제되지 않습니다.** 전체본 복사를 끝낸 뒤 BUILD 프로젝트 최상위에서 아래 명령을 한 번 실행하면, `docs/updates/`에 내용이 동일하게 보존된 파일만 정리됩니다. 내용이 다른 파일은 삭제하지 않습니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\organize-existing-root.ps1
```

기존 `.env.local`과 이용자 데이터·의류 이미지는 삭제하거나 이동하지 마세요. 이 정리 작업을 위해 SQL을 다시 실행할 필요는 없습니다.

## 임시 운영 조정 · HUB 이동 숨김

- BUILD 우측 플로팅 패널의 `HUB 메인으로` 링크와 관련 소개 패널을 제거했습니다. (기존 사내 BUILD의 `홈`은 유지)
- 외부에서 HUB URL을 직접 입력한 사용자의 접근까지 막는 서버 차단은 아닙니다. HUB 인증/이용권 정책 검증 후 BUILD 측 진입 링크를 재개할 수 있습니다.
- 이번 수정에서 SQL/DB, 회원 권한, 의류 및 데이터 파일은 변경하지 않았습니다. SQL 문서 폴더 정리는 후속 전용 패치에서 실행 경로와 참조를 점검한 뒤 진행합니다.
