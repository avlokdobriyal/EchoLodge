// Presentation metadata for each room category in the database.
//
// Inventory, pricing and descriptions always come from the live API — this file
// only holds things the database has no opinion about: photography, marketing
// taglines, and display order. Keyed by the exact `category` string stored on
// the Room rows, so adding a category in the admin panel degrades gracefully to
// FALLBACK_CATEGORY_META rather than breaking the page.

export const CATEGORY_META = {
  "Ganga View Balcony": {
    label: "Ganga View Balcony",
    shortLabel: "Ganga Balcony",
    tagline: "Private balconies opening straight onto the river",
    highlights: ["Ganga-facing balcony", "Sunrise aarti views", "Complimentary terrace access"],
    tag: "River view",
    image: "/rooms/ganga-view.jpg",
    accent: "from-forest/90 to-forest-light/80",
    chip: "bg-forest/10 text-forest dark:bg-moss/20 dark:text-moss",
    order: 1,
  },
  "Standard Balcony": {
    label: "Standard Balcony",
    shortLabel: "Standard Balcony",
    tagline: "Calm, comfortable rooms in the heart of the lodge",
    highlights: ["Garden-side balcony", "Warm minimalist interiors", "Complimentary terrace access"],
    tag: "Best value",
    image: "/rooms/standard-balcony.jpg",
    accent: "from-clay/80 to-clay-dark/80",
    chip: "bg-sand text-ink-soft dark:bg-bark dark:text-parchment/70",
    order: 2,
  },
  "Super Deluxe Ganga View Suite": {
    label: "Super Deluxe Ganga View Suite",
    shortLabel: "Ganga View Suite",
    tagline: "Our finest suites — panoramic river views and space to breathe",
    highlights: ["Panoramic Ganga suite", "Separate lounge area", "Complimentary terrace access"],
    tag: "Signature",
    image: "/rooms/suite.jpg",
    accent: "from-bark/90 to-bark-soft/90",
    chip: "bg-clay/15 text-clay-dark dark:bg-clay/25 dark:text-clay",
    order: 3,
  },
};

// Used for any category present in the database but not described above.
export const FALLBACK_CATEGORY_META = {
  tagline: "",
  highlights: [],
  tag: null,
  image: null,
  accent: "from-forest/90 to-forest-light/80",
  chip: "bg-sand text-ink-soft dark:bg-bark dark:text-parchment/70",
  order: 99,
};

export function metaFor(category) {
  return {
    ...FALLBACK_CATEGORY_META,
    label: category,
    shortLabel: category,
    ...(CATEGORY_META[category] ?? {}),
  };
}

// The canonical category names, in display order. Used as the fallback option
// list for forms when the live rooms list hasn't loaded (or is empty).
export const CATEGORY_NAMES = Object.keys(CATEGORY_META).sort(
  (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order
);
