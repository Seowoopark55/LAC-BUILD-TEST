import fs from 'node:fs';
const main=fs.readFileSync('src/main.js','utf8');
const render=fs.readFileSync('src/ui/render.js','utf8');
const api=fs.readFileSync('src/lib/productApi.js','utf8');
const css=fs.readFileSync('src/styles/access-gate.css','utf8');
const checks=[
  ['invite URL capture',main.includes("url.searchParams.get('invite')")&&main.includes('history.replaceState')],
  ['invite token session scoped',main.includes("sessionStorage.setItem(PENDING_INVITE_KEY")&&!main.includes("localStorage.setItem(PENDING_INVITE_KEY")],
  ['existing invite RPC reused',main.includes('redeemCompanyInvite')&&api.includes("rpc('redeem_company_invite'")],
  ['login invite form',render.includes('data-form="invite-login"')&&render.includes('초대 코드를 가지고 있어요')],
  ['unaffiliated access gate',render.includes('회사 접근 확인')&&render.includes('data-form="invite-redeem"')],
  ['live onboarding has no public create CTA',!render.slice(render.indexOf('function renderOnboarding'),render.indexOf('function renderAuthed')).includes('open-create-company')],
  ['membership recheck remains',render.includes('data-action="check-member-registration"')],
  ['minimal privacy copy is conditional',render.includes('state.discordAuthMinimal')&&render.includes('이메일 권한을 요청하지 않습니다.')],
  ['default OAuth does not falsely claim no email',main.includes("discordAuthMinimal: String(import.meta.env.VITE_SUPABASE_DISCORD_AUTH_PROVIDER")],
  ['access gate CSS scoped',css.includes('.runtime-auth.runtime-auth--access')&&css.includes('.runtime-access-gate')],
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`ACCESS GATE ${checks.length-failed}/${checks.length} PASS`);
if(failed)process.exit(1);
