const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

const roomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  pricePerNight: z.coerce.number().positive('Price must be greater than 0'),
});

// --- GET /api/rooms — public list ----------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({ orderBy: { id: 'asc' } });
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
});

// --- GET /api/rooms/availability — public --------------------------------
// How many rooms in a category are actually free for a date range, so the
// booking UI can show availability up front instead of letting a guest fill in
// the whole form and then rejecting it with a 409.
// (Registered before /:id-style routes; rooms has none, but keep it above POST
// for readability.)
const availabilityQuerySchema = z.object({
  category: z.string().trim().min(1, 'category is required'),
  checkIn: z.coerce.date({ invalid_type_error: 'checkIn must be a valid date' }),
  checkOut: z.coerce.date({ invalid_type_error: 'checkOut must be a valid date' }),
});

router.get('/availability', async (req, res, next) => {
  const parsed = availabilityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { category, checkIn, checkOut } = parsed.data;

  if (checkOut <= checkIn) {
    return res.status(400).json({ error: 'checkOut must be after checkIn' });
  }

  try {
    const rooms = await prisma.room.findMany({
      where: { category },
      select: { id: true },
    });
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'No rooms found in this category' });
    }

    // Same overlap rule the booking routes enforce: start < otherEnd && end > otherStart.
    const conflicts = await prisma.booking.findMany({
      where: {
        roomId: { in: rooms.map((r) => r.id) },
        status: { not: 'CANCELLED' },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
      select: { roomId: true },
    });

    const taken = new Set(conflicts.map((c) => c.roomId)).size;
    res.status(200).json({
      category,
      inventory: rooms.length,
      available: rooms.length - taken,
    });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/rooms — admin only ----------------------------------------
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  const parsed = roomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const room = await prisma.room.create({ data: parsed.data });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/rooms/:id — admin only ----------------------------------
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const roomId = parseInt(req.params.id, 10);
  if (Number.isNaN(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  try {
    const existing = await prisma.room.findUnique({ where: { id: roomId } });
    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Bookings cascade-delete via the FK (onDelete: Cascade).
    await prisma.room.delete({ where: { id: roomId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
