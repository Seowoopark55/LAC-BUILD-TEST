// LAC HUB: scale only data-table typography, not the overall site or login.
// Each table cell continues using its existing relative text-size hierarchy.
export const LAYOUT_STUDIO_STORAGE_KEY = 'lac_one_table_type_scale_v1';
const LEGACY_WHOLE_SITE_SCALE_KEY = 'lac_one_type_scale_v1';
export const LAYOUT_STUDIO_DEFAULTS = Object.freeze({fontScale: 100});

export function normalizeLayoutStudioProfile(input = {}) {
  const raw = Number(input?.fontScale);
  return {fontScale: Number.isFinite(raw) ? Math.min(150, Math.max(90, Math.round(raw / 5) * 5)) : 100};
}
export function loadLayoutStudioProfile() {
  try {
    const saved = localStorage.getItem(LAYOUT_STUDIO_STORAGE_KEY);
    // If the old whole-site slider was used, retain the selected percentage,
    // but from this release it affects only data tables.
    const previous = saved ?? localStorage.getItem(LEGACY_WHOLE_SITE_SCALE_KEY);
    return previous ? normalizeLayoutStudioProfile(JSON.parse(previous)) : {...LAYOUT_STUDIO_DEFAULTS};
  } catch { return {...LAYOUT_STUDIO_DEFAULTS}; }
}
export function saveLayoutStudioProfile(profile) {
  const next = normalizeLayoutStudioProfile(profile);
  localStorage.setItem(LAYOUT_STUDIO_STORAGE_KEY, JSON.stringify(next));
  return next;
}
export function clearLayoutStudioProfile() {
  localStorage.removeItem(LAYOUT_STUDIO_STORAGE_KEY);
  localStorage.removeItem(LEGACY_WHOLE_SITE_SCALE_KEY);
  return {...LAYOUT_STUDIO_DEFAULTS};
}
export function applyLayoutStudioProfile(profile) {
  const next = normalizeLayoutStudioProfile(profile);
  const root = document.documentElement;
  // R3's --lac-type-scale was applied to hundreds of unrelated site elements.
  // Reset it and scope it exclusively to the data-table rows in CSS.
  root.style.setProperty('--lac-type-scale', '1');
  root.style.setProperty('--lac-table-scale', String(next.fontScale / 100));
  root.dataset.layoutStudioActive = 'false'; // disable legacy page-wide layout overrides
  root.dataset.lacTableScaleActive = next.fontScale === 100 ? 'false' : 'true';
  return next;
}
// Backward-compatible exports for existing route and button wiring.
export function applyLayoutStudioPreset(profile, type, value) {
  if (type !== 'text') return normalizeLayoutStudioProfile(profile);
  return normalizeLayoutStudioProfile({fontScale: ({small:90, default:100, comfortable:120, large:140})[value] ?? profile.fontScale});
}
export function adjustLayoutStudioValue(profile, key, delta) {
  return key === 'fontScale' ? normalizeLayoutStudioProfile({fontScale: Number(profile.fontScale) + Number(delta)}) : normalizeLayoutStudioProfile(profile);
}
export function detectLayoutStudioPreset(profile, type) {
  if (type !== 'text') return 'default';
  return ({90:'small', 100:'default', 120:'comfortable', 140:'large'})[normalizeLayoutStudioProfile(profile).fontScale] || 'custom';
}
