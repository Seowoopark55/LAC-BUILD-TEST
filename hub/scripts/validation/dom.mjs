import {renderShell} from '../../src/ui/render.js';import {fixture,cases} from '../../tests/validation/fixtures.mjs';import fs from 'node:fs';import path from 'node:path';import {out,finish} from './common.mjs';
// Render the REAL production renderer. Browser contract assertions consume these same cases.
const checks=[];for(const [name,patch] of cases){try{const host={innerHTML:''};renderShell(host,fixture(patch));fs.writeFileSync(path.join(out,`render-${name}.html`),host.innerHTML);checks.push({name,ok:host.innerHTML.includes('runtime-app')&&!host.innerHTML.includes('관리 권한이 필요합니다.')});}catch(e){checks.push({name,ok:false,error:e.stack});}}
finish('renderer-fixtures',checks,{scope:'Executed renderer; full DOM/CSS contracts are in browser.mjs, not this smoke test.'});
