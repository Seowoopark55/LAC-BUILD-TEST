import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderShell} from '../src/ui/render.js';
import {renderInfoPage} from '../src/ui/infoPage.js';

const state={
 envReady:true,ready:true,session:{user:{id:'u',user_metadata:{}}},
 companies:[{id:'a',name:'AXE'}],companyId:'a',memberships:[{user_id:'u',role:'member'}],
 platformAdmin:false,modal:null,
 info:{table:'info_crafts',loaded:true,loading:false,error:'',modbookError:'',query:'',
  companyId:'a',selectedId:'1',craftGroup:'근접무기',filterPrimary:'__all__',filterSecondary:'__all__',
  data:{info_crafts:[{id:'1',item_name:'나이프',category:'KNIFE'}],info_craft_materials:[]}}
};
const root={innerHTML:''};
renderShell(root,{...state,page:'game-info'});
const standalone=root.innerHTML;
const header=standalone.match(/<header class="game-center__header">([\s\S]*?)<\/header>/)?.[1]||'';
const hero=standalone.match(/<section class="game-center__hero"[\s\S]*?<\/section>/)?.[0]||'';
assert.equal((header.match(/class="game-center__actions"/g)||[]).length,1);
assert.equal((header.match(/<button\b/g)||[]).length,2,'Clickable brand plus one visible HUB return button');
assert.match(header,/class="game-center__back" data-action="go-hub"/);
assert.doesNotMatch(header,/선택 회사:|open-company-console|회사 관리로 이동/);
assert.doesNotMatch(hero,/새로고침|REAL LIFE|ANOTHER STORY|LOS SANTOS ROLEPLAY|game-center__refresh|game-center__hero-sign|game-center__eyebrow/);
assert.match(hero,/게임 정보/);
assert.doesNotMatch(standalone,/data-action="info-refresh"/,'No redundant standalone refresh button during normal operation');
for(const tab of ['info_crafts','info_processes','info_quests','info_skill_ranks','modbook_catalog'])assert.match(standalone,new RegExp(`data-info-table="${tab}"`));
assert.match(standalone,/data-info-query/);
assert.match(standalone,/나이프/);
const embedded=renderInfoPage(state);
assert.match(embedded,/data-action="info-refresh"/,'Company embedded refresh stays available');
assert.match(embedded,/나이프/);
const css=readFileSync(new URL('../src/styles/game-center.css',import.meta.url),'utf8');
assert.doesNotMatch(css,/\.game-center \.game-center__(?:refresh|eyebrow|hero-sign|company)\b/,'Remove orphaned active style rules');
console.log('PHASE16 PASS: standalone header has HUB return only; decorative text/refresh absent; company embedded view, five tabs and real data preserved.');
