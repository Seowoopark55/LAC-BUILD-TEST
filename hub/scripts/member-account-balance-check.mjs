import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const mgmt=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[
  ['version',pkg.version==='1.7.41-web-ui.79'],
  ['member keeps Discord identity',render.includes('<span>이름</span><span>Discord</span><span>역할</span><span>입사일</span><span>상태</span><span>관리</span>')],
  ['member name and role tracks are equal around Discord',mgmt.includes('minmax(0,.90fr) minmax(0,1.10fr) minmax(0,.90fr) minmax(0,.86fr) minmax(0,.72fr) minmax(0,.58fr)')],
  ['account removes Discord display column',render.includes('<span>이름</span><span>역할</span><span>계좌번호</span><span>상태</span><span>관리</span>')&&!render.includes('<span>이름</span><span>Discord</span><span>역할</span><span>계좌번호</span><span>상태</span><span>관리</span>')],
  ['account search copy matches visible data',render.includes('placeholder=\"멤버 · 계좌 검색\"')&&!render.includes('placeholder=\"멤버 · Discord · 계좌 검색\"')],
  ['account five-lane grid',mgmt.includes('minmax(0,.95fr) minmax(0,.78fr) minmax(0,1.38fr) minmax(0,.72fr) minmax(0,.58fr)')],
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`); if(ok)pass++;}
console.log(`MEMBER / ACCOUNT BALANCE: ${pass}/${checks.length} PASS`);
if(pass!==checks.length)process.exit(1);
