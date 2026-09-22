import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = (p) => fs.readFileSync(p, 'utf8');
for (const p of ['index.html','src/main.js','src/ui/render.js','src/ui/infoPage.js',
  'api/discord/setup/channels.js','api/support/notify.js','api/suggestions/notify.js']) {
  assert.doesNotMatch(read(p), /LAC ONE|AXE HUB|AXE ONE(?!\s*\d)/, `${p}: old customer-visible brand`);
}
const html = read('index.html');
assert.match(html, /<title>LAC HUB<\/title>/);
assert.match(html, /content="LAC HUB"/);
assert.match(read('src/ui/render.js'), /<strong>LAC HUB<\/strong>/);
assert.match(read('src/main.js'), /회사 관리 멤버 등록 요청/);
assert.match(read('api/discord/setup/channels.js'), /'LAC HUB'/);
assert.match(read('public/icons/lac-one.svg'), /aria-label="LAC HUB"/);
assert.match(read('src/ui/layoutStudio.js'), /lac_one_table_type_scale_v1/);
assert.match(read('src/main.js'), /lac_one_pending_create_code/);
assert.match(read('src/lib/supabase.js'), /schema: 'axe_product'/);
assert.match(read('src/styles.css'), /lac-one-shell-clean\.png/);
assert.match(read('src/styles/access-gate.css'), /lac-one-login-calm\.png/);
console.log('PASS: LAC HUB public branding; existing login, table studio, wallpaper and DB identifiers preserved');
