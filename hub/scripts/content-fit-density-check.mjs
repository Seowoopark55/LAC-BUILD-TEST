import fs from 'node:fs';

const management=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../src/styles/layout.css',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8');

const checks=[
  ['fund ledger uses compact 636px reference rail', fund, /main--fund \.axe-fund-ledger\{[\s\S]*?width:636px/],
  ['members use 636px FUND reference rail', management, /main--members \.ops-mgmt-page,[\s\S]*?width:636px/],
  ['assets use 636px FUND reference rail', management, /main--assets \.ops-mgmt-page,[\s\S]*?width:636px/],
  ['accounts use 636px FUND reference rail', management, /main--accounts \.ops-mgmt-page,[\s\S]*?width:636px/],
  ['member lanes include role column', management, /grid-template-columns:minmax\(0,\.90fr\) minmax\(0,1\.10fr\) minmax\(0,\.90fr\) minmax\(0,\.86fr\) minmax\(0,\.72fr\) minmax\(0,\.58fr\)/],
  ['asset lanes include acquisition column', management, /grid-template-columns:minmax\(0,\.92fr\) minmax\(0,1\.08fr\) minmax\(0,\.96fr\) minmax\(0,\.72fr\) minmax\(0,1\.02fr\) minmax\(0,\.72fr\) minmax\(0,\.58fr\)/],
  ['account lanes include role column', management, /grid-template-columns:minmax\(0,\.95fr\) minmax\(0,\.78fr\) minmax\(0,1\.38fr\) minmax\(0,\.72fr\) minmax\(0,\.58fr\)/],
  ['cooking uses explicit six-column lane', settings, /grid-template-columns:minmax\(105px,1fr\) minmax\(125px,1\.15fr\) 78px 46px 68px 52px/],
  ['platform company table uses explicit eight-column lane', management, /grid-template-columns:110px 115px 44px 64px 82px 122px 94px 54px/],
  ['header identity is aligned inside content rail', layout, /\.global-account\{[\s\S]*?justify-self:start;[\s\S]*?justify-content:flex-end/],
  ['settings identity uses settings rail', layout, /runtime-app--settings \.global-account\{width:680px\}/],
  ['runtime app carries current page class', render, /runtime-app runtime-app--\$\{esc\(state\.page\|\|'fund'\)\}/],
  ['settings uses compact 680px left rail', settings, /main--settings \.ops-settings-page\{[\s\S]*?width:680px;[\s\S]*?margin-left:0/],
  ['fund subviews are left anchored', fund, /main--fund \.axe-fund-subview,[\s\S]*?margin-left:0;[\s\S]*?margin-right:auto/],
  ['mobile keeps full width fallback', management, /@media\(max-width:760px\)[\s\S]*?\.ops-mgmt-workspace,\.ops-mgmt-board,\.ops-mgmt-tabs-row,\.ops-account-review\{width:100%\}/],
];

let passed=0;
for(const [name,source,re] of checks){
  const ok=re.test(source);
  console.log(`${ok?'PASS':'FAIL'} - ${name}`);
  if(ok) passed++;
}
console.log(`Content-fit density: ${passed}/${checks.length} PASS`);
if(passed!==checks.length) process.exit(1);
