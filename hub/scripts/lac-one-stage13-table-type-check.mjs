import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  LAYOUT_STUDIO_DEFAULTS, LAYOUT_STUDIO_STORAGE_KEY,
  normalizeLayoutStudioProfile, loadLayoutStudioProfile,
  saveLayoutStudioProfile, clearLayoutStudioProfile, applyLayoutStudioProfile
} from '../src/ui/layoutStudio.js';
const read=p=>fs.readFileSync(p,'utf8');
const css=read('src/styles.css'), render=read('src/ui/render.js'), main=read('src/main.js');
const stores=new Map();
globalThis.localStorage={getItem:k=>stores.get(k)??null,setItem:(k,v)=>stores.set(k,v),removeItem:k=>stores.delete(k)};
const vars=new Map(), dataset={};
globalThis.document={documentElement:{style:{setProperty:(k,v)=>vars.set(k,v)},dataset}};
let passed=0;
function test(label,fn){fn();passed++;console.log('PASS:',label);}
test('Independent table-only setting migrates the old whole-page slider once',()=>{
  assert.equal(LAYOUT_STUDIO_STORAGE_KEY,'lac_one_table_type_scale_v1');
  stores.set('lac_one_type_scale_v1',JSON.stringify({fontScale:140}));
  assert.equal(loadLayoutStudioProfile().fontScale,140);
  assert.equal(saveLayoutStudioProfile({fontScale:125}).fontScale,125);
  assert.equal(loadLayoutStudioProfile().fontScale,125);
  assert.equal(clearLayoutStudioProfile().fontScale,100);
  assert.equal(stores.has('lac_one_type_scale_v1'),false);
  assert.deepEqual(LAYOUT_STUDIO_DEFAULTS,{fontScale:100});
  assert.deepEqual(normalizeLayoutStudioProfile({fontScale:153}),{fontScale:150});
});
test('Scale never sets the global font scale above 100%',()=>{
  applyLayoutStudioProfile({fontScale:140});
  assert.equal(vars.get('--lac-type-scale'),'1');
  assert.equal(vars.get('--lac-table-scale'),'1.4');
  assert.equal(dataset.layoutStudioActive,'false');
  assert.equal(dataset.lacTableScaleActive,'true');
  applyLayoutStudioProfile({fontScale:100});
  assert.equal(vars.get('--lac-type-scale'),'1');
  assert.equal(dataset.lacTableScaleActive,'false');
});
test('One slider is labelled only for data tables, not the entire page',()=>{
  assert.match(render, /표 안의 글씨 크기/);
  assert.match(render, /데이터 표 안의 글씨 크기/);
  assert.match(render, /사이트 메뉴 · 페이지 제목 · 로그인 화면은 그대로 유지됩니다/);
  assert.doesNotMatch(render, /aria-label="사이트 전체 글씨 크기"/);
  assert.match(main,/action==='layout-save'/);
});
test('Fund, member, asset, account, cooking and review rows use local scale',()=>{
  const block=css.slice(css.indexOf('/* LAC ONE R4 · TABLE-ONLY TYPOGRAPHY'));
  for (const name of ['ops-lane-head','ops-lane-row','axe-fund-ledger-columns','axe-fund-ledger-row','axe-fund-review-row','axe-fund-history-row','ops-account-review article','ops-cooking-menu-row'])
    assert.ok(block.includes(name),`Missing table row: ${name}`);
  assert.match(block,/--lac-type-scale:\s*var\(--lac-table-scale/);
  assert.match(block,/overflow-x:auto/);
  assert.doesNotMatch(block,/\.runtime-auth\b|\.runtime-app\s*\{|\.page-header\s*\{|\.runtime-sidebar\b/);
  const fund=read('src/styles/fund.css'), mgmt=read('src/styles/management.css');
  assert.match(fund,/axe-fund-ledger-date strong\{[^}]*--lac-type-scale/);
  assert.match(fund,/axe-fund-ledger-money\{[^}]*--lac-type-scale/);
  assert.match(mgmt,/\.ops-lane-copy strong\{[^}]*--lac-type-scale/);
});
test('Original LAC login, company code guard, and DB schema integration retained',()=>{
  assert.match(render,/runtime-access-shell--calm/);
  assert.match(render,/data-login-create-code/);
  assert.match(main,/await redeemCompanyCreateCode\(createCode,requestedName\)/);
  assert.match(read('src/lib/supabase.js'),/schema: 'axe_product'/);
  assert.match(css,/lac-one-shell-clean\.png/);
});
console.log(`STAGE 13 TABLE TYPE CHECK: ${passed}/${passed} PASS`);
