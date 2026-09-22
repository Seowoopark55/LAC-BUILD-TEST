// Small UI-only regression check for the isolated login-entry cleanup.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const f = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const render = f('hub/src/ui/render.js');
const main = f('hub/src/main.js');
const login = render.split('function renderLogin(state) {')[1]?.split('function onboardingDiscordIdentity(state) {')[0];
assert.ok(login, 'login renderer exists');
assert.match(login, /data-action="discord-login"/, 'Discord login button retained');
assert.doesNotMatch(login, /lac-login-code|data-login-create-code|회사 개설 코드|새 회사를 개설하시나요/, 'pre-login code entry hidden');
assert.match(login, /HUB와 BUILD에서 공유됩니다/, 'login copy no longer promotes company creation');
assert.match(render, /function renderStartupLoading\(\)/, 'startup loading and access gate unchanged');
assert.match(render, /function firstRunContent\(/, 'authenticated company onboarding unchanged');
assert.match(render, /name="create_code"[^>]*required/, 'authenticated company creation code form unchanged');
assert.match(main, /await redeemCompanyCreateCode\(createCode,requestedName\)/, 'company creation API guard unchanged');
assert.match(f('hub/src/ui/hubHome.js'), /const BUILD_PUBLIC_URL = '\/build\/';/, 'same-origin BUILD link unchanged');
console.log('PASS: login-only code entry hidden; Discord login and authenticated company creation retained.');
console.log('NOTE: browser back startup loading is unchanged; it requires independent architectural/performance validation.');
