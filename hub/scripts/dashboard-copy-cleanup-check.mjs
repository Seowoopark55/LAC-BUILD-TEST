import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles/pages.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[]; const expect=(label,ok)=>checks.push([label,Boolean(ok)]);
expect('web package version',pkg.version==='1.7.41-web-ui.79');
expect('dashboard metrics have label and value only',!render.includes('현재 재직 기준')&&!render.includes('공금 원장 기준')&&!render.includes('개 미배정`')&&!render.includes("state.discordConnection?.guild_name||'서버 연결 정상'"));
expect('metric markup no helper small',render.includes('metrics.map(([label,value,page])')&&render.includes('<strong>${esc(value)}</strong></button>`).join'));
expect('all-clear duplicate helper removed',render.includes('급한 운영 항목이 없습니다.')&&!render.includes('운영 상태가 안정적입니다.'));
expect('quick action helpers removed',!render.includes('수입 · 지출 추가')&&!render.includes('권한 · 재직 상태')&&!render.includes('배정 · 반납 관리')&&!render.includes('등록 · 변경 검수'));
expect('activity redundant footer removed',!render.includes('최근 운영 기록 최대 4건'));
expect('operations redundant helper copy removed',!render.includes('연결과 사용 기능을 한곳에서 확인'));
expect('dashboard no longer repeats guild name below connected state',!render.includes("<small>${esc(state.discordConnection?.guild_name||'서버 연결 필요')}</small>"));
expect('meaningful activity metadata retained',render.includes('<small>${esc(row.meta)}</small>'));
expect('action-item descriptions retained',render.includes('<small>${esc(item.desc)}</small>'));
expect('hero operational status retained',render.includes('<p>${esc(statusCopy)}</p>'));
expect('metrics vertically tightened',css.includes('.axe-dashboard-metrics button{min-height:60px'));
let failed=0; for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`); if(!ok) failed++;}
console.log(`Dashboard copy cleanup: ${checks.length-failed}/${checks.length} PASS`); if(failed) process.exit(1);
