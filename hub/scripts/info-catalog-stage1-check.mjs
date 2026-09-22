import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderInfoPage } from '../src/ui/infoPage.js';
const render = fs.readFileSync('src/ui/render.js','utf8');
const main = fs.readFileSync('src/main.js','utf8');
const api = fs.readFileSync('src/lib/productApi.js','utf8');
const sample={
  info_crafts:[{id:'a',item_name:'<img src=x onerror=alert(1)>',category:'테스트',is_active:true},{id:'b',item_name:'폐기',is_active:false}],
  info_craft_materials:[{id:1,craft_id:'a',material_name:'나무',quantity:2,is_active:true}],
  info_material_recipes:[],info_processes:[],info_quests:[],info_skill_ranks:[],
};
const state={platformAdmin:false,info:{loaded:true,loading:false,table:'info_crafts',query:'',selectedId:'a',showInactive:false,error:'',data:sample}};
const html=renderInfoPage(state);
assert(html.includes('게임 정보')&&html.includes('필요 재료'));
assert(!html.includes('<img src=x onerror=alert(1)>'));
assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert(!html.includes('>폐기<'));
assert(!html.includes('data-info-inactive'));
const ownerHtml=renderInfoPage({...state,platformAdmin:true,info:{...state.info,showInactive:true}});
assert(ownerHtml.includes('>폐기<')&&ownerHtml.includes('data-info-inactive'));
assert(render.includes('supportTabNav(state) + renderQuestions(state)'));
assert(render.includes('supportTabNav(state) + renderSuggestions(state)'));
assert(render.indexOf("if (state.page === 'info') return renderInfoPage(state);") < render.indexOf('if (!canAdmin(state))'));
assert(main.includes('getGameInformation') && api.includes('INFO_TABLES') && !api.includes('platform_info_set_active('));
console.log('LAC ONE INFO STAGE 1: 10/10 PASS (read-only layout, member access, XSS escape, support tabs, 6-table read)');
