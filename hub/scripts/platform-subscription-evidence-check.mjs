import fs from 'node:fs';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../src/lib/productApi.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../database/migrations/SUPABASE_MIGRATION_3_21_1_SCHEMA_HOTFIX_WITH_PLATFORM_OWNER.sql',import.meta.url),'utf8');
const checks=[
 ['platform admin RPC exists',api.includes("supabase.rpc('platform_is_admin')")],
 ['platform admin isolated from company sidebar', !render.includes('<span class="sidebar-nav__label spaced">플랫폼</span>') && render.includes('function renderManagementCenter(state)') && render.includes('state.platformAdmin !== true')],
 ['subscription management modal exists',render.includes("data-form=\"platform-subscription\"")],
 ['subscription update wired',main.includes("updatePlatformSubscription(companyId")],
 ['expired/paused company lock rendered',render.includes('renderSubscriptionBlocked')&&render.includes("['paused','expired']")],
 ['fund evidence upload uses private bucket helper',main.includes('uploadFundEvidence(state.companyId,state.session.user.id,item.file)')],
 ['clipboard paste wired',main.includes("root.addEventListener('paste'")&&render.includes('Ctrl+V로 붙여넣을 수 있습니다')],
 ['file picker wired',render.includes('data-ledger-evidence-input')&&main.includes('addLedgerPendingFiles(event.target.files)')],
 ['ledger evidence table migration included',sql.includes('create table if not exists axe_product.fund_ledger_attachments')],
 ['platform admins table migration included',sql.includes('create table if not exists axe_product.platform_admins')],
 ['new company trial trigger included',sql.includes('automatic 7-day trial')],
 ['platform styling included',css.includes('.platform-company-row')&&css.includes('.runtime-ledger-evidence-drop')],
];
let pass=0;
for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${label}`);if(ok)pass++;}
console.log(`Platform Subscription + Fund Evidence: ${pass}/${checks.length} PASS`);
if(pass!==checks.length)process.exit(1);
