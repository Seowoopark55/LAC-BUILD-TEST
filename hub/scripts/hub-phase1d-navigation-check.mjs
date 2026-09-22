import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderShell } from '../src/ui/render.js';
import { initializePrimaryScreenHistory, recordPrimaryScreen, readPrimaryScreen } from '../src/platform/screenHistory.js';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/layout.css', import.meta.url), 'utf8');
assert.match(main, /if\(pageBtn\).*?navigatePrimaryScreen\(pageBtn\.dataset\.page\)/);
assert.match(main, /if\(action==='dashboard-jump'\)[\s\S]*?navigatePrimaryScreen\(page\)/);
assert.match(main, /window\.addEventListener\('popstate',[\s\S]*?state\.page = allowedHistoryPage\(target\)/);
assert.match(main, /installPrimaryScreenHistory\(\);[\s\S]*?await refreshAll\(\);/);
assert.match(main, /state\.page = allowedHistoryPage\(state\.page\);/);
assert.doesNotMatch(index, /OPERATIONS CONSOLE/);
assert.match(render, /<strong>\$\{platformScreen\?'서비스 관리':'회사 관리'\}<\/strong>\$\{platformScreen\?/);
assert.match(css, /font-size:calc\(23px \* var\(--lac-type-scale, 1\)\)/);
const base = { envReady:true, session:{user:{id:'1'}}, ready:false, page:'dashboard', companies:[{id:'c1'}], companyId:'c1', error:'',notice:'' };
const element={innerHTML:''};renderShell(element,base);
assert.match(element.innerHTML,/runtime-auth--startup/);
assert.doesNotMatch(element.innerHTML,/class="workspace-shell"/);
// Newly opened authenticated page first paints only the neutral HUB loading screen.
const mock = { state:null, replaceState(next){this.state=next;},pushState(next){this.state=next;} };
assert.equal(initializePrimaryScreenHistory(mock),'hub');
for(const page of ['dashboard','fund','members','assets','accounts','settings','info','questions','suggestions','platform','layout','company-start']){
  recordPrimaryScreen(mock,page);assert.equal(readPrimaryScreen(mock.state),page);
}
console.log('HUB phase 1D navigation: PASS (category routes, startup gate, company branding).');
