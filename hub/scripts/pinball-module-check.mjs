import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const main = read('src/main.js');
const render = read('src/ui/render.js');
const channels = read('api/discord/setup/channels.js');
const api = read('src/lib/productApi.js');
const sql = read('database/migrations/SUPABASE_MIGRATION_3_24_0_PINBALL_SYSTEM.sql');

const checks = [
  ['module UI', render.includes("pinball:{name:'핀볼 모집'")],
  ['module order', render.includes("'modbook','pinball','cooking'")],
  ['guided quick channel', main.includes("key:'pinball',moduleKey:'pinball',settingKey:'channel_id'")],
  ['guided direct channel', main.includes("pinball:String(settingsByKey.pinball?.channel_id||'')")],
  ['channel binding', main.includes("pinball:['pinball','channel_id']")],
  ['preview module', main.includes('pinball:true')],
  ['preview channel', main.includes("pinball:'핀볼-모집'")],
  ['channel API capacity 8', channels.includes('const MAX_CHANNELS = 8;')],
  ['module catalog SQL', sql.includes("'pinball',\n  '핀볼 모집'")],
  ['sessions table', sql.includes('create table if not exists axe_product.pinball_sessions')],
  ['participants table', sql.includes('create table if not exists axe_product.pinball_participants')],
  ['host max 2', sql.includes('v_active_host >= 2')],
  ['rolling spam limit', sql.includes("interval '10 minutes'") && sql.includes(">= 6")],
  ['company max 8', sql.includes('v_active_company >= 8')],
  ['24h expiry', sql.includes("interval '24 hours'")],
  ['generic/modbook kind', sql.includes("item_kind in ('item','modbook')")],
  ['idempotent key', sql.includes('pinball_sessions_company_request_key')],
  ['race-safe company create lock', sql.includes("'pinball-create:' || v_company_id::text")],
  ['future module row self-heal', main.includes('const moduleRows=new Map') && api.includes("onConflict: 'company_id,module_key'")],
  ['module off/channel move retires sessions', sql.includes("set status = 'cancelled'") && sql.includes("cm.module_key = 'pinball'")],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} · ${name}`);
if (failed.length) process.exit(1);
console.log(`PINBALL MODULE CHECK · ${checks.length}/${checks.length} PASS`);
