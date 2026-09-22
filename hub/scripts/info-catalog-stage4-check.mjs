import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderInfoPage} from '../src/ui/infoPage.js';
const etc=[
 '조악한 무기부품','무난한 무기부품','고철','의료용 붕대','기본 감정 키트(1)','기본 감정 키트(2)',
 '캠프 파이어 키트(1)','캠프 파이어 키트(2)','캠프 파이어 키트(3)','종이','폭죽 시리즈 I',
 '볼품없는 락픽','낡은 락픽','화약','소형 탄피(20)','9mm 탄약','.45 ACP 탄약','.50 AE 탄약','.44 매그넘 탄약',
];
const craftCategories=['KNIFE',...Array(6).fill('PISTOL'),...Array(2).fill('REVOLVER'),...Array(4).fill('SMG')];
const crafts=[...etc.map((item_name,i)=>({id:`etc${i}`,item_name,category:'ETC',is_active:true})),
 ...craftCategories.map((category,i)=>({id:`weapon${i}`,item_name:`${category} ${i}`,category,is_active:true}))];
const skills={
 'SMG 마스터리':4,'감정':4,'낚시':7,'돌진':7,'목재 가공':4,'몸 수색(경찰)':4,
 '벌목':7,'보물찾기':6,'악기연주':7,'요리':6,'운전':3,'작곡':4,'재련':4,
 '전력질주':4,'전문가 치료(EMS)':4,'절도':4,'제작':4,'차량 정비':6,
 '채광':7,'채집':4,'체력':6,'컴뱃롤':6,'택배':7,'피스톨 마스터리':4,
};
const data={
 info_crafts:crafts,
 info_craft_materials:Array.from({length:95},(_,i)=>({id:i+1,craft_id:crafts[i%crafts.length].id,material_name:`재료${i+1}`,quantity:i+1,is_active:true})),
 info_material_recipes:[{id:1,item_name:'재료 조합 1',is_active:true},{id:2,item_name:'재료 조합 2',is_active:true}],
 info_processes:[...Array.from({length:4},(_,i)=>({id:i+1,item_name:`벌목 가공 ${i}`,job:'벌목',process_type:'가공',is_active:true})),...Array.from({length:4},(_,i)=>({id:i+5,item_name:`채광 재련 ${i}`,job:'채광',process_type:'재련',is_active:true}))],
 info_quests:[...Array.from({length:9},(_,i)=>({id:i+1,item_name:`채광 ${i}`,job:'채광',rank:i<4?'C':null,is_active:true})),...Array.from({length:6},(_,i)=>({id:i+10,item_name:`벌목 ${i}`,job:'벌목',rank:'연습',is_active:true})),...Array.from({length:5},(_,i)=>({id:i+16,item_name:`셰프 ${i}`,job:'셰프',rank:'F',is_active:true})),...Array.from({length:10},(_,i)=>({id:i+21,item_name:`할머니 ${i}`,job:'할머니',rank:null,is_active:true}))],
 info_skill_ranks:Object.entries(skills).flatMap(([skill,count])=>Array.from({length:count},(_,i)=>({id:`${skill}-${i}`,skill,rank:`${i+1}등급`,required_point:i*100,is_active:true}))),
};
const render=(table='info_crafts',craftGroup='__all__',filterPrimary='__all__',filterSecondary='__all__',extra={})=>renderInfoPage({platformAdmin:false,info:{table,craftGroup,filterPrimary,filterSecondary,data,loaded:true,loading:false,query:'',selectedId:'',showInactive:false,error:'',...extra}});
const rowCount=html=>Number(html.match(/axe-info-list__heading[^>]*>.*?<small>(\d+)건<\/small>/s)?.[1]??-1);
const hasChoice=(html,title)=>html.includes(`>${title}<small>`);
const tests=[
 ['fixture has all 290 imported records',Object.values(data).reduce((n,rows)=>n+rows.length,0)===290],
 ['five top tabs and material table nested', (render().match(/data-info-table=/g)||[]).length===5 && !render().includes('data-info-table="info_craft_materials"')],
 ['32 crafts available under all',rowCount(render())===32],
 ['knife nested under 근접무기',rowCount(render('info_crafts','근접무기'))===1 && hasChoice(render('info_crafts','근접무기'),'나이프')],
 ['guns nested and Korean category labels',rowCount(render('info_crafts','총기류'))===12 && rowCount(render('info_crafts','총기류','피스톨'))===6 && rowCount(render('info_crafts','총기류','리볼버'))===2 && rowCount(render('info_crafts','총기류','SMG'))===4],
 ['5 part recipes distinct from 14 other recipes',rowCount(render('info_crafts','제작 재료'))===5 && rowCount(render('info_crafts','기타 제작품'))===14],
 ['tools 10 ammo 4 and unknown category visible',rowCount(render('info_crafts','기타 제작품','도구·소모품'))===10 && rowCount(render('info_crafts','기타 제작품','탄약'))===4 && !render('info_crafts','기타 제작품').includes('data-info-value="기타"')],
 ['95 linked ingredient rows grouped into 32 craft names',render('info_crafts','제작 재료','필요 재료').includes('제작법 32건 · 필요 재료 95건') && (render('info_crafts','제작 재료','필요 재료').match(/data-info-id=/g)||[]).length===32],
 ['material list shows craft name only, details show all ingredients',(()=>{const html=render('info_crafts','제작 재료','필요 재료','__all__',{selectedId:'materials:etc0'});return html.includes('>조악한 무기부품</strong>')&&!html.includes('>조악한 무기부품 · 재료1</strong>')&&html.includes('재료1 × 1')&&html.includes('재료33 × 33');})()],
 ['search by ingredient still finds grouped craft',rowCount(render('info_crafts','제작 재료','필요 재료','__all__',{query:'재료33'}))===-1 && render('info_crafts','제작 재료','필요 재료','__all__',{query:'재료33'}).includes('>조악한 무기부품</strong>')],
 ['quest jobs 30, mining 9 and rank C 4',rowCount(render('info_quests'))===30&&rowCount(render('info_quests','__all__','채광'))===9&&rowCount(render('info_quests','__all__','채광','C'))===4],
 ['quest hides redundant rank filter for sole rank',!render('info_quests','__all__','할머니').includes('aria-label="등급"')],
 ['process jobs 8, 4, 4 and no redundant process type',rowCount(render('info_processes'))===8&&rowCount(render('info_processes','__all__','벌목'))===4&&rowCount(render('info_processes','__all__','채광'))===4&&!render('info_processes','__all__','벌목').includes('aria-label="가공 방식"')],
 ['skill 123 and grouping live',rowCount(render('info_skill_ranks'))===123 && hasChoice(render('info_skill_ranks'),'생활') && hasChoice(render('info_skill_ranks'),'생산') && hasChoice(render('info_skill_ranks'),'전투') && hasChoice(render('info_skill_ranks'),'기술')],
 ['production only wood-processing and refining, 8 grade rows',rowCount(render('info_skill_ranks','__all__','생산'))===8 && render('info_skill_ranks','__all__','생산').includes('목재 가공')&&!render('info_skill_ranks','__all__','생산').includes('value="벌목"')],
 ['one selected skill shows ranks only',rowCount(render('info_skill_ranks','__all__','생산','재련'))===4&&render('info_skill_ranks','__all__','생산','재련').includes('>1등급</strong>')],
 ['unknown ETC and unknown skill remain discoverable',(()=>{const enriched={...data,info_crafts:[...crafts,{id:'unknown',item_name:'신규 제작품',category:'OTHER',is_active:true}],info_skill_ranks:[...data.info_skill_ranks,{id:'newskill',skill:'신규 스킬',rank:'1등급',is_active:true}]};return render('info_crafts','기타 제작품','기타','__all__',{data:enriched}).includes('신규 제작품')&&render('info_skill_ranks','__all__','기타','__all__',{data:enriched}).includes('신규 스킬');})()],
 ['information remains read-only and other app styles untouched',!fs.readFileSync('src/ui/infoPage.js','utf8').includes('supabase.from(')&&!fs.readFileSync('src/lib/productApi.js','utf8').includes('platform_info_set_active(')],
 ['main resets dependent filters on group and tab change',fs.readFileSync('src/main.js','utf8').includes("field==='craftGroup'")&&fs.readFileSync('src/main.js','utf8').includes("state.info.filterSecondary='__all__'")],
];
let passed=0;
for(const [name,condition] of tests){console.log(`${condition?'PASS':'FAIL'} ${name}`);if(condition)passed++;}
assert.equal(passed,tests.length,`${passed}/${tests.length} passed`);
console.log(`LAC ONE INFO STAGE 4: ${passed}/${tests.length} PASS`);
