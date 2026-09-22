# AXE ONE WEB 3.26.19 — 검증 전용 패키지

제품 CSS/markup/기능/API 코드를 변경하지 않았습니다. 기존 38개 검사도 그대로 보존했습니다.
전체 원본 85개 중 변경 파일은 검증 명령·개발 의존성을 추가한 package.json 하나입니다.
나머지 84개 파일은 product-sha256.json으로 byte 동일성을 검사합니다.

## 실행

기준 환경: Linux x64, Node 24.19.0, Chromium 153.0.8010.0,
Playwright 1.58.2, Pretendard 1.3.9, UTC, ko-KR, DPR 1.

```sh
npm ci
npm run validate:setup
npm run validate:all
```

validate:setup은 테스트용 Chromium을 node_modules/.cache/axe-validation에 풀고,
Pretendard OTF를 사용자 ~/.local/share/fonts/axe-validation에 설치합니다.
Linux의 tar/fontconfig가 필요합니다. 제품 stylesheet는 변경하지 않습니다.
다른 OS에서는 `npx playwright install chromium` 또는 AXE_CHROMIUM_PATH를 사용하되,
브라우저/OS/폰트가 기준 환경과 다르면 visual 비교는 NOT RUN입니다.
Windows 사용 시 같은 Linux 환경에서 비교하거나 OS별 기준선을 별도로 검토해야 합니다.

검사 명령:
- validate:static: 84개 원본 byte 보존, JS 구문, 기존 검사 38개.
- validate:assets: index→entry→CSS imports→static asset 소스 연결.
- validate:negative: 임시 사본에서 CSS/import/image/hashed JS 누락 검출 및 2px 이동 검출.
- validate:build: 실제 npm run build 실행 후 dist reference 검사. 테스트 build는 Supabase 환경변수를 비워 LIVE 연결 방지.
- validate:fixtures: 실제 renderShell 실행. 이 검사는 DOM/CSS 검사가 아닌 renderer 실행 smoke입니다.
- validate:browser: 실제 DOM/CSS/레이아웃/interaction/production smoke/visual/geometry 검사.
- validate:baseline: 현재 화면을 명시적으로 새 기준선으로 기록. 승인 없이 기존 기준선을 갱신하지 마세요.

## PASS / FAIL / NOT RUN 해석

validation-results/*.json에서 개별 상태와 실제 측정값을 확인합니다.
현재 알려진 결함이 있어 validate:all은 **FAIL/exit 1이 정상적인 현 기준 결과**입니다.
이 FAIL을 없애기 위해 테스트를 삭제하거나 제품을 고치지 않았습니다.
- dom-structure: 셀 수, action, computed grid 공유, CSS 적용 등 기본 구조.
- browser: 실제 레이아웃 결함까지 포함. defects 배열을 확인.
- interaction: 실제 이벤트 핸들러 테스트. 모달 입력 보존 실패는 기존 결함.
- visual: 기준선 보존. 기존 화면에 결함이 있어도 이전과 같은지는 별도 PASS가 가능.
- geometry: container/cell rect, computed columns, overflow 등 기준선과 정확 비교.

기준선은 fixture 21종 × desktop/mobile = 42장입니다.
픽셀 정책은 threshold=0, includeAA=true, 전체 이미지당 최대 4개 픽셀 차이만 허용합니다.
환경 복원 전후 한 이미지에서 2개의 고립된 픽셀 차이가 관찰되었습니다.
40×40 사각형을 2px 이동하는 대조 검사는 160개 차이 픽셀을 검출합니다.
모든 실제 differentPixels는 visual.json에 기록하고 차이 이미지를 보존합니다.

## 격리 및 테스트의 경계

server.mjs는 127.0.0.1 임시 포트에서만 실행되는 테스트 서버입니다.
검사용 응답에서만 main.js의 bootstrap을 제거하고 state/render 접근점을 붙입니다.
실제 main.js 파일, 원래 이벤트 핸들러, renderer와 CSS는 수정하지 않습니다.
Supabase/API 모듈은 테스트 응답에서 mock으로 대체하고 외부 네트워크는 차단합니다.
선언하지 않은 mock API 호출은 실패합니다.
실제 저장/DB/권한 검증을 보장하지 않으며, mocked member save의 payload/화면 흐름만 검사합니다.

production smoke는 **실제 dist HTML/JS/CSS**를 로드합니다. fixture 화면은 원본 renderer/CSS를 사용합니다.
production CSS 404 대조 테스트는 별도 browser context에서 요청만 404로 만들며 파일은 건드리지 않습니다.
원래 source의 부팅/auth/polling은 fixture harness에서 실행하지 않습니다.
native OS select의 펼쳐진 popup 유지, 실제 OAuth/RLS/서버 저장, OS IME는 NOT RUN입니다.
Safari/Firefox, LIVE/Vercel/CDN 경로, 사용자의 Windows 폰트 기준선은 미검증입니다.

실제 디자인을 승인한 기준선이 아니라 **현재 3.26.19 fixture 결과를 동결한 비교 기준선**입니다.
기존 38개 분류 및 중복 후보: LEGACY_INVENTORY.md와 legacy-inventory.json.
기존 결함과 최종 결과: STAGE2_REPORT.md.

## 이후 리팩터링 시

product-integrity는 이번 2차에서 제품을 건드리지 않았음을 증명하는 별도 조건입니다.
승인된 리팩터링에서는 제품 변경으로 해당 검사가 실패할 수 있습니다.
원본 manifest를 자동 갱신하지 말고 승인된 변경 목록과 비교하세요.
legacy 문자열 검사는 과거 선언 삭제에도 실패할 수 있으므로 실제 browser/visual 결과와 구분합니다.
새 baseline으로 덮어써서 회귀를 숨기지 말고 diff·geometry·defect 증거를 검토하세요.
