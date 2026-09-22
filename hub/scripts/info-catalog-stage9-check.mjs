import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryFilters, searchInformation, renderInfoPage} from '../src/ui/infoPage.js';

const mk=(id,type,category,name,parts,option1,option2)=>({id:String(id),company_id:'company-A',type,category,name,parts,option1,option2,option3:null,active:true});
const rows=[
  mk(1,'접미','접미','돌판의','하의','채집 배고픔 감소 (5%~10%)','채집 목마름 감소 (5%~10%)'),
  mk(2,'접미','접미','냄비의','겉옷/단독상의, 신발','요리 2배 획득 확률','요리시간 감소'),
  mk(3,'접두','접두','분류 불명','철주괴','방어력 강화',null),
  mk(4,'접미','SMG, 피스톨','복합 총기','기타 부품','요리 경험치 +1',null),
  mk(5,'접미','접미','복합 효과','철주괴','채집 경험치 +1','요리시간 감소'),
  mk(6,'접미','접미','부품 기반','SMG, 라이플','요리시간 감소',null),
];
const info={table:'modbook_catalog',filterPrimary:'생활',filterSecondary:'접미',modbookCategory:'채집',selectedId:'1',query:'',loaded:true,loading:false,companyId:'company-A',data:{modbook_catalog:rows}};
const browse=(group,type,category)=>categoryFilters('modbook_catalog',{...info,filterPrimary:group,filterSecondary:type,modbookCategory:category},info.data,false).rows.map(row=>row.id);
const page=(changes={},companyId='company-A')=>renderInfoPage({companyId,platformAdmin:false,info:{...info,...changes}});
const tests=[
 ['돌판의 is listed in 생활 / 접미 / 채집',browse('생활','접미','채집').includes('1')],
 ['냄비의 is listed in 생활 / 접미 / 요리',browse('생활','접미','요리').includes('2')],
 ['both verified cases disappear from unclassified',!browse('분류 확인 필요','접미','').includes('1')&&!browse('분류 확인 필요','접미','').includes('2')],
 ['uncertain effects stay unclassified',browse('분류 확인 필요','접두','').includes('3')],
 ['explicit categories override option words',browse('무기','접미','SMG').includes('4')&&browse('무기','접미','피스톨').includes('4')&&!browse('생활','접미','요리').includes('4')],
 ['two explicit effect categories are shown without duplicating the source row',browse('생활','접미','채집').includes('5')&&browse('생활','접미','요리').includes('5')&&searchInformation(info.data,'복합 효과',info,false).length===1],
 ['fully recognized parts take precedence over options',browse('무기','접미','SMG').includes('6')&&browse('무기','접미','라이플').includes('6')&&!browse('생활','접미','요리').includes('6')],
 ['category chip count reflects derived entries',page().includes('data-info-value="채집"')&&page().includes('data-info-value="요리"')],
 ['the detail labels effect-based classification transparently',page().includes('옵션 효과 기준 · 원본 분류값은 변경되지 않음')],
 ['company switch hides cached modbooks',!page({},'company-B').includes('돌판의')],
 ['no new database writes in display-only changes',!readFileSync('src/ui/infoPage.js','utf8').includes(".from('modbook_catalog').update(")],
];
let pass=0;
for(const [name,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)pass++;}
assert.equal(pass,tests.length,`${pass}/${tests.length} checks`);
console.log(`LAC ONE INFO STAGE 9: ${pass}/${tests.length} PASS (synthetic only)`);
