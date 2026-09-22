import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const management=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[
  ['web package version',pkg.version==='1.7.41-web-ui.79'],
  ['single-page range footer remains hidden',render.includes('paged.totalPages<=1)return')],
  ['members expose role as a dedicated column',render.includes('<span>이름</span><span>Discord</span><span>역할</span><span>입사일</span><span>상태</span><span>관리</span>')],
  ['assets expose acquisition method as a dedicated column',render.includes('<span>보유자</span><span>자산</span><span>취득 방식</span><span>분류</span><span>메모</span><span>상태</span><span>관리</span>')],
  ['returns use six explicit columns',render.includes('<span>자산</span><span>이전 보유자</span><span>처리</span><span>메모</span><span>확인자</span><span>처리일</span>')],
  ['accounts expose role as a dedicated column without duplicate Discord identity',render.includes('<span>이름</span><span>역할</span><span>계좌번호</span><span>상태</span><span>관리</span>')&&!render.includes('<span>이름</span><span>Discord</span><span>역할</span><span>계좌번호</span><span>상태</span><span>관리</span>')],
  ['member and asset metadata pills are retired',management.includes('.ops-role-badge,.ops-inline-tag{display:none}')],
  ['fund ledger exposes account and type columns',render.includes('<span>날짜</span><span>이름</span><span>계좌</span><span>내역</span><span>구분</span><span>금액</span><span>증빙</span><span>관리</span>')],
  ['fund ledger no longer renders inline metadata pills',!render.includes('axe-fund-ledger-tag is-account')&&!render.includes('axe-fund-ledger-meta')],
  ['fund ledger type does not repeat income or expense direction',!render.includes("const type=`${kind}${r.direction?` · ${r.direction}`:''}`")&&render.includes('data-label="구분">${esc(kind)}')],
  ['fund weekly view exposes role column',render.includes('<span>멤버</span><span>역할</span>${[1,2,3,4,5]')],
  ['fund review uses explicit column header',render.includes('axe-fund-review-columns')&&render.includes('<span>멤버</span><span>납부 주차</span><span>금액</span><span>방식</span><span>상태</span><span>증빙</span><span>처리</span>')],
  ['cooking uses explicit column header',render.includes('ops-cooking-menu-columns')&&render.includes('<span>메뉴</span><span>설명</span><span>가격 / SET</span><span>순서</span><span>상태</span><span>관리</span>')],
  ['cooking order badge is retired',settings.includes('.ops-cooking-order-badge{display:none}')],
  ['platform company data has dedicated columns',render.includes('<span>회사</span><span>Discord</span><span>멤버</span><span>상태</span><span>플랜</span><span>이용 종료</span><span>OWNER</span><span>관리</span>')],
  ['core operational boards follow 636px fund reference rail',/main--members \.ops-mgmt-page,[\s\S]*?width:636px/.test(management)&&/main--assets \.ops-mgmt-page,[\s\S]*?width:636px/.test(management)&&/main--accounts \.ops-mgmt-page,[\s\S]*?width:636px/.test(management)],
  ['mobile operational rows expose labels',management.includes('content:attr(data-label)')&&fund.includes('content:attr(data-label)')&&settings.includes('content:attr(data-label)')],
];
let passed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`Column structure cleanup: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
