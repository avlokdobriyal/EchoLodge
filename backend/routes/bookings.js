const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Accepts roomId plus check-in/check-out. `datetime`/`date` strings are both
// allowed; z.coerce.date turns them into Date objects.
const bookingSchema = z.object({
  roomId: z.coerce.number().int().positive('A valid roomId is required'),
  checkIn: z.coerce.date({ invalid_type_error: 'checkIn must be a valid date' }),
  checkOut: z.coerce.date({ invalid_type_error: 'checkOut must be a valid date' }),
});

// Whole nights between two dates, rounded up so partial days count as a night.
function nightsBetween(checkIn, checkOut) {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
}

// Midnight UTC today. The lodge is in IST (UTC+5:30), which is ahead of UTC, so
// anchoring to UTC midnight errs on the permissive side: a guest booking "today"
// in local time is never rejected for being in the past.
function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Shared date-range rules for both booking routes. Returns an error string, or
// null when the range is bookable.
function validateStayDates(checkIn, checkOut) {
  if (checkOut <= checkIn) return 'checkOut must be after checkIn';
  if (checkIn < startOfTodayUTC()) return 'checkIn cannot be in the past';
  return null;
}

// Rooms in `roomIds` with an active booking overlapping [checkIn, checkOut).
// Two ranges overlap iff start < otherEnd && end > otherStart.
async function findTakenRoomIds(tx, roomIds, checkIn, checkOut) {
  const conflicts = await tx.booking.findMany({
    where: {
      roomId: { in: roomIds },
      status: { not: 'CANCELLED' },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
    select: { roomId: true },
  });
  return new Set(conflicts.map((c) => c.roomId));
}

// Postgres raises 40001 (serialization failure) when two concurrent
// Serializable transactions would produce an impossible ordering — exactly the
// double-booking case we're guarding against.
function isSerializationFailure(err) {
  return err?.code === 'P2034' || err?.meta?.code === '40001';
}

const BOOKING_TX_OPTIONS = { isolationLevel: 'Serializable' };

// --- POST /api/bookings — authenticated -----------------------------------
router.post('/', requireAuth, async (req, res, next) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { roomId, checkIn, checkOut } = parsed.data;

  const dateError = validateStayDates(checkIn, checkOut);
  if (dateError) {
    return res.status(400).json({ error: dateError });
  }

  const nights = nightsBetween(checkIn, checkOut);

  try {
    // The availability check and the insert must be atomic — otherwise two
    // requests can both read "free" before either writes, and the room is
    // double-booked. Serializable makes Postgres reject the loser.
    const booking = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) {
        throw Object.assign(new Error('Room not found'), { status: 404 });
      }

      const taken = await findTakenRoomIds(tx, [roomId], checkIn, checkOut);
      if (taken.has(roomId)) {
        throw Object.assign(new Error('Room is already booked for the selected dates'), {
          status: 409,
        });
      }

      return tx.booking.create({
        data: {
          userId: Number(req.user.id),
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalPrice: nights * room.pricePerNight,
        },
        include: { room: { select: { name: true, category: true } } },
      });
    }, BOOKING_TX_OPTIONS);

    res.status(201).json({ ...booking, nights });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    if (isSerializationFailure(err)) {
      return res.status(409).json({
        error: 'That room was just taken for these dates. Please try again.',
      });
    }
    next(err);
  }
});

// --- POST /api/bookings/category — book N rooms of a category --------------
// The rooms page sells by category (e.g. 3 × "Standard Balcony"), so this
// finds `quantity` rooms of the category free for the range and books them
// atomically — either every room is reserved or none are.
const categoryBookingSchema = z.object({
  category: z.string().trim().min(1, 'category is required'),
  quantity: z.coerce.number().int().min(1).max(10),
  checkIn: z.coerce.date({ invalid_type_error: 'checkIn must be a valid date' }),
  checkOut: z.coerce.date({ invalid_type_error: 'checkOut must be a valid date' }),
});

router.post('/category', requireAuth, async (req, res, next) => {
  const parsed = categoryBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { category, quantity, checkIn, checkOut } = parsed.data;

  const dateError = validateStayDates(checkIn, checkOut);
  if (dateError) {
    return res.status(400).json({ error: dateError });
  }

  const nights = nightsBetween(checkIn, checkOut);

  try {
    // Availability check and all N inserts share one Serializable transaction,
    // so the category can't be oversold by concurrent requests.
    const bookings = await prisma.$transaction(async (tx) => {
      const rooms = await tx.room.findMany({
        where: { category },
        orderBy: { id: 'asc' },
      });
      if (rooms.length === 0) {
        throw Object.assign(new Error('No rooms found in this category'), { status: 404 });
      }
      if (quantity > rooms.length) {
        throw Object.assign(
          new Error(`Only ${rooms.length} room(s) exist in this category`),
          { status: 400, extra: { inventory: rooms.length } }
        );
      }

      const taken = await findTakenRoomIds(tx, rooms.map((r) => r.id), checkIn, checkOut);
      const free = rooms.filter((r) => !taken.has(r.id));

      if (free.length < quantity) {
        throw Object.assign(
          new Error(
            `Only ${free.length} room(s) of this category are available for the selected dates`
          ),
          { status: 409, extra: { available: free.length } }
        );
      }

      const picked = free.slice(0, quantity);
      const created = [];
      for (const room of picked) {
        created.push(
          await tx.booking.create({
            data: {
              userId: Number(req.user.id),
              roomId: room.id,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              totalPrice: nights * room.pricePerNight,
            },
            include: { room: { select: { name: true, category: true } } },
          })
        );
      }
      return created;
    }, BOOKING_TX_OPTIONS);

    const totalPrice = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    res.status(201).json({ bookings, nights, quantity, totalPrice });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message, ...(err.extra ?? {}) });
    }
    if (isSerializationFailure(err)) {
      return res.status(409).json({
        error: 'Those rooms were just taken for these dates. Please try again.',
      });
    }
    next(err);
  }
});

// --- GET /api/bookings — the authenticated user's own bookings -------------
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: Number(req.user.id) },
      orderBy: { checkInDate: 'asc' },
      include: { room: { select: { name: true, category: true } } },
    });
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
});

// Only the booking's owner or an admin may change it.
function canModify(booking, user) {
  return user.role === 'ADMIN' || booking.userId === Number(user.id);
}

// --- PATCH /api/bookings/:id/cancel — soft-cancel a booking ----------------
router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  const bookingId = parseInt(req.params.id, 10);
  try {
    const existing = Number.isNaN(bookingId)
      ? null
      : await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (!canModify(existing, req.user)) {
      return res.status(403).json({ error: 'You can only cancel your own bookings' });
    }
    if (existing.status === 'CANCELLED') {
      return res.status(409).json({ error: 'Booking is already cancelled' });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: { room: { select: { name: true, category: true } } },
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/bookings/:id — remove a booking record --------------------
router.delete('/:id', requireAuth, async (req, res, next) => {
  const bookingId = parseInt(req.params.id, 10);
  try {
    const existing = Number.isNaN(bookingId)
      ? null
      : await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (!canModify(existing, req.user)) {
      return res.status(403).json({ error: 'You can only remove your own bookings' });
    }
    await prisma.booking.delete({ where: { id: bookingId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
