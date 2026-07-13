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

// Complete FortiGuard category id -> { name, group } (from `get webfilter categories`).
export const FORTIGUARD_CATEGORIES: Record<number, { name: string; group: CategoryGroup }> = {
  // g01 Potentially Liable
  1: { name: 'Drug Abuse', group: 'Potentially Liable' },
  3: { name: 'Hacking', group: 'Potentially Liable' },
  4: { name: 'Illegal or Unethical', group: 'Potentially Liable' },
  5: { name: 'Discrimination', group: 'Potentially Liable' },
  6: { name: 'Explicit Violence', group: 'Potentially Liable' },
  12: { name: 'Extremist Groups', group: 'Potentially Liable' },
  59: { name: 'Proxy Avoidance', group: 'Potentially Liable' },
  62: { name: 'Plagiarism', group: 'Potentially Liable' },
  83: { name: 'Child Sexual Abuse', group: 'Potentially Liable' },
  96: { name: 'Terrorism', group: 'Potentially Liable' },
  98: { name: 'Crypto Mining', group: 'Potentially Liable' },
  99: { name: 'Potentially Unwanted Program', group: 'Potentially Liable' },
  // g02 Adult/Mature Content
  2: { name: 'Alternative Beliefs', group: 'Adult/Mature Content' },
  7: { name: 'Abortion', group: 'Adult/Mature Content' },
  8: { name: 'Other Adult Materials', group: 'Adult/Mature Content' },
  9: { name: 'Advocacy Organizations', group: 'Adult/Mature Content' },
  11: { name: 'Gambling', group: 'Adult/Mature Content' },
  13: { name: 'Nudity and Risque', group: 'Adult/Mature Content' },
  14: { name: 'Pornography', group: 'Adult/Mature Content' },
  15: { name: 'Dating', group: 'Adult/Mature Content' },
  16: { name: 'Weapons (Sales)', group: 'Adult/Mature Content' },
  57: { name: 'Marijuana', group: 'Adult/Mature Content' },
  63: { name: 'Sex Education', group: 'Adult/Mature Content' },
  64: { name: 'Alcohol', group: 'Adult/Mature Content' },
  65: { name: 'Tobacco', group: 'Adult/Mature Content' },
  66: { name: 'Lingerie and Swimsuit', group: 'Adult/Mature Content' },
  67: { name: 'Sports Hunting and War Games', group: 'Adult/Mature Content' },
  // g04 Bandwidth Consuming
  19: { name: 'Freeware and Software Downloads', group: 'Bandwidth Consuming' },
  24: { name: 'File Sharing and Storage', group: 'Bandwidth Consuming' },
  25: { name: 'Streaming Media and Download', group: 'Bandwidth Consuming' },
  72: { name: 'Peer-to-peer File Sharing', group: 'Bandwidth Consuming' },
  75: { name: 'Internet Radio and TV', group: 'Bandwidth Consuming' },
  76: { name: 'Internet Telephony', group: 'Bandwidth Consuming' },
  // g05 Security Risk
  26: { name: 'Malicious Websites', group: 'Security Risk' },
  61: { name: 'Phishing', group: 'Security Risk' },
  86: { name: 'Spam URLs', group: 'Security Risk' },
  88: { name: 'Dynamic DNS', group: 'Security Risk' },
  90: { name: 'Newly Observed Domain', group: 'Security Risk' },
  91: { name: 'Newly Registered Domain', group: 'Security Risk' },
  // g06 General Interest - Personal
  17: { name: 'Advertising', group: 'General Interest - Personal' },
  18: { name: 'Brokerage and Trading', group: 'General Interest - Personal' },
  20: { name: 'Games', group: 'General Interest - Personal' },
  23: { name: 'Web-based Email', group: 'General Interest - Personal' },
  28: { name: 'Entertainment', group: 'General Interest - Personal' },
  29: { name: 'Arts and Culture', group: 'General Interest - Personal' },
  30: { name: 'Education', group: 'General Interest - Personal' },
  33: { name: 'Health and Wellness', group: 'General Interest - Personal' },
  34: { name: 'Job Search', group: 'General Interest - Personal' },
  35: { name: 'Medicine', group: 'General Interest - Personal' },
  36: { name: 'News and Media', group: 'General Interest - Personal' },
  37: { name: 'Social Networking', group: 'General Interest - Personal' },
  38: { name: 'Political Organizations', group: 'General Interest - Personal' },
  39: { name: 'Reference', group: 'General Interest - Personal' },
  40: { name: 'Global Religion', group: 'General Interest - Personal' },
  42: { name: 'Shopping', group: 'General Interest - Personal' },
  44: { name: 'Society and Lifestyles', group: 'General Interest - Personal' },
  46: { name: 'Sports', group: 'General Interest - Personal' },
  47: { name: 'Travel', group: 'General Interest - Personal' },
  48: { name: 'Personal Vehicles', group: 'General Interest - Personal' },
  54: { name: 'Dynamic Content', group: 'General Interest - Personal' },
  55: { name: 'Meaningless Content', group: 'General Interest - Personal' },
  58: { name: 'Folklore', group: 'General Interest - Personal' },
  68: { name: 'Web Chat', group: 'General Interest - Personal' },
  69: { name: 'Instant Messaging', group: 'General Interest - Personal' },
  70: { name: 'Newsgroups and Message Boards', group: 'General Interest - Personal' },
  71: { name: 'Digital Postcards', group: 'General Interest - Personal' },
  77: { name: 'Child Education', group: 'General Interest - Personal' },
  78: { name: 'Real Estate', group: 'General Interest - Personal' },
  79: { name: 'Restaurant and Dining', group: 'General Interest - Personal' },
  80: { name: 'Personal Websites and Blogs', group: 'General Interest - Personal' },
  82: { name: 'Content Servers', group: 'General Interest - Personal' },
  85: { name: 'Domain Parking', group: 'General Interest - Personal' },
  87: { name: 'Personal Privacy', group: 'General Interest - Personal' },
  89: { name: 'Auction', group: 'General Interest - Personal' },
  // g07 General Interest - Business
  31: { name: 'Finance and Banking', group: 'General Interest - Business' },
  41: { name: 'Search Engines and Portals', group: 'General Interest - Business' },
  43: { name: 'General Organizations', group: 'General Interest - Business' },
  49: { name: 'Business', group: 'General Interest - Business' },
  50: { name: 'Information and Computer Security', group: 'General Interest - Business' },
  51: { name: 'Government and Legal Organizations', group: 'General Interest - Business' },
  52: { name: 'Information Technology', group: 'General Interest - Business' },
  53: { name: 'Armed Forces', group: 'General Interest - Business' },
  56: { name: 'Web Hosting', group: 'General Interest - Business' },
  81: { name: 'Secure Websites', group: 'General Interest - Business' },
  84: { name: 'Web-based Applications', group: 'General Interest - Business' },
  92: { name: 'Charitable Organizations', group: 'General Interest - Business' },
  93: { name: 'Remote Access', group: 'General Interest - Business' },
  94: { name: 'Web Analytics', group: 'General Interest - Business' },
  95: { name: 'Online Meeting', group: 'General Interest - Business' },
  97: { name: 'URL Shortening', group: 'General Interest - Business' },
  100: { name: 'Artificial Intelligence Technology', group: 'General Interest - Business' },
  101: { name: 'Cryptocurrency', group: 'General Interest - Business' },
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
