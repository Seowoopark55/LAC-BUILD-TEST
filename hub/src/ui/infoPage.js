// LAC HUB shared information catalogue — read-only presentation.
// UI categories never modify source records, craft IDs, or linked ingredients.
const CONFIG = Object.freeze({
  info_crafts: ['제작법','item_name',[['category','분류'],['success_rate','성공률'],['craft_rank','제작 등급'],['obtain_place','획득 장소'],['note','비고']]],
  info_craft_materials: ['제작 재료','material_name',[['craft_id','제작법 ID'],['quantity','필요 수량']]],
  info_material_recipes: ['무기부품','item_name',Array.from({length:8},(_,i)=>[`input${i+1}`,`재료 ${i+1}`]).concat([['note','비고']])],
  info_processes: ['생산','item_name',[['job','직업'],['process_type','가공 종류'],['output_qty','생산 수량'],['quest_qty','퀘스트 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_quests: ['퀘스트','item_name',[['job','직업'],['required_qty','필요 수량'],['reward_money','보상 금액'],['reward_xp','보상 경험치'],['rank','등급'],['note','비고']]],
  info_skill_ranks: ['스킬 등급','skill',[['rank','등급'],['required_point','필요 포인트'],['point_type','포인트 종류'],['note','비고']]],
  modbook_catalog: ['개조서','name',[['type','접두·접미'],['category','적용 분야'],['parts','필요 부품'],['option1','옵션 1'],['option2','옵션 2'],['option3','옵션 3'],['success_rate','성공률'],['recent_price','최근 거래가격'],['recent_date','최근 거래일'],['price_note','가격 비고'],['note','비고']]],
});
const TOP_TABS=[['info_crafts','제작법'],['info_processes','생산'],['info_quests','퀘스트'],['info_skill_ranks','스킬 등급'],['modbook_catalog','개조서']];
// Stage 10: lightweight, consistent line symbols for the five top-level categories.
// These are presentation-only; no data or navigation semantics change.
const INFO_TAB_ICONS=Object.freeze({
 info_crafts:'<path d="m14 6 4 4M11 9l7-7 4 4-7 7M2 22l9-9M3 18l3 3"/>',
 info_processes:'<path d="M3 21V9l6 4V9l6 4V5h6v16H3Z"/><path d="M7 17h2m3 0h2m3 0h2"/>',
 info_quests:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6m-6 4h3"/>',
 info_skill_ranks:'<circle cx="12" cy="8" r="5"/><path d="m8.5 12-2 9 5.5-3 5.5 3-2-9"/>',
 modbook_catalog:'<path d="M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V20c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5V5.5Z"/><path d="M12 6v14.5"/>',
});
const infoTabIcon=table=>`<svg class="axe-info-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${INFO_TAB_ICONS[table]||''}</svg>`;
const ALL='__all__', UNSET='__unset__';
const escapeText=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const fieldValue=(row,key)=>row[key]===null||row[key]===undefined||row[key]===''?'—':String(row[key]);
const filterName=value=>value===null||value===undefined||String(value).trim()===''?UNSET:String(value).trim();
const showFilterName=value=>value===UNSET?'미지정':value;
const visibleRows=(data,table,info,owner)=>(data[table]||[]).filter(row=>(owner&&info.showInactive)||(table==='modbook_catalog'?row.active!==false:row.is_active!==false));
const distinct=values=>[...new Set(values)].sort((a,b)=>a.localeCompare(b,'ko'));
const ETC_GROUPS=Object.freeze({
 '조악한 무기부품':'부품·원재료','무난한 무기부품':'부품·원재료','고철':'부품·원재료',
 '화약':'부품·원재료','소형 탄피(20)':'부품·원재료',
 '의료용 붕대':'도구·소모품','기본 감정 키트(1)':'도구·소모품','기본 감정 키트(2)':'도구·소모품',
 '캠프 파이어 키트(1)':'도구·소모품','캠프 파이어 키트(2)':'도구·소모품','캠프 파이어 키트(3)':'도구·소모품',
 '종이':'도구·소모품','폭죽 시리즈 I':'도구·소모품','볼품없는 락픽':'도구·소모품','낡은 락픽':'도구·소모품',
 '9mm 탄약':'탄약','.45 ACP 탄약':'탄약','.50 AE 탄약':'탄약','.44 매그넘 탄약':'탄약',
});
const SKILL_GROUPS=Object.freeze({
 '생활':['벌목','채광','채집','낚시','요리','택배','보물찾기'],
 '생산':['목재 가공','재련'],
 '전투':['SMG 마스터리','피스톨 마스터리','돌진','전력질주','체력','컴뱃롤'],
 '기술':['감정','운전','차량 정비','전문가 치료(EMS)','몸 수색(경찰)','절도','제작','악기연주','작곡'],
});
const skillGroup=skill=>Object.entries(SKILL_GROUPS).find(([,names])=>names.includes(String(skill)))?.[0]||'기타';
const MODBOOK_GROUPS=Object.freeze({
 '무기':['SMG','피스톨','라이플','저격소총','머신건','근접무기'],
 '생활':['벌목','채광','채집','낚시','요리','제련','제작','감정','절도'],
 '전투':['체력','이동속도'],
});
const splitModbookLabels=value=>String(value||'').split(/[,，、]/u).map(label=>label.trim()).filter(Boolean);
const MODBOOK_KNOWN_CATEGORIES=new Set(Object.values(MODBOOK_GROUPS).flat());
// These two option-keywords are supported by verified legacy screenshots:
// 돌판의 (채집 effects) and 냄비의 (요리 effects). Do not guess categories from
// arbitrary materials/effects, or use the item's name as a category hint.
// If a new legacy record cannot be classified safely, keep it in 분류 미확인.
const MODBOOK_VERIFIED_OPTION_HINTS=Object.freeze(['채집','요리']);
const modbookClassification=row=>{
 const stored=splitModbookLabels(row?.category);
 const recognized=stored.filter(label=>MODBOOK_KNOWN_CATEGORIES.has(label));
 if(recognized.length)return {categories:[...new Set(recognized)],source:'category'};
 if(stored.length===0||(stored.length===1&&stored[0]===row?.type)){
  const partLabels=splitModbookLabels(row?.parts);
  if(partLabels.length&&partLabels.every(label=>MODBOOK_KNOWN_CATEGORIES.has(label)))
   return {categories:[...new Set(partLabels)],source:'parts'};
  const effects=[row?.option1,row?.option2,row?.option3].filter(Boolean).join(' ');
  const explicit=MODBOOK_VERIFIED_OPTION_HINTS.filter(label=>effects.includes(label));
  if(explicit.length)return {categories:explicit,source:'options'};
 }
 return {categories:stored,source:'unclassified'};
};
const modbookCategories=row=>{
 return modbookClassification(row).categories;
};
const modbookGroups=row=>{
 const values=modbookCategories(row);
 const groups=Object.entries(MODBOOK_GROUPS).filter(([,types])=>values.some(value=>types.includes(value))).map(([group])=>group);
 return groups.length?groups:['분류 확인 필요'];
};
const productionGroup=row=>row.job==='벌목'?'목재':row.job==='채광'?'재련':'기타';
const craftGroup=craft=>{
 const category=String(craft?.category||'').toUpperCase();
 if(category==='KNIFE')return '근접무기';
 if(['PISTOL','REVOLVER','SMG'].includes(category))return '총기류';
 if(category==='ETC'&&['조악한 무기부품','무난한 무기부품'].includes(String(craft.item_name)))return '무기부품';
 if(category==='ETC'&&ETC_GROUPS[String(craft.item_name)]==='부품·원재료')return '부품·원재료';
 return '기타 제작품';
};
const craftSubtype=craft=>{
 const category=String(craft?.category||'').toUpperCase();
 if(category==='KNIFE')return '나이프';
 if(['PISTOL','REVOLVER','SMG'].includes(category))return ({PISTOL:'피스톨',REVOLVER:'리볼버',SMG:'SMG'})[category];
 return ETC_GROUPS[String(craft?.item_name)]||'기타';
};
const itemName=(table,row,data)=>{
 if(table==='info_craft_materials'){
  const parent=(data.info_crafts||[]).find(c=>String(c.id)===String(row.craft_id));
  return parent?String(parent.item_name):String(row.material_name||'이름 없음');
 }
 if(table==='info_skill_ranks')return [row.skill,row.rank].filter(Boolean).join(' · ')||'이름 없음';
 return String(row[CONFIG[table][1]]||'이름 없음');
};
const renderFields=fields=>fields.filter(([,value])=>value!=='—').map(([label,value])=>`<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join('');
// Standalone detail presentation: reorganize *existing* DB fields into readable
// groups. Never synthesize game values or infer prices/conditions from artwork.
const standaloneDetailSections=(htmlFields,table)=>{
 // Only group fields already produced by detailFields/weaponPartDetails. This
 // layout never adds inferred game data or duplicates any existing DB value.
 const fieldRe=/<div(?: class="axe-info-detail__section")?><dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g;
 const fields=Array.from(htmlFields.matchAll(fieldRe),([,label,value],index)=>({
  label,value,index,plain:label.replace(/<[^>]+>/g,'')
 }));
 const priority=/^(?:분류|직업|등급|제작 등급|가공 종류|접두·접미|적용 분야|획득 장소|획득처|포인트 종류)$/;
 const materials=/재료|부품|투입/;
 const target=Math.ceil(fields.length/2);
 const left=fields.filter(field=>priority.test(field.plain)||materials.test(field.plain));
 const right=fields.filter(field=>!left.includes(field));
 // Balance the visible density without severing or changing any source data.
 while(left.length>target){
  const candidate=left.findLastIndex(field=>!materials.test(field.plain));
  const index=candidate<0?left.length-1:candidate;
  right.unshift(left.splice(index,1)[0]);
 }
 while(left.length<target&&right.length) left.push(right.shift());
 left.sort((a,b)=>a.index-b.index);
 right.sort((a,b)=>a.index-b.index);
 const datum=field=>{
  // Show each real ingredient in a small readable chip; these are NOT inventory
  // counts, fabricated item artwork, or an actionable "craft" control.
  const value=field.plain==='필요 재료'&&field.value.includes(' · ')
   ?`<span class="game-detail-materials">${field.value.split(' · ').map(part=>`<span class="game-detail-material">${part}</span>`).join('')}</span>`
   :field.value;
  return `<div class="axe-info-detail__datum${/비고|메모|설명|가격 비고/.test(field.plain)?' is-narrative':''}${materials.test(field.plain)?' is-material':''}"><dt>${field.label}</dt><dd>${value}</dd></div>`;
 };
 const column=(title,key,entries)=>entries.length?`<section class="game-detail-section game-detail-section--${key}" aria-label="${title}"><h3>${title}</h3><dl>${entries.map(datum).join('')}</dl></section>`:'';
 const sectionTitle=({info_processes:'생산 · 보상',info_quests:'퀘스트 · 보상',info_skill_ranks:'성장 · 조건',modbook_catalog:'개조 · 효과'})[table]||'제작 · 조건 · 보상';
 return `<div class="game-detail-sections${right.length?'':' game-detail-sections--single'}">${column('기본 정보','primary',left)}${column(sectionTitle,'requirements',right)}</div>`;
};
const itemListSubtitle=(table,row)=>{
 if(table==='info_crafts')return [craftGroup(row),craftSubtype(row)].filter(Boolean).join(' · ');
 if(table==='info_material_recipes')return '무기부품 · 조합';
 if(table==='info_processes')return [row.job,row.process_type].filter(Boolean).join(' · ');
 if(table==='info_quests')return [row.job,row.rank].filter(Boolean).join(' · ');
 if(table==='info_skill_ranks')return [row.skill,row.rank].filter(Boolean).join(' · ');
 if(table==='modbook_catalog')return [row.type,modbookCategories(row).slice(0,2).join(', ')].filter(Boolean).join(' · ');
 return '';
};
const listDecor=(table,title,subtitle,search=false)=>`<span class="game-list-symbol" aria-hidden="true">${infoTabIcon(table==='info_material_recipes'?'info_crafts':table)}</span><span class="game-list-label"><strong>${escapeText(title)}</strong>${subtitle?`<small>${escapeText(subtitle)}</small>`:''}</span>`;

const detailFields=(table,row,data,info,owner)=>{
 const fields=CONFIG[table][2].map(([key,label])=>[label,fieldValue(row,key)]);
 if(table==='modbook_catalog'){
  const classification=modbookClassification(row);
  if(['parts','options'].includes(classification.source)){
   const field=fields.find(([label])=>label==='적용 분야');
   const explanation=classification.source==='parts'?'필요 부품 표기 기준 · 분류 확인 필요':'옵션 효과 기준 · 원본 분류값은 변경되지 않음';
   if(field)field[1]=`${classification.categories.join(', ')} (${explanation})`;
  }
  const price=fields.find(([label])=>label==='최근 거래가격');
  if(price&&price[1]!=='—'&&Number.isFinite(Number(row.recent_price)))price[1]=`${Number(row.recent_price).toLocaleString('ko-KR')}원`;
 }
 if(table==='info_material_recipes')for(let i=1;i<=8;i++){
  const name=row[`input${i}`]; if(name)fields.splice((i-1)*2+1,0,[`재료 ${i} 수량`,fieldValue(row,`input${i}_qty`)]);
 }
 if(table==='info_processes')for(let i=1;i<=4;i++){
  if(row[`input${i}`])fields.push([`투입 재료 ${i}`,`${row[`input${i}`]} × ${fieldValue(row,`input${i}_qty`)}`]);
 }
 if(table==='info_crafts'){
  const materials=visibleRows(data,'info_craft_materials',info,owner).filter(m=>String(m.craft_id)===String(row.id));
  if(materials.length)fields.push(['필요 재료',materials.map(m=>`${m.material_name} × ${m.quantity}`).join(' · ')]);
 }
 return renderFields(fields);
};
// Restrained monochrome line symbols (not OS-dependent emoji) keep the LAC HUB tone.
const MODBOOK_ICONS=Object.freeze({
 '무기':'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
 '생활':'<path d="M20 4c-9 0-15 4-15 11a5 5 0 0 0 5 5c7 0 11-6 10-16Z"/><path d="M4 21c2-5 6-9 12-12"/>',
 '전투':'<path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/>',
 '접두':'<path d="M7 12h10M11 8l-4 4 4 4"/>',
 '접미':'<path d="M7 12h10M13 8l4 4-4 4"/>',
});
const modbookIcon=value=>MODBOOK_ICONS[value]?`<svg class="axe-info-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MODBOOK_ICONS[value]}</svg>`:'';
const chipRow=(title,field,values,selected,rows,valueOf,{modbook=false}={})=>{
 const items=values.map(value=>{
  const count=rows.filter(row=>{const category=valueOf(row);return Array.isArray(category)?category.includes(value):category===value;}).length;
  const tone=modbook&&field==='secondary'?(value==='접두'?' axe-info-chip--prefix':value==='접미'?' axe-info-chip--suffix':''):'';
  return `<button type="button" data-info-filter="${field}" data-info-value="${escapeText(value)}" class="${selected===value?'is-active':''}${tone}" aria-pressed="${selected===value?'true':'false'}">${modbook?modbookIcon(value):''}${escapeText(showFilterName(value))}<small>${count}</small></button>`;
 }).join('');
 return `<div class="axe-info-subfilter${modbook?' axe-info-subfilter--modbook':''}"><span class="axe-info-subfilter__label">${escapeText(title)}</span><div class="axe-info-chips" role="group" aria-label="${escapeText(title)}">${items}</div></div>`;
};
const weaponPartDetails=(recipe,data,info,owner)=>{
 const craft=visibleRows(data,'info_crafts',info,owner).find(row=>String(row.item_name)===String(recipe.item_name));
 const source=detailFields('info_material_recipes',recipe,data,info,owner);
 return craft?`${source}<div class="axe-info-detail__section"><dt>연결된 제작법</dt><dd>${escapeText(craft.item_name)}</dd></div>${detailFields('info_crafts',craft,data,info,owner)}`:source;
};

// Browsing has no "전체" chips. The unified search below is the sole cross-category search.
export function categoryFilters(table,info,data,owner){
 const primary=String(info.filterPrimary||ALL),secondary=String(info.filterSecondary||ALL);
 let shown=visibleRows(data,table,info,owner),controls='',chosenSkill='',heading=CONFIG[table][0],countNote='';
 if(['info_crafts','info_craft_materials','info_material_recipes'].includes(table)){
  const groupNames=['근접무기','총기류','부품·원재료','무기부품','기타 제작품'];
  const craftRows=visibleRows(data,'info_crafts',info,owner);
  const recipes=visibleRows(data,'info_material_recipes',info,owner);
  const group=groupNames.includes(info.craftGroup)?info.craftGroup:groupNames[0];
  const groupCount=key=>key==='무기부품'?recipes.length:craftRows.filter(row=>craftGroup(row)===key).length;
  controls+=`<div class="axe-info-subfilter"><span class="axe-info-subfilter__label">제작 구분</span><div class="axe-info-chips" role="group" aria-label="제작 구분">${groupNames.map(value=>`<button type="button" data-info-filter="craftGroup" data-info-value="${escapeText(value)}" class="${group===value?'is-active':''}" aria-pressed="${group===value?'true':'false'}">${escapeText(value)}<small>${groupCount(value)}</small></button>`).join('')}</div></div>`;
  if(group==='무기부품'){
   table='info_material_recipes';shown=recipes;heading='무기부품 조합';
  }else{
   table='info_crafts';shown=craftRows.filter(craft=>craftGroup(craft)===group);
   if(['근접무기','총기류','기타 제작품'].includes(group)){
    const preferred=group==='근접무기'?['나이프']:group==='총기류'?['피스톨','리볼버','SMG']:['도구·소모품','탄약','기타'];
    const values=preferred.filter(value=>shown.some(craft=>craftSubtype(craft)===value));
    if(values.length>1){
     const chosen=values.includes(primary)?primary:values[0];
     controls+=chipRow('세부 분류','primary',values,chosen,shown,craftSubtype);
     shown=shown.filter(craft=>craftSubtype(craft)===chosen);
    }
   }
   heading=group;
  }
 }else if(table==='info_processes'){
  const types=['목재','재련','기타'].filter(type=>shown.some(row=>productionGroup(row)===type));
  const chosen=types.includes(primary)?primary:(types[0]||'목재');
  controls+=chipRow('생산 종류','primary',types,chosen,shown,productionGroup);
  shown=shown.filter(row=>productionGroup(row)===chosen);
  heading=`생산 · ${chosen}`;
 }else if(table==='info_quests'){
  const jobOf=row=>filterName(row.job),jobs=distinct(shown.map(jobOf));
  const chosen=jobs.includes(primary)?primary:jobs[0];
  controls+=chipRow('직업','primary',jobs,chosen,shown,jobOf);
  shown=shown.filter(row=>jobOf(row)===chosen);
  const valueOf=row=>filterName(row.rank),types=distinct(shown.map(valueOf));
  if(types.length>1){
   const rank=types.includes(secondary)?secondary:ALL;
   // Grade is an optional toggle: click selected grade again to see the full job, without an "전체" chip.
   controls+=chipRow('등급 (선택)','secondary',types,rank,shown,valueOf);
   shown=shown.filter(row=>rank===ALL||valueOf(row)===rank);
  }
  heading=`퀘스트 · ${showFilterName(chosen)}`;
 }else if(table==='info_skill_ranks'){
  const types=distinct(shown.map(row=>skillGroup(row.skill)));
  const groups=['생활','생산','전투','기술','기타'].filter(group=>types.includes(group));
  const group=groups.includes(primary)?primary:groups[0];
  controls+=chipRow('스킬 분야','primary',groups,group,shown,row=>skillGroup(row.skill));
  shown=shown.filter(row=>skillGroup(row.skill)===group);
  const skills=distinct(shown.map(row=>filterName(row.skill)));
  const chosen=skills.includes(secondary)?secondary:'';
  controls+=chipRow('세부 스킬','secondary',skills,chosen,shown,row=>filterName(row.skill));
  shown=chosen?shown.filter(row=>filterName(row.skill)===chosen):[];
  countNote=chosen?`${shown.length}개 등급`:'스킬을 선택해 주세요';
  chosenSkill=chosen;
  heading=`스킬 등급 · ${group}`;
 }else if(table==='modbook_catalog'){
  const groupNames=['무기','생활','전투'];
  const hasUnclassified=shown.some(row=>modbookGroups(row).includes('분류 확인 필요'));
  const groups=groupNames.filter(group=>shown.some(row=>modbookGroups(row).includes(group)));
  const group=([...groups,...(hasUnclassified?['분류 확인 필요']:[])].includes(primary)?primary:groups[0]||(hasUnclassified?'분류 확인 필요':'무기'));
  controls+=chipRow('개조서 분야','primary',groups,group,shown,modbookGroups,{modbook:true});
  if(hasUnclassified){
   const unclassifiedCount=shown.filter(row=>modbookGroups(row).includes('분류 확인 필요')).length;
   controls+=`<div class="axe-info-subfilter axe-info-subfilter--exception"><span class="axe-info-subfilter__label">분류 확인</span><div class="axe-info-chips"><button type="button" data-info-filter="primary" data-info-value="분류 확인 필요" class="${group==='분류 확인 필요'?'is-active':''}" aria-pressed="${group==='분류 확인 필요'?'true':'false'}">분류 미확인<small>${unclassifiedCount}</small></button></div></div>`;
  }
  shown=shown.filter(row=>modbookGroups(row).includes(group));
  const types=['접두','접미'].filter(type=>shown.some(row=>row.type===type));
  const type=types.includes(secondary)?secondary:types[0];
  if(types.length>1)controls+=chipRow('개조 위치','secondary',types,type,shown,row=>row.type,{modbook:true});
  shown=shown.filter(row=>row.type===type);
  const categories=group==='분류 확인 필요'?['분류 미확인']:
   MODBOOK_GROUPS[group].filter(category=>shown.some(row=>modbookCategories(row).includes(category)));
  const category=categories.includes(info.modbookCategory)?info.modbookCategory:categories[0];
  if(categories.length>1)controls+=chipRow('세부 분류','modbookCategory',categories,category,shown,modbookCategories,{modbook:true});
  if(group!=='분류 확인 필요')shown=shown.filter(row=>modbookCategories(row).includes(category));
  heading=`개조서 · ${group} · ${type||''}${group==='분류 확인 필요'?'':` · ${category||''}`}`;
 }
 return {rows:shown,controls,selectedSkill:chosenSkill,table,heading,countNote};
}

const matchText=(values,q)=>values.flat(Infinity).filter(value=>value!==null&&value!==undefined).join(' ').toLocaleLowerCase('ko').includes(q);
// Return a single navigable result for each recipe; craft ingredients remain searchable by craft name.
export function searchInformation(data,query,info={},owner=false){
 const q=String(query||'').trim().toLocaleLowerCase('ko');
 if(!q)return [];
 const crafts=visibleRows(data,'info_crafts',info,owner);
 const recipes=visibleRows(data,'info_material_recipes',info,owner);
 const materials=visibleRows(data,'info_craft_materials',info,owner);
 const results=[];
 for(const row of crafts){
  const group=craftGroup(row);
  const recipe=group==='무기부품'?recipes.find(item=>String(item.item_name)===String(row.item_name)):null;
  if(recipe)continue; // the combination result includes the linked craft and ingredients
  const ingredients=materials.filter(item=>String(item.craft_id)===String(row.id));
  if(matchText([Object.values(row),ingredients.map(item=>[item.material_name,item.quantity])],q))
   results.push({table:'info_crafts',row,group,primary:craftSubtype(row),secondary:'',path:['제작법',group,craftSubtype(row)].filter((value,index)=>index<2||!['부품·원재료','무기부품'].includes(group)),title:itemName('info_crafts',row,data)});
 }
 for(const row of recipes){
  const craft=crafts.find(item=>String(item.item_name)===String(row.item_name));
  const ingredients=craft?materials.filter(item=>String(item.craft_id)===String(craft.id)):[];
  if(matchText([Object.values(row),craft?Object.values(craft):[],ingredients.map(item=>[item.material_name,item.quantity])],q))
   results.push({table:'info_material_recipes',row,group:'무기부품',primary:'',secondary:'',path:['제작법','무기부품'],title:itemName('info_material_recipes',row,data)});
 }
 for(const table of ['info_processes','info_quests','info_skill_ranks']){
  for(const row of visibleRows(data,table,info,owner)){
   if(!matchText(Object.values(row),q))continue;
   const group=table==='info_processes'?productionGroup(row):table==='info_quests'?filterName(row.job):skillGroup(row.skill);
   const primary=table==='info_skill_ranks'?group:table==='info_quests'?filterName(row.job):productionGroup(row);
   const secondary=table==='info_skill_ranks'?filterName(row.skill):'';
   results.push({table,row,group,primary,secondary,path:[CONFIG[table][0],showFilterName(group)],title:itemName(table,row,data)});
  }
 }
 for(const row of visibleRows(data,'modbook_catalog',info,owner)){
  // One search result per original row even when its category covers multiple fields.
  if(!matchText([row.name,row.type,row.category,row.parts,row.option1,row.option2,row.option3,row.note,row.price_note],q))continue;
  const group=modbookGroups(row)[0];
  const category=group==='분류 확인 필요'?'':modbookCategories(row).find(value=>MODBOOK_GROUPS[group].includes(value))||'';
  results.push({table:'modbook_catalog',row,group,primary:group,secondary:row.type||'',modbookCategory:category,path:['개조서',group,row.type,category].filter(Boolean),title:String(row.name||'이름 없음')});
 }
 return results;
}

export function renderInfoPage(state,{standalone=false}={}){
 const info=state.info||{},owner=Boolean(state.platformAdmin);
 // Stale company-specific rows must never survive a company/account switch.
 const data=info.companyId&&String(info.companyId)!==String(state.companyId)?{...(info.data||{}),modbook_catalog:[]}:(info.data||{});
 const requestedTable=CONFIG[info.table]?info.table:'info_crafts';
 const tabTable=['info_craft_materials','info_material_recipes'].includes(requestedTable)?'info_crafts':requestedTable;
 const q=String(info.query||'').trim();
 const searching=Boolean(q);
 const categories=TOP_TABS.map(([key,label])=>{
  return `<button type="button" data-info-table="${key}" class="${!searching&&tabTable===key?'is-active':''}" aria-current="${!searching&&tabTable===key?'true':'false'}">${infoTabIcon(key)}<span>${escapeText(label)}</span></button>`;
 }).join('');
 const filters=searching?null:categoryFilters(tabTable,info,data,owner);
 const matches=searching?searchInformation(data,q,info,owner):[];
 const table=searching?'':filters.table;
 const rows=searching?matches:filters.rows;
 const selected=searching?null:rows.find(row=>String(row.id)===String(info.selectedId||''))||null;
 const detailTitle=selected?itemName(table,selected,data):'';
 const existingFields=selected?(table==='info_material_recipes'?weaponPartDetails(selected,data,info,owner):detailFields(table,selected,data,info,owner)):'';
 const detailHeading=selected?`<header><span>상세 정보${table==='modbook_catalog'&&['접두','접미'].includes(selected.type)?` <span class="axe-info-type-badge axe-info-type-badge--${selected.type==='접두'?'prefix':'suffix'}">${modbookIcon(selected.type)}${escapeText(selected.type)}</span>`:''}</span><strong>${escapeText(detailTitle)}</strong>${selected.is_active===false||selected.active===false?'<em>비활성</em>':''}</header>`:'';
 // Detail density is based ONLY on the selected record's existing visible DB fields.
 // Sparse rows leave room for the scene; data-heavy rows gain columns and a shorter art header.
 const visibleFieldCount=(existingFields.match(/<dt>/g)||[]).length;
 const longestField=Array.from(existingFields.matchAll(/<dd>([\s\S]*?)<\/dd>/g),match=>match[1].replace(/<[^>]*>/g,'').length).reduce((max,n)=>Math.max(max,n),0);
 const detailDensity=visibleFieldCount<=4?'sparse':visibleFieldCount<=8?'regular':visibleFieldCount<=14?'dense':'extended';
 const detailOverflow=longestField>160?' game-detail--long-copy':'';
 const details=selected?`<section class="axe-info-detail${standalone?' axe-info-detail--studio game-detail--'+detailDensity+detailOverflow:''}" aria-label="상세 정보">${standalone?`<div class="game-detail-hero">${detailHeading}</div>${standaloneDetailSections(existingFields,table)}`:`${detailHeading}<dl>${existingFields}</dl>`}</section>`:`<section class="axe-info-detail axe-info-detail--empty" aria-label="상세 정보"><span class="axe-info-detail__eyebrow">상세 정보</span><div class="axe-info-detail__placeholder"><span class="axe-info-detail__placeholder-mark" aria-hidden="true">◇</span><strong>${searching?'검색 결과를 선택해 주세요':'정보를 선택해 주세요'}</strong><p>왼쪽 목록에서 항목을 선택하면<br>상세 정보가 여기에 표시됩니다.</p></div></section>`;
 const rowList=rows.length?rows.map(entry=>{
  if(searching){
   const {table:source,row,group,primary,secondary,path,title,modbookCategory}=entry;
   return `<button type="button" class="axe-info-row axe-info-row--search${standalone?' axe-info-row--studio':''}" data-info-result-table="${escapeText(source)}" data-info-result-id="${escapeText(row.id)}" data-info-result-group="${escapeText(group)}" data-info-result-primary="${escapeText(primary)}" data-info-result-secondary="${escapeText(secondary)}" data-info-result-modbook-category="${escapeText(modbookCategory||'')}">${standalone?listDecor(source,title,path.join(' › '),true):`<strong>${escapeText(title)}</strong><span class="axe-info-row__path">${escapeText(path.join(' › '))}</span>`}${row.is_active===false||row.active===false?'<em>비활성</em>':''}</button>`;
  }
  const id=String(entry.id),active=id===String(info.selectedId||'');
  const title=filters.selectedSkill&&table==='info_skill_ranks'?String(entry.rank||'미지정'):itemName(table,entry,data);
  return `<button type="button" class="axe-info-row ${active?'is-active':''}${standalone?' axe-info-row--studio':''}" data-info-id="${escapeText(id)}" aria-pressed="${active?'true':'false'}">${standalone?listDecor(table,title,itemListSubtitle(table,entry)):`<strong>${escapeText(title)}</strong>`}${entry.is_active===false||entry.active===false?'<em>비활성</em>':''}</button>`;
 }).join(''):`<p class="axe-info-empty">${!searching&&tabTable==='info_skill_ranks'&&!filters.selectedSkill?'세부 스킬을 선택해 주세요.':searching?'전체 정보에서 검색 결과가 없습니다.':'조건에 맞는 정보가 없습니다.'}</p>`;
 const ownerNote=owner?'<span class="axe-info-owner-note">조회 전용 · 관리자 편집 기능은 준비 중</span>':'';
 const error=info.error?`<div class="axe-info-error">${escapeText(info.error)} <button type="button" data-action="info-refresh">다시 불러오기</button></div>`:'';
 const modbookError=info.modbookError&&(tabTable==='modbook_catalog'||searching)?`<div class="axe-info-error">개조서 조회 실패: ${escapeText(info.modbookError)} <button type="button" data-action="info-refresh">다시 불러오기</button></div>`:'';
 return `<section class="axe-info"><header class="axe-info-header"><div><span class="page-eyebrow">LAC HUB / INFORMATION</span><h1>게임 정보</h1><p>제작법 · 생산 · 퀘스트 · 스킬 · 현재 회사 개조서를 찾아보세요.</p></div>${standalone?'':'<button type="button" class="ops-action-secondary" data-action="info-refresh">새로고침</button>'}</header><div class="axe-info-toolbar"><input type="search" data-info-query placeholder="제작법 · 생산 · 퀘스트 · 스킬 · 개조서 전체 검색" value="${escapeText(info.query||'')}" aria-label="게임 정보 전체 검색">${searching?'<span class="axe-info-search-hint">전체 정보 검색 중</span>':''}${owner?`<label><input type="checkbox" data-info-inactive ${info.showInactive?'checked':''}> 비활성 포함</label>`:''}</div><nav class="axe-info-tabs" aria-label="게임 정보 종류">${categories}</nav>${!searching&&filters.controls?`<div class="axe-info-subfilters">${filters.controls}</div>`:''}${error}${modbookError}${info.loading?'<div class="runtime-inline-loading">게임 정보를 불러오는 중…</div>':!info.loaded?`<div class="runtime-inline-loading">${standalone?'게임 정보를 불러오지 못했습니다. HUB 메인으로 돌아갔다가 다시 접속해 주세요.':'정보를 불러오려면 새로고침을 눌러 주세요.'}</div>`:`<div class="axe-info-content"><div class="axe-info-list"><div class="axe-info-list__heading"><span>${searching?'전체 검색 결과':escapeText(filters.heading)}</span><small>${searching?`${rows.length}건`:escapeText(filters.countNote||`${rows.length}건`)}</small></div><div class="axe-info-list__items">${rowList}</div></div>${details}</div>${ownerNote}`}</section>`;
}
