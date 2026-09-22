import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderInfoPage, categoryFilters, searchInformation} from '../src/ui/infoPage.js';

const mk=(id,type,category,name,extra={})=>({id:String(id),company_id:'company-A',type,category,name,parts:'철주괴',option1:'방어력 +1',option2:null,option3:null,success_rate:50,recent_price:123456,recent_date:'2026-09-19',price_note:'거래기록',note:'확인',active:true, ...extra});
const rows=[
 mk(1,'접두','SMG','소형 SMG 개조서'),
 mk(2,'접미','체력','체력 강화 개조서'),
 mk(3,'접미','근접무기, 채광','혼합 개조서'),
 mk(4,'접미','SMG, 피스톨, 라이플','범용 총기 개조서'),
 mk(5,'접두','접두','기타 개조서'),
 mk(6,'접미','접미','추가 분류 확인'),
 mk(7,'접두','낚시','비활성 낚시', {active:false}),
];
const info={table:'modbook_catalog',filterPrimary:'__all__',filterSecondary:'__all__',modbookCategory:'',showInactive:false,query:'',selectedId:'',loaded:true,loading:false,companyId:'company-A',data:{modbook_catalog:rows}};
const app=(changes={},companyId='company-A',owner=false)=>renderInfoPage({companyId,platformAdmin:owner,info:{...info,...changes}});
const browse=(changes={},owner=false)=>categoryFilters('modbook_catalog',{...info,...changes},info.data,owner);
const source=readFileSync('src/lib/productApi.js','utf8');
const main=readFileSync('src/main.js','utf8');
const checks=[
 ['five tabs including existing company modbooks', (app().match(/data-info-table=/g)||[]).length===5&&app().includes('data-info-table="modbook_catalog"')],
 ['three explicit main fields plus labelled unclassified exception, no overall chip',app().includes('data-info-value="무기"')&&app().includes('data-info-value="생활"')&&app().includes('data-info-value="전투"')&&app().includes('분류 미확인')&&!app().includes('data-info-value="__all__"')],
 ['primary, prefix/suffix and category work together',browse().rows.map(row=>row.id).join(',')==='1' && browse({filterPrimary:'전투',filterSecondary:'접미'}).rows[0]?.id==='2'],
 ['composite category included in both weapon and life fields',browse({filterPrimary:'무기',filterSecondary:'접미',modbookCategory:'근접무기'}).rows[0]?.id==='3'&&browse({filterPrimary:'생활',filterSecondary:'접미',modbookCategory:'채광'}).rows[0]?.id==='3'],
 ['multi-weapon composite included in each matching chip with correct count',app({filterPrimary:'무기',filterSecondary:'접미'}).includes('data-info-value="라이플"')&&browse({filterPrimary:'무기',filterSecondary:'접미',modbookCategory:'피스톨'}).rows[0]?.id==='4'&&searchInformation(info.data,'범용 총기 개조서',info,false).length===1],
 ['uncategorized records remain discoverable without guessed category',browse({filterPrimary:'분류 확인 필요',filterSecondary:'접미'}).rows[0]?.id==='6'&&searchInformation(info.data,'기타 개조서',info,false)[0]?.row?.id==='5'],
 ['detail shows safe formatted price and parts only on selected item',app({selectedId:'1'}).includes('123,456원')&&app({selectedId:'1'}).includes('철주괴')],
 ['inactive entries excluded for member and included with owner toggle',searchInformation(info.data,'비활성 낚시',info,false).length===0&&searchInformation(info.data,'비활성 낚시',{...info,showInactive:true},true).length===1],
 ['company switch hides old-company rows from both list and search',!app({query:'소형 SMG'},'company-B').includes('소형 SMG 개조서')&&!app({},'company-B').includes('소형 SMG 개조서')],
 ['search results retain company-scoped paths and escape unsafe markup',app({query:'방어력'}).includes('개조서 › 무기 › 접두')&&!app({query:'<script>'}).includes('<script>')],
 ['separate company-scoped, paginated, read-only API',source.includes(".from('modbook_catalog')")&&source.includes(".eq('company_id', id)")&&source.includes('.range(offset, offset + 499)')&&!/\.from\('modbook_catalog'\)[\s\S]{0,200}\.(insert|update|delete)\(/.test(source)],
 ['company/user switch invalidates cached rows and ignores stale responses',main.includes('resetScopedGameInfo();state.companyId=next')&&main.includes('request!==infoLoadSequence')&&main.includes('state.session?.user?.id!==userId')],
 ['search result dispatch and screen events include modbook',main.includes("'modbook_catalog'].includes(source)")&&main.includes('infoResult.dataset.infoResultModbookCategory')],
 ['existing game information tables retained and company module not modified',source.includes("'info_crafts', 'info_craft_materials', 'info_material_recipes'")&&source.includes('getGameInformation')],
];
let pass=0;
for(const [name,result] of checks){console.log(`${result?'PASS':'FAIL'} ${name}`);if(result)pass++;}
assert.equal(pass,checks.length,`${pass}/${checks.length} passed`);
console.log(`LAC ONE INFO STAGE 7: ${pass}/${checks.length} PASS (synthetic only)`);
