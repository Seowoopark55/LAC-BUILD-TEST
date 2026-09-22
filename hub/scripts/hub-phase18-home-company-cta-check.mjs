import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderHubHome} from '../src/ui/hubHome.js';
import {renderShell} from '../src/ui/render.js';

const base={envReady:true,ready:true,loading:false,page:'hub',session:{user:{id:'u1',user_metadata:{name:'계정 123'}}},companies:[],companyId:null,memberships:[],platformAdmin:false,canCreateCompany:true,modal:null,error:'',notice:''};
const home=(change={})=>renderHubHome({...base,...change});
const shell=(change={})=>{const target={innerHTML:''};renderShell(target,{...base,...change});return target.innerHTML;};
const c1={id:'c1',name:'AXE'};
const c2={id:'c2',name:'두 번째 회사'};
const joined={companies:[c1],companyId:'c1'};
const assertSingleHero=(html)=>assert.equal((html.match(/class="hub-cta hub-cta--primary"/g)||[]).length,1);

const newUser=home();
assert.match(newUser,/<button type="button" class="hub-cta hub-cta--primary" data-action="open-company-start">\+ 회사 생성/);
assertSingleHero(newUser);
assert.doesNotMatch(newUser,/hub-toolbar|MY SPACE|hub-nav|\+ 새 회사|data-action="open-create-company"/);
assert.match(shell(),/\+ 회사 생성/);

// The creation RPC may return true for a company member (or a platform owner).
// Membership, not that RPC, determines the hero CTA and hides new-company UI.
for(const creatorEligible of [true,false]){
  const member=home({...joined,canCreateCompany:creatorEligible});
  assert.match(member,/<button type="button" class="hub-cta hub-cta--primary" data-action="open-company-console">내 회사로 이동/);
  assert.match(member,/<span class="hub-account__company" title="현재 회사: AXE"><span>소속 회사<\/span><strong>AXE<\/strong>/);
  assert.doesNotMatch(member,/hub-toolbar|MY SPACE|hub-nav|\+ 회사 생성|\+ 새 회사|data-action="open-create-company"/);
  assertSingleHero(member);
  assert.equal((member.match(/data-action="open-company-console"/g)||[]).length,2,'hero and company card only');
  assert.match(shell({...joined,canCreateCompany:creatorEligible}),/내 회사로 이동/);
}

const noPermission=home({canCreateCompany:false});
assert.match(noPermission,/<button type="button" class="hub-cta hub-cta--primary" data-action="open-company-start">회사 가입 안내/);
assert.doesNotMatch(noPermission,/\+ 회사 생성|data-action="open-create-company"/);

const admin=home({...joined,platformAdmin:true,canCreateCompany:true});
assert.match(admin,/data-action="open-platform-admin"/);
assert.doesNotMatch(home({...joined,platformAdmin:false}),/data-action="open-platform-admin"/);
assert.doesNotMatch(admin,/\+ 회사 생성|data-action="open-create-company"/);

const multi=home({companies:[c1,c2],companyId:'c2',canCreateCompany:true});
assert.match(multi,/<details class="hub-account__company-switch">/);
assert.match(multi,/<strong>두 번째 회사<\/strong>/);
assert.equal((multi.match(/data-action="switch-company"/g)||[]).length,2);
assert.doesNotMatch(multi,/\+ 회사 생성/);

const escaped=home({companies:[{id:'x',name:'<회사 & "안전">'}],companyId:'x'});
assert.match(escaped,/&lt;회사 &amp; &quot;안전&quot;&gt;/);
assert.doesNotMatch(escaped,/<회사 & "안전">/);

const css=readFileSync(new URL('../src/styles/hub-home.css',import.meta.url),'utf8');
assert.doesNotMatch(css,/\.hub-toolbar|\.hub-nav|\.hub-small-button/);
assert.match(css,/\.hub-account__company/);
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
assert.match(main,/if\(action==='open-company-start'\)/);
assert.match(main,/if\(action==='open-company-console'\)/);
assert.match(main,/if\(action==='open-create-company'\)/);
assert.match(main,/if\(!state.canCreateCompany\)throw new Error\('이미 회사를 생성한 계정은 추가 회사를 등록할 수 없습니다\.'/);
assert.match(main,/if\(!state.canCreateCompany\)\{setError\('이미 회사를 생성한 계정은 새 회사를 추가로 만들 수 없습니다\./);
assert.match(main,/if\(state.companies.length\)\{setError\('이미 소속 회사가 설정되어 있어 새 회사를 만들 수 없습니다\./);
assert.match(main,/if\(state.companies.length\)throw new Error\('이미 소속 회사가 설정되어 있어 새 회사를 만들 수 없습니다\./);
const renderSource=readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
assert.doesNotMatch(shell({...joined,canCreateCompany:true,page:'dashboard'}),/data-action="open-create-company"/);
assert.match(renderSource,/canCreateCompany\?`<button/);

console.log('PHASE 18 PASS: account company, single stateful hero CTA, membership hides create even when eligible, join-only fallback, admin role, multi-company switch, escaping, preserved creation guards.');
