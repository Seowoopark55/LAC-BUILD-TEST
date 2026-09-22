import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderShell} from '../src/ui/render.js';
const base={envReady:true,ready:true,session:{user:{id:'u1',user_metadata:{name:'LAC 사용자'}}},companies:[],companyId:null,platformAdmin:true,platformSnapshot:[],platformContentSettings:[{content_key:'company_management',display_name:'회사 관리',is_published:true,is_free:true}],platformView:'contents',platformSupport:{counts:{}},platformSuggestions:{counts:{}},error:'',notice:'',modal:null};
const html=(v)=>{const root={innerHTML:''};renderShell(root,{...base,...v});return root.innerHTML;};
for(const v of ['companies','contents','support','suggestions']){
 const result=html({page:'platform',platformView:v});
 assert.match(result,/class="runtime-app runtime-app--platform platform-center"/);
 assert.match(result,/data-action="go-hub"/);
 assert.doesNotMatch(result,/class="workspace-shell"|class="sidebar"|class="company-switcher"/);
 assert.doesNotMatch(result,/현재 회사|회사 운영<\/span>/);
}
assert.match(html({page:'platform',platformView:'contents'}),/data-content-key="company_management"/);
assert.match(html({page:'platform',platformView:'companies'}),/회사별 구독 관리/);
assert.match(html({page:'layout'}),/data-action="layout-save"/);
assert.doesNotMatch(html({page:'platform',platformAdmin:false}),/data-action="toggle-platform-content"|platform-center__workspace/);
const company=html({page:'dashboard',companies:[{id:'c1',name:'LAC 회사'}],companyId:'c1',memberships:[{user_id:'u1',role:'owner'}]});
assert.match(company,/class="workspace-shell"/);
assert.doesNotMatch(company,/data-action="open-platform-admin"/);
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
assert.match(main,/if\(action==='open-platform-admin'\)/);
console.log('Phase 4 independent admin center: PASS (operator gate, no-company admin, no company rail, existing controls, navigation).');
