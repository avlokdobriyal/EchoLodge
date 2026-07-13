// Seeds initial data (idempotent: each block only runs when its table is empty).
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const seedReviews = [
  { guestName: "Alice", roomType: "Suite", reviewText: "Amazing stay!", sentiment: "positive" },
  { guestName: "Bob", roomType: "Standard", reviewText: "Good value for money.", sentiment: "neutral" },
  { guestName: "Charlie", roomType: "Deluxe", reviewText: "Very noisy at night.", sentiment: "negative" },
];

// Every description explicitly includes "Complimentary Terrace Access" per spec.
const TERRACE = "Complimentary Terrace Access";

function makeRooms() {
  const rooms = [];

  // Category 1 — Ganga View Balcony (5 rooms, premium pricing).
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      name: `Ganga View Balcony ${i}`,
      category: "Ganga View Balcony",
      description: `A premium room with a private balcony overlooking the sacred Ganga. Wake to the river breeze and aarti bells. Includes ${TERRACE}.`,
      pricePerNight: 6500,
    });
  }

  // Category 2 — Standard Balcony (5 rooms, cheaper, explicitly no Ganga view).
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      name: `Standard Balcony ${i}`,
      category: "Standard Balcony",
      description: `A comfortable, budget-friendly room with a private balcony facing the courtyard — please note there is no Ganga view from this category. Includes ${TERRACE}.`,
      pricePerNight: 3200,
    });
  }

  // Category 3 — Super Deluxe Ganga View Suite (2 rooms, highest pricing).
  for (let i = 1; i <= 2; i++) {
    rooms.push({
      name: `Super Deluxe Ganga View Suite ${i}`,
      category: "Super Deluxe Ganga View Suite",
      description: `Our finest suite: a spacious retreat with floor-to-ceiling windows framing a super beautiful, unobstructed Ganga view. Curated interiors, king bed, and lounge. Includes ${TERRACE}.`,
      pricePerNight: 12500,
    });
  }

  return rooms;
}

async function seedReviewsIfEmpty() {
  const existing = await prisma.review.count();
  if (existing > 0) {
    console.log(`Reviews table already has ${existing} rows — skipping.`);
    return;
  }
  await prisma.review.createMany({ data: seedReviews });
  console.log(`Seeded ${seedReviews.length} reviews.`);
}

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

async function main() {
  await seedReviewsIfEmpty();
  await seedRoomsIfEmpty();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
