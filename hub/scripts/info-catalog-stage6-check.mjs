import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderInfoPage,categoryFilters,searchInformation} from '../src/ui/infoPage.js';
const etc=['조악한 무기부품','무난한 무기부품','고철','의료용 붕대','기본 감정 키트(1)','기본 감정 키트(2)','캠프 파이어 키트(1)','캠프 파이어 키트(2)','캠프 파이어 키트(3)','종이','폭죽 시리즈 I','볼품없는 락픽','낡은 락픽','화약','소형 탄피(20)','9mm 탄약','.45 ACP 탄약','.50 AE 탄약','.44 매그넘 탄약'];
const crafts=[...etc.map((item_name,i)=>({id:`etc${i}`,item_name,category:'ETC',is_active:true})),...['KNIFE',...Array(6).fill('PISTOL'),...Array(2).fill('REVOLVER'),...Array(4).fill('SMG')].map((category,i)=>({id:`weapon${i}`,item_name:`weapon ${i}`,category,is_active:true}))];
const skills={'SMG 마스터리':4,'감정':4,'낚시':7,'돌진':7,'목재 가공':4,'몸 수색(경찰)':4,'벌목':7,'보물찾기':6,'악기연주':7,'요리':6,'운전':3,'작곡':4,'재련':4,'전력질주':4,'전문가 치료(EMS)':4,'절도':4,'제작':4,'차량 정비':6,'채광':7,'채집':4,'체력':6,'컴뱃롤':6,'택배':7,'피스톨 마스터리':4};
const data={
 info_crafts:crafts,
 info_craft_materials:Array.from({length:95},(_,i)=>({id:i+1,craft_id:crafts[i%32].id,material_name:`재료${i+1}`,quantity:i+1,is_active:true})),
 info_material_recipes:[{id:1,item_name:'조악한 무기부품',input1:'철주괴',input1_qty:1,input3:'견습생의 도구',input3_qty:1,note:'상점구매',is_active:true},{id:2,item_name:'무난한 무기부품',input1:'철주괴',input1_qty:2,input2:'동주괴',input2_qty:1,input3:'견습생의 도구',input3_qty:1,is_active:true}],
 info_processes:[...Array.from({length:4},(_,i)=>({id:i+1,item_name:`wood ${i}`,job:'벌목',process_type:'가공',is_active:true})),...Array.from({length:4},(_,i)=>({id:i+5,item_name:`ore ${i}`,job:'채광',process_type:'재련',is_active:true}))],
 info_quests:Array.from({length:30},(_,i)=>({id:i+1,item_name:`quest ${i}`,job:i<9?'채광':i<15?'벌목':i<20?'셰프':'할머니',rank:i<4?'C':null,is_active:true})),
 info_skill_ranks:Object.entries(skills).flatMap(([skill,count])=>Array.from({length:count},(_,i)=>({id:`${skill}-${i}`,skill,rank:`${i+1}등급`,required_point:i*100,is_active:true}))),
};
const initial={table:'info_crafts',craftGroup:'__all__',filterPrimary:'__all__',filterSecondary:'__all__',query:'',selectedId:'',showInactive:false,loaded:true,loading:false,error:'',data};
const view=(change={},owner=false)=>renderInfoPage({platformAdmin:owner,info:{...initial,...change}});
const browse=(table,change={})=>categoryFilters(table,{...initial,...change},data,false);
const includesFilterAll=html=>/data-info-value="__all__"|<option[^>]*>전체 \(/.test(html);
const source=readFileSync('src/main.js','utf8');
const checks=[
 ['all original rows present in synthetic fixture',Object.values(data).reduce((n,rows)=>n+rows.length,0)===290],
 ['five top-level tabs, including company-scoped modbooks, without a separate materials tab',(view().match(/data-info-table=/g)||[]).length===5],
 ['craft browse has no 전체 and defaults to knife',browse('info_crafts').rows.length===1&&!includesFilterAll(view())],
 ['craft firearm subtabs are direct chips without 전체',browse('info_crafts',{craftGroup:'총기류'}).rows.length===6&&!includesFilterAll(view({craftGroup:'총기류'}))],
 ['weapons combination records and linked ingredients remain reachable',browse('info_crafts',{craftGroup:'무기부품'}).rows.length===2&&view({craftGroup:'무기부품',selectedId:'1'}).includes('견습생의 도구')],
 ['production 4 wood and 4 refining, without 전체',browse('info_processes').rows.length===4&&browse('info_processes',{filterPrimary:'재련'}).rows.length===4&&!includesFilterAll(view({table:'info_processes'}))],
 ['quest defaults to one job, with optional grade chips and no 전체',browse('info_quests').rows.length===6&&!includesFilterAll(view({table:'info_quests'}))&&browse('info_quests',{filterPrimary:'채광'}).rows.length===9],
 ['grade filter toggles without an overall chip',view({table:'info_quests',filterPrimary:'채광'}).includes('등급 (선택)')&&browse('info_quests',{filterPrimary:'채광',filterSecondary:'C'}).rows.length===4],
 ['skill fields are four direct category chips and direct skill chips',!includesFilterAll(view({table:'info_skill_ranks'}))&&!view({table:'info_skill_ranks'}).includes('<select')&&view({table:'info_skill_ranks'}).includes('data-info-value="생활"')&&view({table:'info_skill_ranks',filterPrimary:'생산'}).includes('data-info-value="목재 가공"')],
 ['skill requires a direct skill choice and shows only that skill ranks',browse('info_skill_ranks').rows.length===0&&browse('info_skill_ranks',{filterPrimary:'생산',filterSecondary:'재련'}).rows.length===4&&view({table:'info_skill_ranks'}).includes('세부 스킬을 선택해 주세요.')],
 ['global search finds craft by a linked ingredient across active category',searchInformation(data,'재료16',initial,false).some(result=>result.table==='info_crafts'&&result.row.id==='etc15')],
 ['global search reaches production, quest, and skill across categories',searchInformation(data,'ore 0',initial,false).some(result=>result.table==='info_processes')&&searchInformation(data,'quest 0',initial,false).some(result=>result.table==='info_quests')&&searchInformation(data,'목재 가공',initial,false).some(result=>result.table==='info_skill_ranks')],
 ['global search finds two weapon-part combination recipes with no duplicate craft results',searchInformation(data,'견습생의 도구',initial,false).length===2&&searchInformation(data,'견습생의 도구',initial,false).every(result=>result.table==='info_material_recipes')],
 ['search results show source paths and can be opened independently of active category',view({table:'info_quests',filterPrimary:'할머니',query:'화약'}).includes('전체 검색 결과')&&view({table:'info_quests',filterPrimary:'할머니',query:'화약'}).includes('data-info-result-table="info_crafts"')&&view({table:'info_quests',filterPrimary:'할머니',query:'화약'}).includes('제작법 › 부품·원재료')],
 ['global search also handles special characters without raw markup',view({query:'"><img src=x onerror=alert(1)>'}).includes('&lt;img')&&!view({query:'"><img src=x onerror=alert(1)>'}).includes('<img src=x')],
 ['hidden inactive rows excluded for non-owner but available to owner with toggle',searchInformation({...data,info_quests:[{id:999,item_name:'숨긴 퀘스트',job:'채광',is_active:false}]},'숨긴',initial,false).length===0&&searchInformation({...data,info_quests:[{id:999,item_name:'숨긴 퀘스트',job:'채광',is_active:false}]},'숨긴',{...initial,showInactive:true},true).length===1],
 ['navigation handler routes all global result types to category and detail',source.includes("const infoResult=event.target.closest('[data-info-result-table]')")&&source.includes("state.info.query='';render();return;")],
 ['non-information screens and API stay read-only',!readFileSync('src/ui/infoPage.js','utf8').includes('supabase.from(')&&!readFileSync('src/lib/productApi.js','utf8').includes('platform_info_set_active(')],
];
let passed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
assert.equal(passed,checks.length,`${passed}/${checks.length} passed`);
console.log(`LAC ONE INFO STAGE 6: ${passed}/${checks.length} PASS`);
