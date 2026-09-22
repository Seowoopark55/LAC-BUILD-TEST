import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderInfoPage} from '../src/ui/infoPage.js';
const data={
  info_crafts:[{id:'a',item_name:'미니 SMG',category:'SMG',success_rate:50,is_active:true}],
  info_craft_materials:[{id:1,craft_id:'a',material_name:'금속',quantity:3,is_active:true}],
  info_material_recipes:[], info_processes:[], info_quests:[],
  info_skill_ranks:[{id:1,skill:'제작',rank:'초급',required_point:10,is_active:true}],
};
const info={data,loaded:true,loading:false,table:'info_crafts',query:'',selectedId:'',showInactive:false,error:''};
const page=renderInfoPage({platformAdmin:false,info});
const selected=renderInfoPage({platformAdmin:false,info:{...info,selectedId:'a'}});
const skill=renderInfoPage({platformAdmin:false,info:{...info,table:'info_skill_ranks'}});
const owner=renderInfoPage({platformAdmin:true,info});
const css=fs.readFileSync('src/styles/info.css','utf8');
const tests=[
  ['all six tabs retain switching', (page.match(/data-info-table=/g)||[]).length===6],
  ['tab selection remains explicit', page.includes('aria-current="true"')],
  ['list has title without duplicated subtitle', page.includes('>미니 SMG</strong>') && !page.includes('분류 SMG · 성공률 50')],
  ['unselected detail has placeholder', page.includes('정보를 선택해 주세요')],
  ['selected item displays craft materials', selected.includes('금속 × 3')],
  ['skill rank remains identifiable on one line', skill.includes('제작 · 초급')],
  ['owner-only inactive filter is preserved',owner.includes('data-info-inactive')&&!page.includes('data-info-inactive')],
  ['info stays read-only', !page.includes('platform_info_set_active')&&!page.includes('data-info-edit')],
  ['compact six-tab rail and responsive rules exist',css.includes('repeat(6,minmax(0,1fr))')&&css.includes('repeat(3,minmax(0,1fr))')],
  ['two-pane navigation and detail exist',css.includes('.axe-info-content{display:grid')&&css.includes('.axe-info-detail--empty')],
  ['support tab presentation remains',css.includes('.axe-support-tabs button.is-active')],
];
for (const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${name}`);assert(ok,name);}
console.log(`LAC ONE INFO STAGE 2: ${tests.length}/${tests.length} PASS`);
