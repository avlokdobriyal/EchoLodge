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
