import assert from 'node:assert/strict';
import { readFileSync,statSync } from 'node:fs';
import { renderShell } from '../src/ui/render.js';
const state={envReady:true,ready:true,session:{user:{id:'u1',user_metadata:{name:'LAC 사용자'}}},companies:[{id:'c1',name:'실제 회사'}],companyId:'c1',platformAdmin:true,canCreateCompany:true,modal:null,error:'',notice:''};
const render=(s)=>{const root={innerHTML:''};renderShell(root,s);return root.innerHTML};
const html=render({...state,page:'hub'});
for(const asset of ['hero.webp','company.webp','game.webp','build.webp','cook.webp','mark.png']){
 const file=new URL('../public/hub/'+asset,import.meta.url);assert.ok(statSync(file).size>1024,asset+' missing');
}
for(const name of ['회사 관리','게임 정보','LAC BUILD','LAC COOK'])assert.ok(html.includes(name),name+' card missing');
assert.match(html,/data-action="open-company-console"/);
assert.match(html,/data-action="open-hub-game-info"/);
assert.match(html,/data-action="open-platform-admin"/);
// Phase 18: company members must not see an additional create CTA in HUB.
assert.doesNotMatch(html,/data-action="open-create-company"/);
assert.doesNotMatch(html,/data-action="open-build"|data-action="open-cook"/);
assert.doesNotMatch(html,/라크 게임즈/);
assert.match(html,/실제 회사/);
assert.match(html,/hub\/company.webp/);
const noCompany=render({...state,page:'hub',companies:[],companyId:null,platformAdmin:false});
assert.match(noCompany,/data-action="open-company-start"/);
assert.doesNotMatch(noCompany,/data-action="open-hub-game-info"|data-action="open-platform-admin"/);
assert.match(noCompany,/LAC BUILD/);
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
assert.match(main,/if\(action==='open-hub-game-info'\)[\s\S]*?navigatePrimaryScreen\('game-info'\)/);
console.log('HUB phase 3 visual integration: PASS (independent assets, company scoping, operator-only entry, pending content, legacy route).');
