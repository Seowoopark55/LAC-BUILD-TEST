import assert from 'node:assert/strict';
import { initializePrimaryScreenHistory, recordPrimaryScreen, readPrimaryScreen } from '../src/platform/screenHistory.js';

function mockBrowserHistory() {
  const entries = [{ legacyOAuth: true }];
  let position = 0;
  return {
    get state() { return entries[position]; },
    get length() { return entries.length; },
    replaceState(next) { entries[position] = next; },
    pushState(next) { entries.splice(++position); entries.push(next); },
    back() { if (position > 0) position--; return entries[position]; },
    forward() { if (position < entries.length - 1) position++; return entries[position]; },
  };
}

const history = mockBrowserHistory();
assert.equal(initializePrimaryScreenHistory(history), 'hub');
assert.equal(readPrimaryScreen(history.state), 'hub');
assert.equal(history.state.legacyOAuth, true); // Do not overwrite other same-origin history state.
recordPrimaryScreen(history, 'dashboard');
assert.equal(history.length, 2);
assert.equal(readPrimaryScreen(history.state), 'dashboard');
assert.equal(readPrimaryScreen(history.back()), 'hub'); // Back stays inside HUB.
assert.equal(readPrimaryScreen(history.forward()), 'dashboard');
recordPrimaryScreen(history, 'fund');
recordPrimaryScreen(history, 'members');
recordPrimaryScreen(history, 'assets');
assert.equal(history.length, 5);
assert.equal(readPrimaryScreen(history.back()), 'members');
assert.equal(readPrimaryScreen(history.back()), 'fund');
assert.equal(readPrimaryScreen(history.back()), 'dashboard');
assert.equal(readPrimaryScreen(history.back()), 'hub'); // Do not jump to OAuth after one Back.
assert.equal(readPrimaryScreen(history.forward()), 'dashboard');
assert.equal(readPrimaryScreen(history.forward()), 'fund');
recordPrimaryScreen(history, 'settings'); // Branching removes old forward entries.
assert.equal(readPrimaryScreen(history.back()), 'fund');
assert.equal(readPrimaryScreen(history.forward()), 'settings');
assert.equal(initializePrimaryScreenHistory(history), 'settings'); // Same-entry reload.
recordPrimaryScreen(history, 'settings'); // Current page should not add a duplicate entry.
assert.equal(history.length, 4);
recordPrimaryScreen(history, 'hub');
recordPrimaryScreen(history, 'company-start');
assert.equal(readPrimaryScreen(history.back()), 'hub');
assert.equal(readPrimaryScreen(history.forward()), 'company-start');
assert.equal(readPrimaryScreen(null), null);
assert.throws(() => recordPrimaryScreen(history, 'logout'), /Invalid HUB screen/);
console.log('HUB history: PASS (category-by-category Back/Forward, company entry, reload, state preservation).');
