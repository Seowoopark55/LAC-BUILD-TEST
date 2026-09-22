import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const mgmt=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const checks=[
  ['settings-scale workspace',mgmt.includes('.ops-mgmt-workspace{width:min(680px,100%)')],
  ['single compact board contract',mgmt.includes('.ops-mgmt-board{width:min(680px,100%)')],
  ['member fixed lanes',render.includes('ops-lane-head--member')&&render.includes('ops-lane-row--member')&&mgmt.includes('.ops-lane-head--member,.ops-lane-row--member')],
  ['asset fixed lanes',render.includes('ops-lane-head--asset')&&render.includes('ops-lane-row--asset')&&mgmt.includes('.ops-lane-head--asset,.ops-lane-row--asset')],
  ['account fixed lanes',render.includes('ops-lane-head--account')&&render.includes('ops-lane-row--account')&&mgmt.includes('.ops-lane-head--account,.ops-lane-row--account')],
  ['returns fixed lanes',render.includes('ops-lane-head--return')&&render.includes('ops-lane-row--return')],
  ['no semantic management tables',!render.includes('ops-data-table')&&!render.includes('ops-member-table')&&!render.includes('ops-asset-table')&&!render.includes('ops-account-table')],
  ['fund dense lane board',render.includes('axe-fund-ledger-columns')&&render.includes('axe-fund-ledger-row')&&fund.includes('.axe-fund-ledger-row{')],
  ['fund no semantic table dependency',!render.includes('axe-fund-table')],
  ['company settings untouched',fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8').includes('.ops-settings-module{min-height:56px;display:grid;grid-template-columns:190px 330px 68px')],
  ['desktop row density 54px',mgmt.includes('.ops-lane-row{min-height:54px')],
  ['standard font weights',!mgmt.includes('font-weight:780')&&!mgmt.includes('font-weight:880')&&!mgmt.includes('font-weight:860')],
];
let fail=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++;}
if(fail){console.error(`dense operations system check: ${checks.length-fail}/${checks.length} PASS`);process.exit(1)}
console.log(`dense operations system check: ${checks.length}/${checks.length} PASS`);
