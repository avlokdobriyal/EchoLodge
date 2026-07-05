// Seeds the initial reviews (idempotent: only runs when the table is empty).
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const seedReviews = [
  { guestName: "Alice", roomType: "Suite", reviewText: "Amazing stay!", sentiment: "positive" },
  { guestName: "Bob", roomType: "Standard", reviewText: "Good value for money.", sentiment: "neutral" },
  { guestName: "Charlie", roomType: "Deluxe", reviewText: "Very noisy at night.", sentiment: "negative" },
];

async function main() {
  const existing = await prisma.review.count();
  if (existing > 0) {
    console.log(`Reviews table already has ${existing} rows — skipping seed.`);
    return;
  }
  await prisma.review.createMany({ data: seedReviews });
  console.log(`Seeded ${seedReviews.length} reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
