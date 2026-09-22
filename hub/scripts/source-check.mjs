import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function walkIfExists(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walkIfExists(full) : [full];
  });
}
const files = [
  ...walkIfExists(path.join(root,'src')),
  ...walkIfExists(path.join(root,'api')),
  ...walkIfExists(path.join(root,'server')),
].filter((f)=>/\.(js|css|html)$/.test(f));
const failures=[];
const forbidden=[
  ['NEW AXE NET schema reference', /new_axe_net/i],
  ['AXE HUB public profile query', /\.from\(\s*['"]profiles['"]\s*\)/],
  ['AXE HUB public builds query', /\.from\(\s*['"]builds['"]\s*\)/],
  ['server master key reference', /SUPABASE_SERVICE_ROLE_KEY/],
  ['hardcoded JWT-like secret', /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/],
];
for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  for(const [label,pattern] of forbidden) if(pattern.test(text)) failures.push(`${label}: ${path.relative(root,file)}`);
}
const supabaseFile=path.join(root,'src','lib','supabase.js');
const supabaseText=fs.readFileSync(supabaseFile,'utf8');
if(!/schema:\s*['"]axe_product['"]/.test(supabaseText)) failures.push('Supabase client is not locked to axe_product schema.');
for(const relative of ['api/discord/start.js','api/discord/callback.js','api/discord/complete.js']) if(!fs.existsSync(path.join(root,relative))) failures.push(`missing Discord API route: ${relative}`);
const productApiText=fs.readFileSync(path.join(root,'src','lib','productApi.js'),'utf8');
for(const requiredTable of ['discord_guild_channels','discord_guild_roles','discord_company_config']) if(!productApiText.includes(requiredTable)) failures.push(`missing Discord catalog integration: ${requiredTable}`);
if(failures.length){
  console.error('LAC ONE SOURCE CHECK: FAIL');
  failures.forEach(f=>console.error(` - ${f}`));
  process.exit(1);
}
console.log('LAC ONE SOURCE CHECK: PASS');
console.log(`Checked ${files.length} source files.`);
console.log(' - axe_product schema lock: PASS');
console.log(' - no NEW AXE NET / HUB app-table reference: PASS');
console.log(' - no server master key dependency: PASS');
console.log(' - Discord OAuth API routes: PASS');
console.log(' - Discord catalog/mapping integration: PASS');
