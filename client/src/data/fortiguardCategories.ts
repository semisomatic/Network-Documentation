// FortiGuard web filter category reference (id -> name + group).
//
// Config stores categories as numeric ids (e.g. `set category 26`). This map is
// ONLY for readable display — parse/export use the numeric id directly, so an
// incomplete map never affects config accuracy (unknown ids render "Category N").
//
// Seeded from confirmed FortiGuard ids + the standard category names/groups.
// To complete/verify: run `get webfilter categories` on the FortiGate and paste.

export const CATEGORY_GROUP_ORDER = [
  'Local Categories',
  'Unrated',
  'Potentially Liable',
  'Adult/Mature Content',
  'Bandwidth Consuming',
  'Security Risk',
  'General Interest - Personal',
  'General Interest - Business',
] as const;

export type CategoryGroup = (typeof CATEGORY_GROUP_ORDER)[number];

// Confirmed id -> { name, group }. Extend as ids are verified.
export const FORTIGUARD_CATEGORIES: Record<number, { name: string; group: CategoryGroup }> = {
  // Potentially Liable
  1: { name: 'Drug Abuse', group: 'Potentially Liable' },
  3: { name: 'Hacking', group: 'Potentially Liable' },
  4: { name: 'Illegal or Unethical', group: 'Potentially Liable' },
  5: { name: 'Discrimination', group: 'Potentially Liable' },
  6: { name: 'Explicit Violence', group: 'Potentially Liable' },
  12: { name: 'Extremist Groups', group: 'Potentially Liable' },
  59: { name: 'Proxy Avoidance', group: 'Potentially Liable' },
  62: { name: 'Plagiarism', group: 'Potentially Liable' },
  83: { name: 'Child Sexual Abuse', group: 'Potentially Liable' },
  // Bandwidth Consuming
  19: { name: 'Freeware and Software Downloads', group: 'Bandwidth Consuming' },
  24: { name: 'File Sharing and Storage', group: 'Bandwidth Consuming' },
  25: { name: 'Streaming Media and Download', group: 'Bandwidth Consuming' },
  72: { name: 'Peer-to-peer File Sharing', group: 'Bandwidth Consuming' },
  75: { name: 'Internet Radio and TV', group: 'Bandwidth Consuming' },
  76: { name: 'Internet Telephony', group: 'Bandwidth Consuming' },
  // Security Risk
  26: { name: 'Malicious Websites', group: 'Security Risk' },
  61: { name: 'Phishing', group: 'Security Risk' },
  86: { name: 'Spam URLs', group: 'Security Risk' },
  88: { name: 'Dynamic DNS', group: 'Security Risk' },
  90: { name: 'Newly Observed Domain', group: 'Security Risk' },
};

export function categoryName(id: number, local?: { id: number; name: string }[]): string {
  const loc = local?.find((c) => c.id === id);
  if (loc) return loc.name;
  return FORTIGUARD_CATEGORIES[id]?.name ?? `Category ${id}`;
}

export function categoryGroup(id: number, local?: { id: number; name: string }[]): string {
  if (local?.some((c) => c.id === id)) return 'Local Categories';
  return FORTIGUARD_CATEGORIES[id]?.group ?? 'Other';
}
