import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getDiscordConfig, getHubAppUrl } from '../server/discordSecurity.js';

const oldUrl = 'axe-product.vercel.app';
const official = 'https://lac-hub.vercel.app';
const redirect = `${official}/api/discord/callback`;
const names = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_OAUTH_STATE_SECRET', 'DISCORD_REDIRECT_URI', 'LAC_HUB_APP_URL', 'AXE_PRODUCT_APP_URL'];
const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
try {
  for (const name of names) delete process.env[name];
  process.env.DISCORD_CLIENT_ID = 'test-client';
  process.env.DISCORD_CLIENT_SECRET = 'test-secret';
  process.env.DISCORD_OAUTH_STATE_SECRET = 'test-state';
  assert.equal(getDiscordConfig().redirectUri, redirect, 'Discord server connection fallback');
  assert.equal(getDiscordConfig().appUrl, official, 'OAuth return page fallback');
  assert.equal(getHubAppUrl(), official, 'notification link fallback');
  process.env.AXE_PRODUCT_APP_URL = 'https://legacy-custom.example/';
  assert.equal(getHubAppUrl(), 'https://legacy-custom.example', 'existing legacy environment setting remains honored');
  process.env.LAC_HUB_APP_URL = `${official}/`;
  assert.equal(getHubAppUrl(), official, 'official setting takes precedence over legacy setting');
  process.env.DISCORD_REDIRECT_URI = 'https://configured.example/api/discord/callback';
  assert.equal(getDiscordConfig().redirectUri, 'https://configured.example/api/discord/callback', 'registered callback environment override remains honored');
  for (const name of ['server/discordSecurity.js', 'api/support/notify.js', 'api/suggestions/notify.js', '.env.example']) {
    assert(!fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8').includes(oldUrl), `${name} still has the old address`);
  }
  for (const name of ['api/support/notify.js', 'api/suggestions/notify.js']) {
    assert(fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8').includes('getHubAppUrl()'), `${name} must use the canonical helper`);
  }
  console.log('PASS official default URL and Discord server connection callback');
  console.log('PASS notification URLs use a shared helper');
  console.log('PASS explicit environment variables are honored; LAC_HUB_APP_URL takes precedence');
  console.log('PASS no old hardcoded production hostname remains in active/config source');
  console.log('IMPORTANT: live Vercel/Discord/Supabase settings are NOT validated by this test');
} finally {
  for (const [name, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
}
