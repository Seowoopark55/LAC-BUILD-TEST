import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const mgmt=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

const checks=[
  ['version',pkg.version==='1.7.41-web-ui.79'],
  ['member table adds useful Discord identity column',render.includes('<span>이름</span><span>Discord</span><span>역할</span><span>입사일</span><span>상태</span><span>관리</span>')&&render.includes('data-label="Discord"')],
  ['asset table surfaces existing memo field',render.includes('<span>보유자</span><span>자산</span><span>취득 방식</span><span>분류</span><span>메모</span><span>상태</span><span>관리</span>')&&render.includes('data-label="메모"')],
  ['account table keeps only account-relevant columns',render.includes('<span>이름</span><span>역할</span><span>계좌번호</span><span>상태</span><span>관리</span>')&&!render.includes('<span>이름</span><span>Discord</span><span>역할</span><span>계좌번호</span><span>상태</span><span>관리</span>')],
  ['asset search includes surfaced memo',render.includes("${a.note||''}")&&render.includes("toLowerCase().includes(q)")],
  ['member name-discord-role centers are balanced',mgmt.includes('minmax(0,.90fr) minmax(0,1.10fr) minmax(0,.90fr) minmax(0,.86fr) minmax(0,.72fr) minmax(0,.58fr)')],
  ['asset columns use balanced fractional distribution',mgmt.includes('minmax(0,.92fr) minmax(0,1.08fr) minmax(0,.96fr) minmax(0,.72fr) minmax(0,1.02fr) minmax(0,.72fr) minmax(0,.58fr)')],
  ['account columns use focused five-lane distribution',mgmt.includes('minmax(0,.95fr) minmax(0,.78fr) minmax(0,1.38fr) minmax(0,.72fr) minmax(0,.58fr)')],
  ['operational rail remains 636px',/main--members \.ops-mgmt-page,[\s\S]*?width:636px/.test(mgmt)&&/main--assets \.ops-mgmt-page,[\s\S]*?width:636px/.test(mgmt)&&/main--accounts \.ops-mgmt-page,[\s\S]*?width:636px/.test(mgmt)],
  ['mobile action lane spans expanded fields',mgmt.includes('grid-row:1 / span 6;align-self:center;justify-content:flex-end')],
];
let passed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`OPS DENSITY BALANCE: ${passed}/${checks.length} PASS`);
if(passed!==checks.length)process.exit(1);
