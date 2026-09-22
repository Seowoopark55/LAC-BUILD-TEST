import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const checks=[
  ['unlimited plan label simplified',render.includes("internal:'무제한'")],
  ['legacy label removed from UI',!render.includes('>기존 계약</option>')],
  ['legacy rows normalize to unlimited',render.includes("row.plan==='legacy'?'internal'" )],
  ['unlimited option exists',render.includes('>무제한</option>')],
  ['desktop content lower',css.includes('.runtime-app .main{padding-top:26px!important}')],
  ['desktop content farther right',css.includes('margin-left:72px!important')],
  ['mid desktop content right shift',css.includes('margin-left:48px!important')],
  ['mid desktop lower shift',css.includes('padding-top:24px!important')],
  ['small desktop restrained shift',css.includes('margin-left:12px!important')],
  ['content offset marker exists',css.includes('CONTENT OFFSET + PLAN CLEANUP R1')],
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Content Offset + Plan Cleanup: ${pass}/${checks.length} PASS`);
if(pass!==checks.length)process.exit(1);
