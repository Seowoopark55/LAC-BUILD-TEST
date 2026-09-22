import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderHubHome} from '../src/ui/hubHome.js';
const state={session:{user:{id:'u1',user_metadata:{global_name:'테스트'}}},companies:[],companyId:null,memberships:[],platformAdmin:false,canCreateCompany:true,hubBoard:{notices:[]}};
for(const testState of [state,{...state,companies:[{id:'c1',name:'회사'}],companyId:'c1'}]){
  const html=renderHubHome(testState);
  assert.match(html, /<a class="hub-feature hub-feature--interactive" href="\/build\/"\s+aria-label="LAC BUILD 열기">/);
  assert.match(html,/HUB에서 바로 이용 · 무료/);
  assert.equal((html.match(/href="\/build\/"/g)||[]).length,1);
  assert.equal((html.match(/class="hub-feature hub-feature--interactive"/g)||[]).length,3);
  assert.equal((html.match(/class="hub-feature hub-feature--pending"/g)||[]).length,1);
  assert.match(html,/data-action="open-company-start"|data-action="open-company-console"/);
  assert.match(html,/data-action="open-hub-game-info"|data-action="open-company-start"/);
  assert.match(html,/서비스 준비 중/);
}
const hub=readFileSync(new URL('../src/ui/hubHome.js',import.meta.url),'utf8');
assert.doesNotMatch(hub,/BUILD_PUBLIC_URL.*companyId|BUILD_PUBLIC_URL.*canCreateCompany/);
assert.doesNotMatch(hub,/HUB 연결 준비 중 · 기존 독립 사이트 유지/);
const css=readFileSync(new URL('../src/styles/hub-home.css',import.meta.url),'utf8');
assert.match(css,/\.hub-feature--interactive\{[^}]*text-decoration:none/);
console.log('PHASE24 UPDATED PASS: same-origin BUILD link, no company gating, other card actions preserved.');
