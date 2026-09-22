# 기존 검사 38개 분류

모든 기존 검사는 string/regex입니다. 아래 “확인 대상”은 소스 코드의 존재/배치만 의미하며 실제 동작 보장이 아닙니다. syntax·structural(실제 DOM)·build·browser·visual·interaction 검사는 기존 38개에 없습니다. source-check의 asset 범위도 일부 API route 파일 존재 확인뿐입니다.

| 파일 | 분류 | 소스에서 확인하는 대상 |
|---|---|---|
| scripts/account-lookup-owner-shell-check.mjs | string/regex | home banner no dashboard tooltip; service management removed from sidebar; platform still hard gated; platform menu owner only |
| scripts/axe-one-brand-check.mjs | string/regex | 금지 문자열·설정 및 코드 참조 |
| scripts/company-delete-platform-scale-check.mjs | string/regex | platform delete RPC API; platform-only delete gate; exact name confirmation; irreversible warning |
| scripts/content-fit-density-check.mjs | string/regex | fund ledger uses compact 636px reference rail; members use 636px FUND reference rail; assets use 636px FUND reference rail; accounts use 636px FUND reference rail |
| scripts/content-offset-plan-check.mjs | string/regex | unlimited plan label simplified; legacy label removed from UI; legacy rows normalize to unlimited; unlimited option exists |
| scripts/dashboard-copy-cleanup-check.mjs | string/regex | web package version; dashboard metrics have label and value only; metric markup no helper small; all-clear duplicate helper removed |
| scripts/dashboard-operations-check.mjs | string/regex | current web package version; dashboard is a valid route; dashboard; dashboard is default route |
| scripts/dashboard-readability-check.mjs | string/regex | current web package version; dashboard hero description is readable; dashboard refresh is at least 10px; metric labels increased |
| scripts/dense-ops-system-check.mjs | string/regex | settings-scale workspace; single compact board contract; member fixed lanes; asset fixed lanes |
| scripts/discord-permission-reapproval-check.mjs | string/regex | reapproval endpoint exists; reapproval accepts canonical UUID company ids; reapproval uses shared least-privilege baseline; reapproval locks connected guild |
| scripts/discord-upfront-permissions-check.mjs | string/regex | baseline permission bitfield is defined; administrator permission is explicitly excluded; initial Discord connect uses baseline permissions; reapproval restores the same baseline permissions |
| scripts/first-run-onboarding-check.mjs | string/regex | current package version; first-run explains unresolved membership instead of assuming brand-new user; first-run exposes new company registration path; first-run exposes member registration wait path |
| scripts/fund-ledger-alignment-check.mjs | string/regex | web package version; ledger keeps eight semantic columns; ledger header and row share one compact eight-column grid; fund ledger returns to 636px reference rail |
| scripts/fund-ledger-axis-specificity-check.mjs | string/regex | 636px reference rail preserved; header and row keep one identical 8-column grid; specificity-safe header centering selector exists; row data cells centered in same final block |
| scripts/generated-ambient-shell-check.mjs | string/regex | marker exists; generated image used; cover background used; central app width preserved |
| scripts/guided-setup-typography-check.mjs | string/regex | marker exists; hero title enlarged; body copy enlarged; rail labels enlarged |
| scripts/integrated-ui-check.mjs | string/regex | axe_product schema lock; No browser BOT runtime RPC usage; No raw fund ledger browser write; No raw company asset browser write |
| scripts/interface-copy-cleanup-check.mjs | string/regex | web package version; compact page header supported; operational page header descriptions removed; management summary helper lines removed |
| scripts/list-visual-cleanup-check.mjs | string/regex | web package version; single-page range footer remains hidden; members expose role as a dedicated column; assets expose acquisition method as a dedicated column |
| scripts/live-guided-setup-check.mjs | string/regex | 금지 문자열·설정 및 코드 참조 |
| scripts/member-account-balance-check.mjs | string/regex | version; member keeps Discord identity; member name and role tracks are equal around Discord; account removes Discord display column |
| scripts/member-identity-ux-check.mjs | string/regex | 금지 문자열·설정 및 코드 참조 |
| scripts/modbook-channel-guided-check.mjs | string/regex | channel_id; modbook |
| scripts/onboarding-catalog-check.mjs | string/regex | 금지 문자열·설정 및 코드 참조 |
| scripts/onboarding-flow-integrity-check.mjs | string/regex | 3.26.3 web package version; company slug remains internal and automatic; company create keeps a stable pending attempt; company create retries recover by the same slug before another insert |
| scripts/operations-row-actions-check.mjs | string/regex | member header/value axes centered; asset header/value axes centered; account header/value axes centered; fund linked entries have active edit control |
| scripts/operations-ux-check.mjs | string/regex | 금지 문자열·설정 및 코드 참조 |
| scripts/ops-density-balance-check.mjs | string/regex | version; member table adds useful Discord identity column; asset table surfaces existing memo field; account table keeps only account-relevant columns |
| scripts/ops-table-fund-standard-check.mjs | string/regex | version; ledger direction redundancy removed; members 636 rail; assets 636 rail |
| scripts/pinball-module-check.mjs | string/regex | module UI; module order; guided quick channel; guided direct channel |
| scripts/platform-shell-balance-check.mjs | string/regex | Korean plan labels; subscription modal Korean plans; platform admin hidden-company filter; platform refresh rehydrates companies |
| scripts/platform-subscription-evidence-check.mjs | string/regex | platform admin RPC exists; platform owner entry is account-menu only; subscription management modal exists; subscription update wired |
| scripts/questions-board-check.mjs | string/regex | questions page is a first-class route; support nav uses question board; legacy usage guide launcher removed; question board is available to active members |
| scripts/scale-safe-lists-check.mjs | string/regex | shared page-size contract; shared pager renderer; fund ledger bounded; members bounded |
| scripts/session-auth-privacy-check.mjs | string/regex | 금지 문자열·설정 및 코드 참조 |
| scripts/source-check.mjs | string/regex + 제한적 파일 존재(asset) | NEW AXE NET schema reference; AXE HUB public profile query; AXE HUB public builds query; server master key reference |
| scripts/suggestions-board-check.mjs | string/regex | suggestions route is valid and sidebar nav exists; legacy feedback modal/contact UI removed; customer list is author-scoped in SQL; detail blocks same-company non-author |
| scripts/test-center-check.mjs | string/regex | web package version; platform account menu has test center; test center is platform owner only; test center state exists |

## 중복 정리 후보 — 삭제하지 않음

- fund-ledger-alignment / fund-ledger-axis-specificity / ops-table-fund-standard: 공금 column·정렬·폭 검사 중첩.
- content-fit-density / dense-ops-system / ops-density-balance / member-account-balance: 운영 테이블 폭·column·밀도 중첩.
- integrated-ui / onboarding-catalog / live-guided-setup / onboarding-flow-integrity / first-run-onboarding: 초기설정 코드 연결 확인 중첩.
- 여러 파일의 package.version 정확 일치 검사 반복.
- 과거 54px·680px 문자열의 존속을 요구하는 검사와 최신 40px·636px 확인이 병존. 외형 불변 정리 시에도 기존 검사가 실패할 수 있음.

전체 assertion 이름은 legacy-inventory.json, 실제 38개 실행 출력은 validation-results/legacy.json에 기록.
