import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderShell} from '../src/ui/render.js';
const base={envReady:true,ready:true,loading:false,page:'hub',session:{user:{id:'u1',user_metadata:{name:'사용자'}}},companies:[{id:'c1',name:'LAC 회사'}],companyId:'c1',memberships:[],platformAdmin:true,canCreateCompany:true,modal:null,error:'',notice:''};
function render(state){const root={innerHTML:''};renderShell(root,state);return root.innerHTML;}
for(const state of [base,{...base,platformAdmin:false,companies:[],companyId:null,canCreateCompany:true}]){
  const html=render(state);
  assert.match(html,/LAC를 즐기는<br><em>더 편리한 방법<\/em>/);
  assert.match(html,/게임 정보와 다양한 편의 기능을<br>LAC HUB에서 만나보세요/);
  assert.doesNotMatch(html,/PLAY · CREATE · CONNECT|즐기는 순간부터|함께 만드는 내일/);
  assert.doesNotMatch(html,/data-action="browse-hub-contents"|hub-cta--outline/);
  // Phase 18: the duplicated top-level company navigation is replaced by a
  // single hero CTA; the account area now displays the selected company.
  assert.doesNotMatch(html,/class="hub-nav"/);
  assert.match(html,/<h2 id="hub-contents-title">콘텐츠<\/h2>/);
  for(const label of ['회사 관리','게임 정보','LAC BUILD','LAC COOK'])assert.ok(html.includes(label),label);
  assert.equal((html.match(/class="hub-feature hub-feature--interactive"/g)||[]).length,state.companies.length?2:2);
  assert.equal((html.match(/class="hub-cta hub-cta--primary"/g)||[]).length,1);
  assert.match(html,/data-action="logout"/);
  if(state.platformAdmin)assert.match(html,/data-action="open-platform-admin"/);
}
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/hub-home.css',import.meta.url),'utf8');
assert.doesNotMatch(main,/browse-hub-contents|hub-contents--emphasized/);
assert.doesNotMatch(css,/hub-contents--emphasized|hub-content-spotlight/);
console.log('PHASE 17 PASS: B copy, single company CTA, redundant navigation removed, 4 cards preserved, account and admin controls retained.');
