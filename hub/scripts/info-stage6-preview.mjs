// Local, static demonstration only; no Supabase/network/login or mutations.
import {readFileSync,writeFileSync} from 'node:fs';
import {renderInfoPage} from '../src/ui/infoPage.js';
const css=readFileSync(new URL('../src/styles/info.css',import.meta.url),'utf8');
const data={
 info_crafts:[{id:'knife-1',category:'KNIFE',item_name:'나이프',is_active:true},{id:'etc-1',category:'ETC',item_name:'화약',is_active:true}],
 info_craft_materials:[{id:1,craft_id:'etc-1',material_name:'철주괴',quantity:2,is_active:true}],
 info_material_recipes:[{id:1,item_name:'조악한 무기부품',input1:'철주괴',is_active:true}],
 info_processes:[{id:1,item_name:'목재 가공',job:'벌목',is_active:true},{id:2,item_name:'철 재련',job:'채광',is_active:true}],
 info_quests:[{id:1,item_name:'광석 운반',job:'채광',is_active:true},{id:2,item_name:'장작 운반',job:'벌목',is_active:true}],
 info_skill_ranks:[{id:1,skill:'벌목',rank:'1등급',required_point:10,is_active:true},{id:2,skill:'목재 가공',rank:'1등급',required_point:20,is_active:true},{id:3,skill:'재련',rank:'1등급',required_point:30,is_active:true}],
};
const base={craftGroup:'근접무기',filterPrimary:'__all__',filterSecondary:'__all__',selectedId:'',showInactive:false,loaded:true,loading:false,error:'',data};
const skill=renderInfoPage({platformAdmin:false,info:{...base,table:'info_skill_ranks',filterPrimary:'생산',filterSecondary:'재련',selectedId:3}});
const search=renderInfoPage({platformAdmin:false,info:{...base,table:'info_quests',filterPrimary:'벌목',query:'화약'}});
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LAC ONE STAGE 6 · Mock UI</title><style>*{box-sizing:border-box}body{margin:0;background:#090c0f;color:#e5e9ed;font-family:Arial,'Malgun Gothic',sans-serif}.pane{max-width:1100px;margin:24px auto;padding:22px;background:#0d1116;border-radius:14px;border:1px solid #26303a}.preview-note{padding:10px;color:#d5aa66;font-size:12px}.page-eyebrow{font-size:10px;color:#d5aa66}.ops-action-secondary{cursor:default}${css}</style></head><body><main class="pane"><p class="preview-note">STAGE 6 정적 미리보기 · 샘플 데이터 / 실제 로그인과 DB 미연결 · 스킬 카테고리</p>${skill}</main><main class="pane"><p class="preview-note">STAGE 6 정적 미리보기 · 카테고리와 독립적인 통합 검색</p>${search}</main></body></html>`;
writeFileSync(new URL('../visual-check-local.html',import.meta.url),html);
