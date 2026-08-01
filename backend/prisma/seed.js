// Seeds initial data (idempotent: every block is safe to re-run).
//
//   npm run db:seed
//
// Blocks:
//   1. Rooms      — the real 12-room inventory across 3 categories.
//   2. Demo stays — a handful of past guests, each with a completed booking and
//                   a review linked to it, so the "Verified stay" badge and the
//                   AI review pipeline have something to show in a demo.
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { analyzeReview } = require("../services/reviewAI");

const prisma = new PrismaClient();

// Every description explicitly includes "Complimentary Terrace Access" per spec.
const TERRACE = "Complimentary Terrace Access";

const CATEGORIES = {
  GANGA: "Ganga View Balcony",
  STANDARD: "Standard Balcony",
  SUITE: "Super Deluxe Ganga View Suite",
};

function makeRooms() {
  const rooms = [];

  // Category 1 — Ganga View Balcony (5 rooms, premium pricing).
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      name: `Ganga View Balcony ${i}`,
      category: CATEGORIES.GANGA,
      description: `A premium room with a private balcony overlooking the sacred Ganga. Wake to the river breeze and aarti bells. Includes ${TERRACE}.`,
      pricePerNight: 6500,
    });
  }

  // Category 2 — Standard Balcony (5 rooms, cheaper, explicitly no Ganga view).
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      name: `Standard Balcony ${i}`,
      category: CATEGORIES.STANDARD,
      description: `A comfortable, budget-friendly room with a private balcony facing the courtyard — please note there is no Ganga view from this category. Includes ${TERRACE}.`,
      pricePerNight: 3200,
    });
  }

  // Category 3 — Super Deluxe Ganga View Suite (2 rooms, highest pricing).
  for (let i = 1; i <= 2; i++) {
    rooms.push({
      name: `Super Deluxe Ganga View Suite ${i}`,
      category: CATEGORIES.SUITE,
      description: `Our finest suite: a spacious retreat with floor-to-ceiling windows framing a super beautiful, unobstructed Ganga view. Curated interiors, king bed, and lounge. Includes ${TERRACE}.`,
      pricePerNight: 12500,
    });
  }

  return rooms;
}

// --- Demo stays -----------------------------------------------------------
// These accounts exist only to author demo reviews. password: null means the
// credentials login path rejects them outright (routes/auth.js checks for it),
// so seeding cannot create a weak sign-into-able account on a live database.
//
// `daysAgo` positions the stay in the past, which is what makes the review
// credible: you review after you have stayed.
//
// `fallbackAI` is used only when GEMINI_API_KEY is absent — with a key present
// the seed runs each review through the real analysis pipeline, so the demo
// shows genuine model output rather than canned strings.
const DEMO_STAYS = [
  {
    email: "priya.sharma@demo.echolodge.in",
    name: "Priya Sharma",
    category: CATEGORIES.GANGA,
    daysAgo: 24,
    nights: 3,
    rating: 5,
    reviewText:
      "We woke every morning to the aarti bells drifting up from the ghat, and took our chai on the balcony watching the river turn gold. The room was spotless and the staff remembered our names by the second day. Worth every rupee.",
    fallbackAI: {
      sentiment: "POSITIVE",
      aiTags: ["View", "Staff", "Cleanliness"],
      suggestedReply:
        "Thank you so much, Priya! We are delighted the morning aarti and the river views made your stay memorable, and we will pass your kind words along to our team. It would be a pleasure to welcome you back to that balcony any time.\n— The EchoLodge Team",
    },
  },
  {
    email: "arjun.mehta@demo.echolodge.in",
    name: "Arjun Mehta",
    category: CATEGORIES.STANDARD,
    daysAgo: 17,
    nights: 2,
    rating: 4,
    reviewText:
      "Great value for the price and a genuinely peaceful courtyard. No Ganga view from this category, which the listing is honest about, so no complaints there. Only note is that the wifi struggled a bit in the evenings.",
    fallbackAI: {
      sentiment: "POSITIVE",
      aiTags: ["Value", "Wifi"],
      suggestedReply:
        "Thank you for the thoughtful review, Arjun. We are glad the courtyard gave you the quiet you were after, and we appreciate you flagging the evening wifi — our team is working on strengthening the signal on that side of the lodge. We hope to host you again.\n— The EchoLodge Team",
    },
  },
  {
    email: "neha.iyer@demo.echolodge.in",
    name: "Neha Iyer",
    category: CATEGORIES.SUITE,
    daysAgo: 11,
    nights: 4,
    rating: 5,
    reviewText:
      "The suite is genuinely special — floor to ceiling glass, the Ganga right there, and a lounge big enough to actually work from. The terrace at sunset is the best seat in Rishikesh. Breakfast was excellent too.",
    fallbackAI: {
      sentiment: "POSITIVE",
      aiTags: ["View", "Amenities", "Food"],
      suggestedReply:
        "Neha, thank you — this is lovely to read. The sunset terrace is our favourite spot too, and we are so pleased the suite worked as both a retreat and a workspace for you. We would be delighted to have you back.\n— The EchoLodge Team",
    },
  },
  {
    email: "rohit.nair@demo.echolodge.in",
    name: "Rohit Nair",
    category: CATEGORIES.STANDARD,
    daysAgo: 6,
    nights: 2,
    rating: 3,
    reviewText:
      "The location is excellent and the terrace is lovely, but our room was not ready at the stated check-in time and we waited nearly an hour with our bags in the lobby. Once we were in, everything was fine.",
    fallbackAI: {
      sentiment: "NEUTRAL",
      aiTags: ["Booking", "Location"],
      suggestedReply:
        "Thank you for the honest feedback, Rohit, and our sincere apologies for the wait at check-in — that is not the arrival we want anyone to have. We are reviewing our housekeeping turnaround so it does not happen again. We are glad the rest of the stay went well.\n— The EchoLodge Team",
    },
  },
];

// --- Seed blocks ----------------------------------------------------------

async function seedRoomsIfEmpty() {
  const existing = await prisma.room.count();
  if (existing > 0) {
    console.log(`Rooms table already has ${existing} rows — skipping.`);
    return;
  }
  const rooms = makeRooms();
  await prisma.room.createMany({ data: rooms });
  console.log(`Seeded ${rooms.length} rooms.`);
}

function daysAgoDate(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Runs the real AI pipeline when a key is configured, otherwise uses the
// hand-written fixture so seeding never depends on network access.
async function analysisFor(stay) {
  if (process.env.GEMINI_API_KEY) {
    const ai = await analyzeReview({
      guestName: stay.name,
      roomType: stay.category,
      reviewText: stay.reviewText,
      rating: stay.rating,
    });
    if (ai) return { ...ai, source: "gemini" };
  }
  return { ...stay.fallbackAI, source: "fixture" };
}

async function seedDemoStays() {
  for (const stay of DEMO_STAYS) {
    // 1. The guest account (passwordless — cannot be signed into).
    const user = await prisma.user.upsert({
      where: { email: stay.email },
      update: { name: stay.name },
      create: { email: stay.email, name: stay.name, password: null },
    });

    const room = await prisma.room.findFirst({
      where: { category: stay.category },
      orderBy: { id: "asc" },
    });
    if (!room) {
      console.log(`No room in category "${stay.category}" — skipping ${stay.name}.`);
      continue;
    }

    // 2. A completed past stay. Reuse one if this demo guest already has one,
    //    so re-running never piles up duplicate bookings.
    let booking = await prisma.booking.findFirst({ where: { userId: user.id } });
    if (!booking) {
      booking = await prisma.booking.create({
        data: {
          userId: user.id,
          roomId: room.id,
          checkInDate: daysAgoDate(stay.daysAgo),
          checkOutDate: daysAgoDate(stay.daysAgo - stay.nights),
          totalPrice: stay.nights * room.pricePerNight,
          status: "CONFIRMED",
        },
      });
    }

    // 3. The review, linked to that booking so it renders as a verified stay.
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: booking.id },
    });
    if (existingReview) {
      console.log(`${stay.name}: review already linked to booking #${booking.id} — skipping.`);
      continue;
    }

    const ai = await analysisFor(stay);
    await prisma.review.create({
      data: {
        guestName: stay.name,
        roomType: stay.category,
        reviewText: stay.reviewText,
        rating: stay.rating,
        authorId: user.id,
        bookingId: booking.id,
        sentiment: ai.sentiment,
        aiTags: ai.aiTags,
        suggestedReply: ai.suggestedReply,
        // Posted the day after checkout.
        createdAt: daysAgoDate(stay.daysAgo - stay.nights - 1),
      },
    });
    console.log(
      `${stay.name}: verified review created (${stay.category}, ${ai.sentiment}, analysis via ${ai.source}).`
    );
  }
}

async function main() {
  await seedRoomsIfEmpty();
  await seedDemoStays();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
