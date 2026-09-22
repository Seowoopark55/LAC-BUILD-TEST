# AXE ONE WEB 3.26.19 — 2차 검증 기반 구축 결과

## A. 추가/수정한 검증 파일

수정한 원본 파일은 package.json 하나(검증 scripts/devDependencies)입니다. 기존 build/check 명령과 production dependencies 선언은 유지했습니다.
원본의 나머지 84개 파일은 SHA-256 동일합니다. src 전체, index.html, public, API/server/DB 파일은 변경하지 않았습니다.

추가: package-lock.json, scripts/validation/{common,static,assets,build,server,dom,browser,negative-controls,run,setup-linux}.mjs.
추가: tests/validation/fixtures.mjs, product-sha256.json, legacy-inventory.json, LEGACY_INVENTORY.md, README.md, 이 보고서.
기준선: tests/validation/baselines/의 42개 PNG, environment.json, provenance.json, geometry.json.
실행 증거: validation-results/의 JSON, logs, screenshot·defect 이미지 및 실제 renderer HTML.

## B. 실제 실행한 검사

| 검사 | 상태 | 의미 |
|---|---|---|
| 원본 파일 보존 | PASS | package.json 제외 84개 byte 동일 |
| JS syntax | PASS | 제품 JS와 검사 JS 구문 검사 |
| 기존 38개 script | PASS | 38개 모두 실행; 삭제/수정 없음 |
| source asset chain | PASS | entry→CSS imports→이미지 포함 21개 조건 |
| production build + dist chain | PASS | 실제 vite build 및 산출물 연결 9개 조건 |
| 고장 주입 대조 검사 | PASS | 8개 조건: 파일 누락·2px 차이 검출 |
| 실제 renderer fixture | PASS | 21가지 상태에서 원본 renderShell 실행 |
| 실제 DOM/CSS 구조 | PASS | 360개 기본 구조 조건 |
| 브라우저 레이아웃 | FAIL | 기존 모바일 주간/중간 폭 버튼 clipping 재현 |
| interaction | FAIL | 6개 중 5개 PASS, 작성 중 모달 메모 보존 FAIL |
| visual baseline 비교 | PASS | 42/42, 기존 screenshot 기준과 비교 |
| geometry baseline 비교 | PASS | 92개 화면/폭 측정 결과 동일 |
| 실제 OAuth/DB/권한/서버 저장 | NOT RUN | 외부 접근 금지, fixture/mock 한정 |
| native OS select 펼침 상태·IME | NOT RUN | 값 보존은 검사했으나 popup/OS 입력기는 별도 |

전체 suite는 기존 결함 때문에 FAIL/exit 1입니다. 실행 실패나 미실행을 PASS로 바꾸지 않았습니다.

## C. Production build 결과

명령: npm run build (기존 명령 유지). Vite 7.3.6, Node 24.19.0에서 성공.
처음에는 Vite가 없어 실행 불가였으나, 의존성 설치 후 실제 production build를 재실행했습니다.
dist/index.html, assets/index-C1aTnaHS.css, assets/index-C2SdUFTG.js 생성.
최종 authoritative 산출물 목록은 validation-results/build.json과 production-build.log 참조.
테스트 build는 Supabase 환경변수를 비워 외부 연결 없이 실행했습니다. LIVE 인증 통합 검증이 아닙니다.
새 lockfile은 이번 설치 버전을 고정합니다. 기존 ZIP에는 lockfile이 없어 현재 LIVE 배포와 의존성이 동일하다고 보장하지 않습니다.

## D. Asset chain 결과

소스: index.html→src/main.js→src/styles.css→11개 stylesheet→이미지 연결을 재귀 검사.
출력: dist HTML의 JS/CSS 경로, 참조 파일 존재, CSS 생성, /src/main.js 잔존 여부 확인.
원본은 루트 경로 배포 기준입니다. 하위 디렉터리 base 및 실제 Vercel/CDN은 미검증입니다.
Chromium에서 실제 dist를 로드해 JS 부팅 화면 전환, CSSOM rule 접근 및 오류 응답 부재 확인.
별도 격리 context에서 CSS 요청만 404로 만들어 누락이 검출됨을 확인했습니다.
임시 사본에서 root CSS, imported CSS, 이미지, hashed JS/CSS 누락도 검출했습니다.
현재 CSS에는 외부 폰트 파일 참조가 없으며 폰트는 테스트 OS 환경에 설치했습니다.

## E. Browser rendering 결과

실제 Chromium 153.0.8010.0 + Playwright 1.58.2, Linux x64에서 실행.
Dashboard, 공금 원장/주간/검수, 멤버, 자산/반납, 계좌, 요리, 설정 기본/모듈,
Service Management, 멤버 모달, 질문/건의 빈 화면 및 주요 테이블 empty state를 검사했습니다.

Desktop 1440×1000, mobile 390×844에 더해
560/561/760/761/900/901/980/981/1280/1281px에서 공금·주간·멤버·요리·플랫폼을 검사했습니다.
중간 폭 검사는 높이 900px로 낮은 화면용 media query도 적용됩니다.
header/row 셀 수, action 존재, computed grid 모델, 좌표, container 폭, 문서 overflow,
숨김 조상에 의한 버튼 잘림, 모달 표시를 측정했습니다.
문서 scrollWidth만으로는 overflow:hidden으로 잘린 버튼을 발견할 수 없어 두 조건을 별도로 검사합니다.

fixture 화면은 production renderer/CSS와 원래 이벤트 핸들러를 사용합니다.
테스트 응답에서 bootstrap과 외부 API 모듈만 격리합니다. production 파일을 수정하지 않았습니다.
정상 동작 API 통합 검증으로 확대 해석하지 마세요.

## F. Screenshot baseline

21개 fixture × desktop/mobile = 42장 생성 및 재실행 비교 완료.
이전 실행과 재개 후 비교에서 한 이미지의 고립된 2픽셀 차이만 관찰됐습니다.
전체 이미지당 최대 4픽셀, 색상 threshold=0, includeAA=true의 명시적인 잡음 한도를 적용했습니다.
2px 이동 대조 테스트는 160픽셀 차이를 검출하므로 UI 위치 이동을 통과시키는 2px 위치 허용오차가 아닙니다.
스크린샷 자동 갱신은 없고, validate:baseline을 명시적으로 실행해야 합니다.
원본 제품 hash, fixture 환경, browser/폰트/viewport는 기준선 metadata에 기록했습니다.

이 기준선은 3.26.19를 동일 환경에서 비교하기 위한 fixture 기준선입니다.
LIVE의 실제 데이터·Windows 폰트와 픽셀 단위로 같다는 인증은 아닙니다.

## G. 발견된 기존 결함 — 제품 수정 없음

### DEF-01 모바일 주간 납부 현황 7셀/6열

390/560/561/760px에서 재현. header와 body 모두 7개 셀인데 computed grid는 6열입니다.
5주 header와 해당 셀이 두 번째 행으로 넘어갑니다.
증거: baselines/mobile-weekly.png 및 browser.json의 weekly-mobile-seven-cells-six-tracks.
이전 정적 감사의 추정을 실제 브라우저로 확인했습니다.

### DEF-02 중간 화면 폭에서 관리 버튼 및 일부 콘텐츠 잘림

761/900/901/980/981/1281px의 일부 화면에서 재현. 총 13개 화면/폭 조합.
공금, 요리, 서비스 관리와 981px 멤버 화면이 포함됩니다(정확한 목록은 browser.json).
981px 공금 화면에서는 오른쪽 관리 column과 등록 버튼 일부가 잘립니다.
문서 수평 스크롤은 없어도 overflow:hidden 조상 밖으로 버튼이 나가 있습니다.
증거: validation-results/screenshots/defect-*.png 및 clipping 좌표.

### DEF-03 알림으로 전체 rerender 시 작성 중 멤버 메모 소실

멤버 상세 열기→메모 입력→원래 setNotice 호출→renderShell 전체 교체로 재현.
모달은 열려 있으나 작성 중 메모가 원래 state 값으로 돌아갑니다.
모든 일상 경로에서 반드시 발생한다는 주장은 아니며, 해당 trigger에 대한 재현입니다.
증거: interaction.json의 before/after, modal-note-before.png / modal-note-after.png.

정상 확인: 검색 focus/cursor, 역할 필터+페이지 이동, 계정 dropdown 열고 닫기,
select 선택값 재렌더 후 유지, mock을 통한 멤버 메모 저장 payload 및 모달 종료(5개 PASS).
mock 저장은 실제 DB 저장 성공을 의미하지 않습니다.

## H. 아직 검증하지 못한 영역

실제 사용자 데이터/권한 조합, OAuth, RLS, DB/RPC, 서버 저장, LIVE/CDN은 NOT RUN.
Safari/Firefox, Windows/macOS별 font rasterization, native select popup 유지, OS 한글 IME는 미검증.
모든 모달/희귀 상태를 포괄하지 않았습니다. modal 기준선은 멤버 모달 중심입니다.
부팅/auth/polling을 그대로 실행하는 전체 E2E 대신 격리된 fixture entry를 사용했습니다.
production smoke는 환경변수 미설정 상태의 부팅과 실제 asset load 범위입니다.

## I. 실제 코드 정리 착수 판단

좁은 범위의 정리는 승인 후 시작할 수 있는 검증 기반을 확보했습니다.
다만 전체 무결함 판정은 아니며, 현재 FAIL 3종을 별도 결함으로 유지해야 합니다.
미사용 함수 또는 중복 미리보기 renderer처럼 작은 단위부터 시작하고,
visual/geometry 변화와 새로운 defect 여부를 확인하는 방식이 적절합니다.
전역 CSS/import 순서/전체 rerender 구조를 동시에 바꾸는 작업은 여전히 권하지 않습니다.
기존 버그 수정은 리팩터링과 별도 승인을 받아 분리해야 합니다.

이번 단계는 검증 기반 구축까지만 완료했으며, 제품 코드 정리는 실행하지 않았습니다.
