// FortiGuard Application Control category reference (id -> name).
// Distinct from web filter categories. These ids come from the config's
// `set category` entries; names are best-effort and DISPLAY-ONLY (the numeric
// ids are what parse/export use, so an imperfect name never affects accuracy).
// To verify/extend: confirm against the FortiGate Application Control GUI.

// From `get application category` on the FortiGate. Id 32 (Unknown Applications)
// is presented separately in the GUI, not as a category row.
export const APP_CATEGORIES: Record<number, string> = {
  2: 'P2P',
  3: 'VoIP',
  5: 'Video/Audio',
  6: 'Proxy',
  7: 'Remote Access',
  8: 'Game',
  12: 'General Interest',
  15: 'Network Service',
  17: 'Update',
  21: 'Email',
  22: 'Storage/Backup',
  23: 'Social Media',
  25: 'Web Client',
  26: 'Operational Technology',
  28: 'Collaboration',
  29: 'Business',
  30: 'Cloud/IT',
  31: 'Mobile',
  32: 'Unknown Applications',
  36: 'GenAI',
};

// Categories shown in the profile's category grid (excludes Unknown Applications)
export const APP_CATEGORY_IDS = Object.keys(APP_CATEGORIES).map(Number).filter((id) => id !== 32);

export function appCategoryName(id: number): string {
  return APP_CATEGORIES[id] ?? `Category ${id}`;
}

// For the override "Filter" picker (per request: Behavior, Category, Popularity, Risk)
export const APP_BEHAVIORS = ['Botnet', 'Evasive', 'Excessive-Bandwidth', 'Tunneling'];
export const APP_POPULARITY = ['1', '2', '3', '4', '5'];
export const APP_RISK = ['1', '2', '3', '4', '5'];
