import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../src/styles/layout.css',import.meta.url),'utf8');
const checks=[
 ['home banner no dashboard tooltip', !render.includes('title="대시보드로 이동"') && !render.includes('global-home-zone__hint')],
 ['service management removed from sidebar', !render.includes('<span class="sidebar-nav__label spaced">플랫폼</span>')],
 ['platform still hard gated', render.includes("state.page === 'platform') return state.platformAdmin ? renderPlatform(state) : renderPermission(state)")],
 ['platform management independent shell', render.includes('function renderManagementCenter(state)') && render.includes('state.platformAdmin ? renderManagementCenter(state)')],
 ['account menu state', main.includes('accountMenuOpen: false') && main.includes("action==='toggle-account-menu'")],
 ['owner gate action', main.includes('if(!state.platformAdmin){state.accountMenuOpen=false;render();return;}')],
 ['assets account lookup setting', render.includes("['account_lookup_channel_id','계좌조회 채널']")],
 ['guided setup account lookup', main.includes("key:'accountLookup'") && main.includes('account_lookup_channel_id')],
 ['guided setup keeps account lookup channel', main.includes("key:'accountLookup'") && render.includes('계좌 조회 채널')],
 ['account dropdown styling', layout.includes('.runtime-account-menu') && layout.includes('.runtime-account-trigger')],
];
let fail=0;
for(const [name,ok] of checks){
  console.log(`${ok?'PASS':'FAIL'} ${name}`);
  if(!ok)fail++;
}
if(fail)process.exit(1);
console.log(`ACCOUNT LOOKUP + OWNER SHELL: ${checks.length}/${checks.length} PASS`);
