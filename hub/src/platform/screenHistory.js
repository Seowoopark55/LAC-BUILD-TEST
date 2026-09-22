// HUB primary-screen entries stay on the same origin and URL. They give the
// browser Back/Forward buttons an in-app destination instead of unexpectedly
// jumping to the preceding (possibly expired) Discord OAuth callback.
export const SCREEN_HISTORY_KEY = 'lac_hub_primary_screen_v1';
const SCREENS = new Set(['hub', 'hub-board', 'company-start', 'dashboard', 'fund', 'members', 'assets', 'accounts', 'questions', 'suggestions', 'settings', 'info', 'game-info', 'platform', 'layout']);

export function readPrimaryScreen(entry) {
  const value = entry && typeof entry === 'object' ? entry[SCREEN_HISTORY_KEY] : null;
  return SCREENS.has(value) ? value : null;
}

export function initializePrimaryScreenHistory(browserHistory, initialScreen = 'hub') {
  const previous = readPrimaryScreen(browserHistory.state);
  if (previous) return previous;
  browserHistory.replaceState({...(browserHistory.state || {}), [SCREEN_HISTORY_KEY]: initialScreen}, '');
  return initialScreen;
}

export function recordPrimaryScreen(browserHistory, nextScreen) {
  if (!SCREENS.has(nextScreen)) throw new Error('Invalid HUB screen');
  if (readPrimaryScreen(browserHistory.state) === nextScreen) return;
  browserHistory.pushState({...(browserHistory.state || {}), [SCREEN_HISTORY_KEY]: nextScreen}, '');
}
