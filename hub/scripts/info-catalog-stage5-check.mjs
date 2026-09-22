import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderInfoPage} from '../src/ui/infoPage.js';
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
const render=(table='info_crafts',group='__all__',primary='__all__',secondary='__all__',extra={})=>renderInfoPage({platformAdmin:false,info:{table,craftGroup:group,filterPrimary:primary,filterSecondary:secondary,data,loaded:true,loading:false,query:'',selectedId:'',showInactive:false,error:'',...extra}});
const count=html=>Number(html.match(/axe-info-list__heading[^>]*>.*?<small>(\d+)건<\/small>/s)?.[1]??-1);
const checks=[
 ['290 fixtures preserved',Object.values(data).reduce((n,rows)=>n+rows.length,0)===290],
 ['four top tabs and no separate recipe tab', (render().match(/data-info-table=/g)||[]).length===4&&!render().includes('data-info-table="info_material_recipes"')],
 ['32 crafts available in overall catalogue',count(render())===32],
 ['3 intermediate materials only, separate from 2 weapon-part recipes',count(render('info_crafts','부품·원재료'))===3&&count(render('info_crafts','무기부품'))===2],
 ['weapon-part ingredient combinations remain reachable',render('info_crafts','무기부품','__all__','__all__',{selectedId:'1'}).includes('견습생의 도구')],
 ['matching craft ingredients preserved in weapon-part details',render('info_crafts','무기부품','__all__','__all__',{selectedId:'1'}).includes('연결된 제작법')&&render('info_crafts','무기부품','__all__','__all__',{selectedId:'1'}).includes('재료1 × 1')],
 ['original 95 material records reachable in craft detail',render('info_crafts','부품·원재료','__all__','__all__',{selectedId:'etc13'}).includes('재료14 × 14')],
 ['production shows 목재 4 by default with no overall selection',count(render('info_processes'))===4&&render('info_processes').includes('생산 · 목재')&&!render('info_processes').includes('data-info-value="__all__"')],
 ['refining shows 4 by selection',count(render('info_processes','__all__','재련'))===4],
 ['quest filters preserved',count(render('info_quests'))===30&&count(render('info_quests','__all__','채광'))===9],
 ['skill classification preserved',count(render('info_skill_ranks','__all__','생산'))===8&&render('info_skill_ranks').includes('생활')&&render('info_skill_ranks').includes('전투')&&render('info_skill_ranks').includes('기술')],
 ['unknown recipes remain visible in 무기부품',render('info_crafts','무기부품','__all__','__all__',{data:{...data,info_material_recipes:[...data.info_material_recipes,{id:3,item_name:'신규 무기부품',is_active:true}]}}).includes('신규 무기부품')],
 ['read-only screen and existing APIs unchanged',!readFileSync('src/ui/infoPage.js','utf8').includes('supabase.from(')&&!readFileSync('src/lib/productApi.js','utf8').includes('platform_info_set_active(')],
];
let passed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
assert.equal(passed,checks.length,`${passed}/${checks.length} passed`);
console.log(`LAC ONE INFO STAGE 5: ${passed}/${checks.length} PASS`);
