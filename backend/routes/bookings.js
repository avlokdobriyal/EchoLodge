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

module.exports = router;
