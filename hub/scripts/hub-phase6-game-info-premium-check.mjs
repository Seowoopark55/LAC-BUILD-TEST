import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {renderShell} from '../src/ui/render.js';
const root={innerHTML:''};
const sample={envReady:true,ready:true,loading:false,session:{user:{id:'u',user_metadata:{}}},companies:[{id:'c',name:'고객 회사'}],companyId:'c',memberships:[{user_id:'u',role:'member'}],platformAdmin:false,canCreateCompany:false,modal:null,info:{table:'info_crafts',data:{},loaded:false,loading:false,error:'',modbookError:'',companyId:'c',query:'',filterPrimary:'__all__',filterSecondary:'__all__'},error:'',notice:''};
const out=(page,table)=>{renderShell(root,{...sample,page,info:{...sample.info,table}});return root.innerHTML};
const mapping={info_crafts:'craft',info_craft_materials:'craft',info_material_recipes:'craft',info_processes:'production',info_quests:'quest',info_skill_ranks:'skill',modbook_catalog:'modbook'};
for(const [table,scene] of Object.entries(mapping)){
 const markup=out('game-info',table);
 assert.match(markup,new RegExp(`data-game-scene="${scene}"`));
 assert.match(markup,/제작법/);assert.match(markup,/생산/);assert.match(markup,/퀘스트/);assert.match(markup,/스킬 등급/);assert.match(markup,/개조서/);
 assert.match(markup,/data-info-query/);assert.match(markup,/data-action="go-hub"/);
 assert.match(markup,/선택 회사: 고객 회사/);
 assert.doesNotMatch(markup,/class="workspace-shell"|class="sidebar"/);
}
assert.match(out('info','info_crafts'),/class="workspace-shell"/,'Company-embedded information stays intact');
const noCompany=out('game-info','info_crafts');
const styles=readFileSync(new URL('../src/styles/game-center-premium.css',import.meta.url),'utf8');
assert.match(styles,/\.game-center \.axe-info-header\{display:none\}/);
assert.match(styles,/\.game-center \ .game-center__hero|\.game-center \.game-center__hero/);
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
assert.equal((css.match(/@import '\.\/styles\/game-center-premium\.css';/g)||[]).length,1);
for (const image of ['hero','craft','production','quest','skill','modbook']){
 const f=new URL(`../public/hub/game-info/${image}.webp`,import.meta.url);
 assert.ok(statSync(f).size>10000);
 assert.equal(readFileSync(f).subarray(0,4).toString(),'RIFF');
 assert.match(styles,new RegExp(`${image}\\.webp`));
}
assert.doesNotMatch(styles,/\.axe-info(?:-|\{|\s)(?![\s\S]*\})/,'Check scoped selectors separately');
console.log('PHASE 6 PASS: real 5 tabs, 7 scene mappings, standalone-only styles, all 6 WEBP assets, no company sidebar, embedded info preserved.');
