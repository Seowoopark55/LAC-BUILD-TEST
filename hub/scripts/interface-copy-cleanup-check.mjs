import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../src/styles/layout.css',import.meta.url),'utf8');
const management=fs.readFileSync(new URL('../src/styles/management.css',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/settings.css',import.meta.url),'utf8');
const fund=fs.readFileSync(new URL('../src/styles/fund.css',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[]; const expect=(label,ok)=>checks.push([label,Boolean(ok)]);
expect('web package version',pkg.version==='1.7.41-web-ui.79');
expect('compact page header supported',render.includes("page-header${compact?' page-header--compact':''}")&&layout.includes('.page-header.page-header--compact'));
expect('operational page header descriptions removed',
  render.includes("pageHeader('MEMBERS','멤버 관리',''")&&
  render.includes("pageHeader('ASSETS','자산 관리','','')")&&
  render.includes("pageHeader('ACCOUNTS','계좌 관리','','')")&&
  render.includes("pageHeader('COMPANY SETTINGS','회사 설정',''")&&
  render.includes("pageHeader('PLATFORM OWNER','서비스 관리',''")&&
  render.includes("pageHeader('SUPPORT','질문게시판',''")&&
  render.includes("pageHeader('PRIVATE SUPPORT','건의게시판',''")
);
expect('management summary helper lines removed',render.includes('ops-mgmt-summary ops-mgmt-summary--clean')&&!render.includes('<small>${esc(sub)}</small>'));
expect('fund top copy cleaned',!render.includes('회사 자금의 수입·지출·납부·잔액을 한곳에서 관리합니다.')&&!render.includes('공용계좌 기준')&&!render.includes('승인 + 직접 등록')&&!render.includes('회사 운영 지출'));
expect('fund subview redundant descriptions removed',!render.includes('필요한 정보만 빠르게 확인하고, 상세 작업은 행에서 바로 처리합니다.')&&!render.includes('Discord에서 제출된 주간 공금 납부 신청만 검수합니다.')&&!render.includes('웹 계산 잔액과 게임 내 실제 잔액을 비교합니다.')&&!render.includes('월별 주간 공금 기준과 기본 등록 계좌를 관리합니다.'));
expect('fund fee remains meaningful data',render.includes('<p>주간 공금 ${money(fee)}</p>'));
expect('member redundant row and workflow helper removed',!render.includes("회사 별칭 사용':'Discord 표시명")&&!render.includes('멤버 등록 → 팀원 로그인 → 자동 연결'));
expect('asset redundant holder helper removed',!render.includes("현재 보유자':'배정 대기"));
expect('account redundant workflow copy removed',!render.includes('등록 상태와 변경 요청을 한곳에서 확인합니다.')&&!render.includes('계좌 변경은 신청 → 검수 방식')&&!render.includes('최근 요청 ${pendingPreview.length}건을 우선 표시합니다.'));
expect('settings overview helper smalls removed',!render.includes('<small>회사 단위 설정</small>')&&!render.includes('<small>활성 기능</small>')&&!render.includes('<small>Discord 관리자 역할</small>'));
expect('settings tab subtitles removed',!render.includes('회사·Discord 공통 값')&&!render.includes('기능별 채널 · 사용 여부')&&!render.includes('회사별 주문 품목 · 가격'));
expect('basic setting row microcopy removed',render.includes("settingRow('회사 이름','',")&&render.includes("settingRow('관리자 역할','',")&&render.includes("settingRow('일반 멤버 역할','',")&&render.includes("settingRow('Discord 서버',connected?'':'BOT 연결 시 기본 운영 권한을 한 번에 승인합니다.',"));
expect('meaningful module descriptions retained',render.includes("fund:{name:'공금',desc:'납부 현황 · 검수 · 공금 관리'")&&render.includes('<small>${esc(ui.desc)}</small>'));
expect('state-critical onboarding guidance retained',render.includes('Discord 역할·채널 정보를 불러오는 중입니다.')&&render.includes('기존 Discord 연결을 안전하게 정리 중입니다.'));
expect('suggestion privacy notice retained',render.includes('suggestion-private-banner')&&render.includes('같은 회사의 대표·관리자·멤버도 다른 사람이 작성한 건의를 볼 수 없습니다.'));
expect('clean density css present',management.includes('operational copy cleanup')&&settings.includes('settings copy cleanup')&&fund.includes('fund copy cleanup'));
let failed=0; for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`); if(!ok) failed++;}
console.log(`Interface copy cleanup: ${checks.length-failed}/${checks.length} PASS`); if(failed) process.exit(1);
