import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {
  LAYOUT_STUDIO_DEFAULTS,LAYOUT_STUDIO_STORAGE_KEY,normalizeLayoutStudioProfile,
  loadLayoutStudioProfile,saveLayoutStudioProfile,clearLayoutStudioProfile,
  applyLayoutStudioProfile,applyLayoutStudioPreset,adjustLayoutStudioValue
} from '../src/ui/layoutStudio.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const render=read('src/ui/render.js'),main=read('src/main.js'),style=read('src/styles.css'),css=read('src/styles/access-gate.css'),tokens=read('src/styles/tokens.css');
const results=[]; const test=(name,fn)=>{try{fn();results.push([name,true]);}catch(e){results.push([name,false]);console.error('FAIL',name,e.message);}};
test('Login premium layout + same Discord OAuth handler',()=>{assert.match(render,/function renderLogin\(state\)[\s\S]*?runtime-access-stage/);assert.match(render,/runtime-access-shell--calm/);assert.match(render,/data-action="discord-login"/);assert.match(main,/action==='discord-login'\)\{await signInWithDiscord\(\)/);});
test('Preserve original wallpaper geometry and use clean assets',()=>{assert.match(style,/url\('\/brand\/lac-one-shell-clean\.png'\) center center\/cover no-repeat/);assert.match(css,/url\('\/brand\/lac-one-login-calm\.png'\) center\/100% 100% no-repeat/);assert.match(style,/@import '\.\/styles\/access-gate\.css';/);});
test('No previously branded source images active',()=>{assert.doesNotMatch(style,/url\('\/brand\/axe-shell-generated-v1\.png'\)/);assert.doesNotMatch(css,/url\('\/brand\/axe-login-calm-v1\.png'\)/);});
test('Owner-only Studio entry/route/actions',()=>{assert.match(render,/function renderManagementCenter\(state\)/);assert.match(render,/state\.platformAdmin !== true/);assert.match(render,/data-action="open-layout-studio"/);assert.match(render,/state\.page === 'layout'\) return state\.platformAdmin \? renderLayoutStudio\(state\) : renderPermission\(state\)/);for(const action of ['layout-preset','layout-adjust','layout-save','layout-revert','layout-reset-default'])assert.ok(main.includes(`action==='${action}'`));assert.match(main,/\['platform','layout'\]\.includes\(state\.page\)/);});
test('Studio stored profile retains original key and roundtrip',()=>{const m=new Map();globalThis.localStorage={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};assert.equal(LAYOUT_STUDIO_STORAGE_KEY,'axe_layout_studio_profile_v1');const updated=saveLayoutStudioProfile({...LAYOUT_STUDIO_DEFAULTS,primaryFont:11.2,rowHeight:42});assert.equal(loadLayoutStudioProfile().primaryFont,11.2);assert.equal(loadLayoutStudioProfile().rowHeight,42);assert.ok(m.has(LAYOUT_STUDIO_STORAGE_KEY));assert.equal(updated.railWidth,636);});
test('Studio presets, adjustment, clamp',()=>{let p=applyLayoutStudioPreset(LAYOUT_STUDIO_DEFAULTS,'text','large');assert.equal(p.primaryFont,11.2);p=adjustLayoutStudioValue(p,'primaryFont',100);assert.equal(p.primaryFont,13);p=clearLayoutStudioProfile();assert.equal(p.primaryFont,10.2);});
test('Actual page CSS consumes live Studio tokens only for custom profile',()=>{const props=new Map();globalThis.document={documentElement:{style:{setProperty:(k,v)=>props.set(k,v)},dataset:{}}};applyLayoutStudioProfile(LAYOUT_STUDIO_DEFAULTS);assert.equal(document.documentElement.dataset.layoutStudioActive,'false');applyLayoutStudioProfile({...LAYOUT_STUDIO_DEFAULTS,primaryFont:11.2});assert.equal(document.documentElement.dataset.layoutStudioActive,'true');assert.equal(props.get('--ops-table-primary-font-size'),'11.2px');assert.ok(style.includes('html[data-layout-studio-active="true"] .runtime-app .main--members .ops-lane-copy strong'));assert.ok(style.includes('.runtime-app .main--fund .axe-fund-ledger-money'));assert.ok(style.includes('.runtime-app .ops-cooking-menu-name'));});
test('Default CSS token values preserve normal 636px rail',()=>{assert.match(tokens,/--ops-table-header-font-size:8\.5px/);assert.match(tokens,/--ops-table-primary-font-size:10\.2px/);assert.match(tokens,/--ops-rail-standard:636px/);assert.match(style,/width:min\(var\(--ops-rail-standard\),100%\)/);});
test('Browser title and schema remain distinct from brand',()=>{assert.match(read('index.html'),/<title>LAC ONE<\/title>/);assert.match(read('src/lib/supabase.js'),/schema:\s*['"]axe_product['"]/);assert.match(read('server/supabaseUser.js'),/'Accept-Profile': 'axe_product'/);});
for(const [name,passed] of results)console.log(`${passed?'PASS':'FAIL'} ${name}`);
console.log(`LAC ONE R2: ${results.filter(x=>x[1]).length}/${results.length} passed`);
if(results.some(x=>!x[1]))process.exit(1);
