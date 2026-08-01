-- Links a Review to the Booking it describes ("verified stay").
-- Strictly additive: one new nullable column, its unique index, and the FK.
-- No existing column is altered or dropped, so running this against a live
-- database cannot lose data. Safe to re-run (every step is guarded).

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "bookingId" INTEGER;

-- Multiple NULLs are permitted under a Postgres unique index, so existing rows
-- are unaffected; this only enforces at most one review per booking.
CREATE UNIQUE INDEX IF NOT EXISTS "Review_bookingId_key" ON "Review"("bookingId");

-- ON DELETE SET NULL: removing a booking downgrades its review to unverified
-- rather than deleting the guest's words.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Review_bookingId_fkey'
  ) THEN
    ALTER TABLE "Review"
      ADD CONSTRAINT "Review_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
