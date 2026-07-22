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

// --- POST /api/bookings — authenticated -----------------------------------
router.post('/', requireAuth, async (req, res, next) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { roomId, checkIn, checkOut } = parsed.data;

  if (checkOut <= checkIn) {
    return res.status(400).json({ error: 'checkOut must be after checkIn' });
  }

  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Overlap: an active booking on this room whose range intersects the
    // requested range. Two ranges overlap iff start < otherEnd && end > otherStart.
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { not: 'CANCELLED' },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });
    if (conflict) {
      return res.status(409).json({ error: 'Room is already booked for the selected dates' });
    }

    const nights = nightsBetween(checkIn, checkOut);
    const totalPrice = nights * room.pricePerNight;

    const booking = await prisma.booking.create({
      data: {
        userId: Number(req.user.id),
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPrice,
      },
      include: { room: { select: { name: true, category: true } } },
    });

    res.status(201).json({ ...booking, nights });
  } catch (err) {
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

  if (checkOut <= checkIn) {
    return res.status(400).json({ error: 'checkOut must be after checkIn' });
  }

  try {
    const rooms = await prisma.room.findMany({
      where: { category },
      orderBy: { id: 'asc' },
    });
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'No rooms found in this category' });
    }
    if (quantity > rooms.length) {
      return res.status(400).json({
        error: `Only ${rooms.length} room(s) exist in this category`,
        inventory: rooms.length,
      });
    }

    // Rooms with an active booking overlapping the requested range are taken.
    const conflicts = await prisma.booking.findMany({
      where: {
        roomId: { in: rooms.map((r) => r.id) },
        status: { not: 'CANCELLED' },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
      select: { roomId: true },
    });
    const taken = new Set(conflicts.map((c) => c.roomId));
    const free = rooms.filter((r) => !taken.has(r.id));

    if (free.length < quantity) {
      return res.status(409).json({
        error: `Only ${free.length} room(s) of this category are available for the selected dates`,
        available: free.length,
      });
    }

    const nights = nightsBetween(checkIn, checkOut);
    const picked = free.slice(0, quantity);

    const bookings = await prisma.$transaction(
      picked.map((room) =>
        prisma.booking.create({
          data: {
            userId: Number(req.user.id),
            roomId: room.id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalPrice: nights * room.pricePerNight,
          },
          include: { room: { select: { name: true, category: true } } },
        })
      )
    );

    const totalPrice = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    res.status(201).json({ bookings, nights, quantity, totalPrice });
  } catch (err) {
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
