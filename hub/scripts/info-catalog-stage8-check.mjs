import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryFilters,searchInformation,renderInfoPage} from '../src/ui/infoPage.js';
const mk=(id,type,category,name,parts='철주괴')=>({id:String(id),company_id:'A',type,category,name,parts,option1:'옵션',active:true});
const rows=[
 mk(1,'접두','SMG, 피스톨, 라이플','복합 총기'),
 mk(2,'접미','근접무기, 채광','복합 분야'),
 mk(3,'접미','접미','차분한','SMG, 라이플'),
 mk(4,'접두','접두','불명확한','철주괴, 동주괴'),
 mk(5,'접두','피스톨','일반 개조서'),
];
const info={table:'modbook_catalog',filterPrimary:'무기',filterSecondary:'접미',modbookCategory:'SMG',selectedId:'3',query:'',loaded:true,loading:false,companyId:'A',data:{modbook_catalog:rows}};
const app=(over={},companyId='A')=>renderInfoPage({companyId,platformAdmin:false,info:{...info,...over}});
const browse=(group,type,cat)=>categoryFilters('modbook_catalog',{...info,filterPrimary:group,filterSecondary:type,modbookCategory:cat},info.data,false).rows.map(row=>row.id);
const tests=[
 ['both explicit compound categories appear under their correct chips',browse('무기','접두','SMG').includes('1')&&browse('무기','접두','피스톨').includes('1')&&browse('생활','접미','채광').includes('2')&&browse('무기','접미','근접무기').includes('2')],
 ['legacy generic category with explicit recognized parts labels appears in both weapon chips',browse('무기','접미','SMG').includes('3')&&browse('무기','접미','라이플').includes('3')],
 ['recognized composite / inferred rows are not listed as unclassified',!browse('분류 확인 필요','접미','').includes('2')&&!browse('분류 확인 필요','접미','').includes('3')],
 ['ambiguous legacy part labels stay in the exception instead of guessing',browse('분류 확인 필요','접두','').join(',')==='4'],
 ['global search does not duplicate a multi-category item',searchInformation(info.data,'차분한',info,false).length===1&&searchInformation(info.data,'복합 분야',info,false).length===1],
 ['derived categories are visibly marked as provisional, original stored category is not rewritten',app().includes('부품 표기 기준 · 분류 확인 필요')&&rows[2].category==='접미'],
 ['weapon, life and combat category symbols rendered as small SVGs',app({filterSecondary:'접두',modbookCategory:'SMG'}).includes('axe-info-chip-icon')&&app({filterSecondary:'접두',modbookCategory:'SMG'}).includes('data-info-value="전투"')===false],
 ['prefix blue and suffix red hooks appear with the correct selection',app().includes('axe-info-chip--prefix')&&app().includes('axe-info-chip--suffix')&&app().includes('axe-info-type-badge--suffix')],
 ['no company B row leakage after company switch',!app({},'B').includes('차분한')],
 ['existing modbook RLS/API integration unchanged',readFileSync('src/lib/productApi.js','utf8').includes(".eq('company_id', id)")],
 ['CSS colors scoped to modbook chip classes',readFileSync('src/styles/info.css','utf8').includes('.axe-info-subfilter--modbook .axe-info-chips>button.axe-info-chip--prefix.is-active')],
];
let passed=0;
for(const [label,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(ok)passed++;}
assert.equal(passed,tests.length,`${passed}/${tests.length}`);
console.log(`LAC ONE INFO STAGE 8: ${passed}/${tests.length} PASS (synthetic only)`);
