import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const ok = (name, pass) => { checks.push([name, Boolean(pass)]); };

const security = read('server/discordSecurity.js');
const reapprove = read('api/discord/reapprove.js');
const callback = read('api/discord/callback.js');
const api = read('src/lib/productApi.js');
const main = read('src/main.js');
const render = read('src/ui/render.js');
const css = read('src/styles.css');

ok('reapproval endpoint exists', reapprove.includes("permission-reapproval"));
ok('reapproval accepts canonical UUID company ids', reapprove.includes("[89ab][0-9a-f]{3}-[0-9a-f]{12}"));
ok('reapproval uses shared least-privilege baseline', reapprove.includes('DISCORD_BOT_BASE_PERMISSIONS') && security.includes("DISCORD_BOT_BASE_PERMISSIONS = '93200'"));
ok('reapproval locks connected guild', reapprove.includes("disable_guild_select: 'true'") && reapprove.includes('guild_id: guildId'));
ok('callback rejects guild mismatch', callback.includes('guild_mismatch') && callback.includes('expectedGuildId'));
ok('client preserves API status', api.includes('error.statusCode = response.status'));
ok('client exposes permission reapproval', api.includes('startDiscordPermissionReapproval'));
ok('guided setup catches manage channels 403', main.includes("permissionIssue='manage_channels'") && main.includes("statusCode||0)===403"));
ok('guided setup resumes at channel step', main.includes("axe_product_setup_resume_step','4'"));
ok('inline reapproval action exists', render.includes('setup-guide-reapprove-channels') && render.includes('권한 다시 승인'));
ok('direct-channel fallback remains available', render.includes('기존 채널 직접 연결'));
ok('permission recovery UI styled', css.includes('.setup-guide-permission-card'));

const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} · ${name}`);
if (failed.length) process.exit(1);
console.log(`Discord Permission Reapproval: ${checks.length}/${checks.length} PASS`);
