import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const mgmt=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[
  ['version',pkg.version==='1.7.41-web-ui.79'],
  ['ledger direction redundancy removed',!render.includes("const type=`${kind}${r.direction?` · ${r.direction}`:''}`")&&render.includes('data-label="구분">${esc(kind)}')],
  ['members 636 rail',/main--members \.ops-mgmt-page,[\s\S]*?width:636px/.test(mgmt)],
  ['assets 636 rail',/main--assets \.ops-mgmt-page,[\s\S]*?width:636px/.test(mgmt)],
  ['accounts 636 rail',/main--accounts \.ops-mgmt-page,[\s\S]*?width:636px/.test(mgmt)],
  ['management header/body same center-axis rule',mgmt.includes('.main--members .ops-lane-head>span,')&&mgmt.includes('.main--accounts .ops-lane-row>.ops-lane-cell{')&&mgmt.includes('justify-content:center;')],
  ['management compact rows',/\.main--accounts \.ops-lane-row\{\s*min-height:40px;/.test(mgmt)],
  ['cooking 636 rail',settings.includes('.ops-cooking-settings{width:min(636px,100%)')],
  ['cooking header/body center axes',settings.includes('.ops-cooking-menu-columns>span,.ops-cooking-menu-cell{min-width:0;width:100%;text-align:center}')],
  ['fund weekly 636 rail',/\.main--fund \.axe-fund-subview--weekly,\s*\.main--fund \.axe-fund-subview--review\{width:636px/.test(fund)],
  ['fund review center axes',/\.main--fund \.axe-fund-review-columns>span,\s*\.main--fund \.axe-fund-review-row>\[data-label\]\{/.test(fund)],
  ['platform company keeps 8-column wide rail but centered axes',/\.platform-company-head>span,\s*\.platform-company-row>div\{/.test(mgmt)],
];
let passed=0;
for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(ok)passed++;}
console.log(`OPS TABLE FUND STANDARD: ${passed}/${checks.length} PASS`);
if(passed!==checks.length)process.exit(1);
