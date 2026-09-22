// LAC HUB Phase 8: independent compact viewport regression checks.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const src=new URL('../src/', import.meta.url);
const imports=readFileSync(new URL('styles.css',src),'utf8');
const css=readFileSync(new URL('styles/game-center-compact.css',src),'utf8');
assert.equal(imports.match(/game-center-compact\.css/g)?.length,1);
for(const rule of ['min-height: 700px','min-width: 901px','height: calc(100dvh - 12px)','overflow-y: hidden','axe-info-list__items','axe-info-detail','overscroll-behavior: contain','max-height: 699px','overflow-y: auto']) assert.ok(css.includes(rule),rule);
assert.ok(css.includes('.runtime-app--game-info.game-center'));
assert.ok(!css.includes('.company-console'));
console.log('PHASE 8 PASS: standalone compact desktop, independently scrollable list/detail, short-viewport fallback, old company UI unaffected.');
