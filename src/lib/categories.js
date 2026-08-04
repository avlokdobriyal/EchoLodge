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
    order: 1,
  },
  "Standard Balcony": {
    label: "Standard Balcony",
    shortLabel: "Standard Balcony",
    tagline: "Calm, comfortable rooms in the heart of the lodge",
    highlights: ["Garden-side balcony", "Warm minimalist interiors", "Complimentary terrace access"],
    tag: "Best value",
    image: "/rooms/standard-balcony.jpg",
    order: 2,
  },
  "Super Deluxe Ganga View Suite": {
    label: "Super Deluxe Ganga View Suite",
    shortLabel: "Ganga View Suite",
    tagline: "Our finest suites — panoramic river views and space to breathe",
    highlights: ["Panoramic Ganga suite", "Separate lounge area", "Complimentary terrace access"],
    tag: "Signature",
    image: "/rooms/suite.jpg",
    order: 3,
  },
};

// Used for any category present in the database but not described above.
//
// Per-category accent colours used to live here. They were dropped: colouring
// each room type differently implied a distinction the categories don't
// actually have, and it fought the one rule the palette runs on — warm means
// something is actionable. Categories are told apart by their photograph and
// their name, which is how a guest tells them apart anyway.
export const FALLBACK_CATEGORY_META = {
  tagline: "",
  highlights: [],
  tag: null,
  image: null,
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
