const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { analyzeReview } = require('../services/reviewAI');

const router = express.Router();

// --- Validation schemas --------------------------------------------------
const createReviewSchema = z.object({
  guestName: z.string().trim().min(1, 'Guest name is required'),
  roomType: z.string().trim().min(1, 'Room type is required'),
  reviewText: z.string().trim().min(1, 'Review text is required').max(4000),
  rating: z.coerce.number().int().min(1).max(5),
});

// Updates touch the guest-entered fields only; AI metadata stays AI-owned.
const updateReviewSchema = createReviewSchema;

const replySchema = z.object({
  reply: z.string().trim().min(1, 'Reply text is required').max(4000),
});

// The shape non-admin callers see: internal AI fields (aiTags, suggestedReply)
// are stripped; the published adminReply and sentiment remain visible.
function toPublic(review) {
  const { aiTags, suggestedReply, ...publicFields } = review;
  return publicFields;
}

// --- GET /api/reviews/search — public ------------------------------------
router.get('/search', async (req, res, next) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query "q" is required' });
  }
  try {
    const filteredReviews = await prisma.review.findMany({
      where: {
        OR: [
          { reviewText: { contains: q, mode: 'insensitive' } },
          { sentiment: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(filteredReviews.map(toPublic));
  } catch (err) {
    next(err);
  }
});

// --- GET /api/reviews/admin/all — admin only, full records ----------------
// (Registered before /:id so "admin" isn't captured as an id.)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
});

// --- GET /api/reviews — public list ---------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json(reviews.map(toPublic));
  } catch (err) {
    next(err);
  }
});

// --- GET /api/reviews/:id — public single ---------------------------------
router.get('/:id', async (req, res, next) => {
  const reviewId = parseInt(req.params.id, 10);
  if (Number.isNaN(reviewId)) {
    return res.status(404).json({ error: 'Review not found' });
  }
  try {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(200).json(toPublic(review));
  } catch (err) {
    next(err);
  }
});

// --- POST /api/reviews — authenticated; AI-enriched before save -----------
router.post('/', requireAuth, async (req, res, next) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { guestName, roomType, reviewText, rating } = parsed.data;

  try {
    // Intercept: run the review through Gemini first. On any AI failure this
    // returns null and the review is saved with empty AI fields — a guest's
    // submission is never lost to an upstream outage.
    const ai = await analyzeReview({ guestName, roomType, reviewText, rating });

    const newReview = await prisma.review.create({
      data: {
        guestName,
        roomType,
        reviewText,
        rating,
        authorId: req.user.id,
        sentiment: ai?.sentiment ?? null,
        aiTags: ai?.aiTags ?? [],
        suggestedReply: ai?.suggestedReply ?? null,
      },
    });
    res.status(201).json(toPublic(newReview));
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/reviews/:id — authenticated ---------------------------------
router.put('/:id', requireAuth, async (req, res, next) => {
  const reviewId = parseInt(req.params.id, 10);
  const parsed = updateReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const existing = Number.isNaN(reviewId)
      ? null
      : await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: parsed.data,
    });
    res.status(200).json(toPublic(updated));
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/reviews/:id — authenticated ------------------------------
router.delete('/:id', requireAuth, async (req, res, next) => {
  const reviewId = parseInt(req.params.id, 10);
  try {
    const existing = Number.isNaN(reviewId)
      ? null
      : await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }
    await prisma.review.delete({ where: { id: reviewId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- POST /api/reviews/:id/reply — admin publishes a reply ----------------
router.post('/:id/reply', requireAuth, requireAdmin, async (req, res, next) => {
  const reviewId = parseInt(req.params.id, 10);
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const existing = Number.isNaN(reviewId)
      ? null
      : await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { adminReply: parsed.data.reply, adminReplied: true },
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
