import assert from 'node:assert/strict';
import {renderInfoPage} from '../src/ui/infoPage.js';
import fs from 'node:fs';
const etc=[
'조악한 무기부품','무난한 무기부품','고철','의료용 붕대','기본 감정 키트(1)','기본 감정 키트(2)',
'캠프 파이어 키트(1)','캠프 파이어 키트(2)','캠프 파이어 키트(3)','종이','폭죽 시리즈 I',
'볼품없는 락픽','낡은 락픽','화약','소형 탄피(20)','9mm 탄약','.45 ACP 탄약','.50 AE 탄약','.44 매그넘 탄약'];
const data={
 info_crafts:[...etc.map((item_name,i)=>({id:`etc${i}`,item_name,category:'ETC',is_active:true})),...Array.from({length:13},(_,i)=>({id:`weapon${i}`,item_name:`무기 ${i}`,category:i%2?'SMG':'PISTOL',is_active:true}))],
 info_craft_materials:[{id:1,craft_id:'etc15',material_name:'금속',quantity:2,is_active:true}],
 info_material_recipes:[{id:1,item_name:'재료 조합 1',is_active:true},{id:2,item_name:'재료 조합 2',is_active:true}],
 info_processes:[...Array.from({length:4},(_,i)=>({id:i+1,item_name:`벌목 가공 ${i}`,job:'벌목',process_type:'가공',is_active:true})),...Array.from({length:4},(_,i)=>({id:i+5,item_name:`채광 재련 ${i}`,job:'채광',process_type:'재련',is_active:true}))],
 info_quests:[...Array.from({length:9},(_,i)=>({id:i+1,item_name:`채광 ${i}`,job:'채광',rank:i<4?'C':null,is_active:true})),...Array.from({length:6},(_,i)=>({id:i+10,item_name:`벌목 ${i}`,job:'벌목',rank:'연습',is_active:true})),...Array.from({length:5},(_,i)=>({id:i+16,item_name:`셰프 ${i}`,job:'셰프',rank:'F',is_active:true})),...Array.from({length:10},(_,i)=>({id:i+21,item_name:`할머니 ${i}`,job:'할머니',rank:null,is_active:true}))],
 info_skill_ranks:[...Array.from({length:7},(_,i)=>({id:i+1,skill:'벌목',rank:`${i+1}등급`,is_active:true})),...Array.from({length:7},(_,i)=>({id:i+8,skill:'채광',rank:`${i+1}등급`,is_active:true}))],
};
const render=(table,filterPrimary='__all__',filterSecondary='__all__',extra={})=>renderInfoPage({platformAdmin:false,info:{table,filterPrimary,filterSecondary,data,loaded:true,loading:false,query:'',selectedId:'',showInactive:false,error:'',...extra}});
const tests=[
 ['all six table tabs and 32 crafts', (render('info_crafts').match(/data-info-table=/g)||[]).length===6 && render('info_crafts').includes('제작법<small>32</small>')],
 ['ETC uses real 19 items', render('info_crafts','ETC').includes('제작법</span><small>19건')],
 ['ETC materials group 5 and bullets remain UI-only',render('info_crafts','ETC','부품·재료').includes('<small>5건') && render('info_crafts','ETC','부품·재료').includes('화약')&&!render('info_crafts','ETC','부품·재료').includes('<strong>9mm 탄약</strong>')],
 ['ETC tools 10',render('info_crafts','ETC','도구·소모품').includes('<small>10건')],
 ['ETC ammo 4',render('info_crafts','ETC','탄약').includes('<small>4건')],
 ['craft material uses parent category/subgroup',render('info_craft_materials','ETC','탄약').includes('9mm 탄약 · 금속')],
 ['quest job and grade linked',render('info_quests','채광','C').includes('<small>4건')&&!render('info_quests','채광','C').includes('<strong>채광 5</strong>')],
 ['quest null rank preserved under 미지정',render('info_quests','할머니','__unset__').includes('<small>10건')],
 ['processes job and type filters linked',render('info_processes','채광','재련').includes('<small>4건')],
 ['skills grouped by skill instead of 123 buttons',render('info_skill_ranks','벌목').includes('<small>7건')&&render('info_skill_ranks','벌목').includes('>1등급</strong>')&&!render('info_skill_ranks','벌목').includes('>채광 · 1등급</strong>')],
 ['new ETC item remains discoverable',renderInfoPage({platformAdmin:false,info:{table:'info_crafts',filterPrimary:'ETC',filterSecondary:'기타',data:{...data,info_crafts:[...data.info_crafts,{id:'new',item_name:'새로운 제작품',category:'ETC',is_active:true}]},loaded:true}}).includes('새로운 제작품')],
 ['global source and API stay read-only',!fs.readFileSync('src/ui/infoPage.js','utf8').includes('supabase.from(')&&!fs.readFileSync('src/lib/productApi.js','utf8').includes('platform_info_set_active(')],
 ['desktop and mobile subfilters',fs.readFileSync('src/styles/info.css','utf8').includes('.axe-info-subfilters')&&fs.readFileSync('src/styles/info.css','utf8').includes('@media(max-width:760px)')],
 ['main click/select changes reset dependent filters',fs.readFileSync('src/main.js','utf8').includes('data-info-filter-select')&&fs.readFileSync('src/main.js','utf8').includes("state.info.filterSecondary='__all__'")],
];
for (const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${name}`);assert(ok,name);}
console.log(`LAC ONE INFO STAGE 3: ${tests.length}/${tests.length} PASS`);
