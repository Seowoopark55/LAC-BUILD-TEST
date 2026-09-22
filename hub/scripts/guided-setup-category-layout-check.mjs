import fs from 'node:fs';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/ui/render.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/discord/setup/channels.js',import.meta.url),'utf8');
const checks=[
  ['three recommended categories exist in UI', ['LAC ONE · 무법지대','LAC ONE · 회사운영','LAC ONE · 편의기능'].every(v=>render.includes(v))],
  ['live plan maps channels to category names', main.includes("categoryName:setupGuideChannelCategory('ammo3')")&&main.includes("categoryName:setupGuideChannelCategory('accountLookup')")&&main.includes("categoryName:setupGuideChannelCategory('cooking')")],
  ['quick create sends per-channel category', main.includes('category_name:row.categoryName')],
  ['API accepts per-channel category name', api.includes("category_name: cleanName(item?.category_name, categoryName)")],
  ['API caps automatic categories at three', api.includes('const MAX_CATEGORIES = 3')],
  ['API returns category collection', api.includes('categories: categoryResults')],
  ['recommended category order is explicit', api.includes("['LAC ONE · 무법지대', 'LAC ONE · 회사운영', 'LAC ONE · 편의기능']")],
  ['outlaw cluster order keeps pinball before record', main.indexOf("key:'pinball'") < main.indexOf("key:'outlaw'")],
  ['legacy single-category payload remains supported', api.includes("cleanName(req.body?.category_name, 'LAC ONE')")],
  ['category is presentation only; channel binding stays key/id based', main.includes('persistSetupGuideChannels(map)')&&!main.includes('parent_id:row.categoryName')],
];
let pass=0;
for(const [label,ok] of checks){ console.log(`${ok?'PASS':'FAIL'} ${label}`); if(ok)pass++; }
if(pass!==checks.length){ console.error(`Guided setup category layout: ${pass}/${checks.length} PASS`); process.exit(1); }
console.log(`Guided setup category layout: ${pass}/${checks.length} PASS`);
