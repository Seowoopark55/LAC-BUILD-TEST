import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const checks=[
  ['Korean plan labels', render.includes("trial:'7일 체험'") && render.includes("standard:'30일 이용'") && render.includes("pro:'90일 이용'")],
  ['subscription modal Korean plans', render.includes('>7일 체험</option>') && render.includes('>30일 이용</option>') && render.includes('>90일 이용</option>')],
  ['platform admin hidden-company filter', main.includes('applyPlatformCompanyVisibility') && main.includes("['paused','expired'].includes")],
  ['platform refresh rehydrates companies', main.includes("action==='refresh-platform'") && main.includes('await loadCompanies();state.platformSnapshot=await getPlatformCompanies()')],
  ['platform save reapplies visibility', main.includes("type==='platform-subscription'") && main.includes('const changed=applyPlatformCompanyVisibility()')],
  ['header brand centered', css.includes('left:50%') && css.includes('transform:translate(-50%,-50%)')],
  ['account pushed right', css.includes('margin-left:auto!important') && css.includes('width:auto!important')],
  ['operational content shifted right', css.includes('margin-left:32px!important') && css.includes('.main>.axe-fund')],
  ['medium desktop shift reduced', css.includes('margin-left:16px!important')],
  ['small desktop fallback', css.includes('max-width:980px') && css.includes('margin-left:0!important')],
];
let pass=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${name}`);if(ok)pass++;}
console.log(`Platform Shell Balance: ${pass}/${checks.length} PASS`);
if(pass!==checks.length)process.exit(1);
