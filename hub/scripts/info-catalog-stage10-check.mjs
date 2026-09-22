import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderInfoPage} from '../src/ui/infoPage.js';

const info={table:'info_crafts',query:'',loaded:true,loading:false,data:{
 info_crafts:[{id:'c1',category:'PISTOL',item_name:'테스트 피스톨',is_active:true}],
 info_processes:[{id:1,job:'벌목',item_name:'목재',is_active:true}],
 info_quests:[{id:1,job:'벌목',item_name:'테스트 퀘스트',is_active:true}],
 info_skill_ranks:[{id:1,skill:'벌목',rank:'1',is_active:true}],
 modbook_catalog:[{id:'m1',company_id:'A',type:'접두',category:'SMG',name:'테스트 개조서',active:true}],
 }};
const page=(changes={})=>renderInfoPage({companyId:'A',platformAdmin:false,info:{...info,...changes}});
const nav=html=>html.match(/<nav class="axe-info-tabs"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';
const tabs=['info_crafts','info_processes','info_quests','info_skill_ranks','modbook_catalog'];
const tests=[
 ['five top tabs preserved', (nav(page()).match(/data-info-table=/g)||[]).length===5],
 ['each tab has a matching SVG icon', tabs.every(id=>new RegExp(`data-info-table="${id}"[^>]*><svg class="axe-info-tab-icon"`).test(nav(page())))],
 ['all five tab labels preserved', ['제작법','생산','퀘스트','스킬 등급','개조서'].every(label=>nav(page()).includes(`<span>${label}</span>`))],
 ['top tab counts removed', !nav(page()).includes('<small>')&&!/제작법\s*\d|개조서\s*\d/.test(nav(page()))],
 ['list counts remain intact', page().includes('axe-info-list__heading')&&page().includes('<small>')],
 ['switching top tab retains selected state', /data-info-table="modbook_catalog" class="is-active"/.test(nav(page({table:'modbook_catalog'})))],
 ['global search keeps all five top navigation entries', (nav(page({query:'테스트'})).match(/data-info-table=/g)||[]).length===5],
 ['search still renders results from multiple domains', page({query:'테스트'}).includes('테스트 퀘스트')&&page({query:'테스트'}).includes('테스트 개조서')],
 ['top-level icon styling is scoped to info page', readFileSync('src/styles/info.css','utf8').includes('.axe-info-tabs>button.is-active .axe-info-tab-icon')],
 ['no changes to DB writes in info screen', !readFileSync('src/ui/infoPage.js','utf8').includes(".from('modbook_catalog').update(")],
];
let passed=0;
for(const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
assert.equal(passed,tests.length,`${passed}/${tests.length} checks`);
console.log(`LAC ONE INFO STAGE 10: ${passed}/${tests.length} PASS (synthetic only)`);
