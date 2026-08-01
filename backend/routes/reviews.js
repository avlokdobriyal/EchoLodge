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
  // Optional: the stay being reviewed. When supplied and it genuinely belongs
  // to the caller, the review is stamped as a verified stay.
  bookingId: z.coerce.number().int().positive().optional(),
});

// Updates touch the guest-entered fields only; AI metadata and the verified-stay
// link stay owned by the server.
const updateReviewSchema = createReviewSchema.omit({ bookingId: true });

const replySchema = z.object({
  reply: z.string().trim().min(1, 'Reply text is required').max(4000),
});

// Only the review's author or an admin may modify it. Legacy rows with no
// authorId are admin-only.
function canModify(review, user) {
  if (user.role === 'ADMIN') return true;
  return review.authorId != null && review.authorId === Number(user.id);
}

// The shape non-admin callers see: internal AI fields (aiTags, suggestedReply)
// are stripped; the published adminReply, repliedAt and sentiment remain visible.
// `verifiedStay` is surfaced as a plain boolean so the client never has to know
// about booking ids.
function toPublic(review) {
  const { aiTags, suggestedReply, bookingId, ...publicFields } = review;
  return { ...publicFields, verifiedStay: bookingId != null };
}

// Resolves the booking a new review should be attached to. Returns the booking
// id when the caller genuinely owns a matching stay, otherwise null (the review
// still saves — it just renders as unverified). Guests who booked through the
// front desk rather than the site are not punished for it.
async function resolveVerifiedBooking(bookingId, userId) {
  if (!bookingId) return null;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: { select: { category: true } }, review: { select: { id: true } } },
  });
  // Must exist, belong to the caller, not be cancelled, and not already be
  // reviewed (the DB unique index enforces the last one too, but a clean 400
  // beats a constraint violation).
  if (!booking || booking.userId !== Number(userId)) return null;
  if (booking.status === 'CANCELLED') return null;
  if (booking.review) return null;
  return booking.id;
}

// --- GET /api/reviews/search — public ------------------------------------
router.get('/search', async (req, res, next) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) {
    return res.status(400).json({ error: 'Search query "q" is required' });
  }
  try {
    const filteredReviews = await prisma.review.findMany({
      where: {
        OR: [
          { reviewText: { contains: q, mode: 'insensitive' } },
          { sentiment: { contains: q, mode: 'insensitive' } },
          { guestName: { contains: q, mode: 'insensitive' } },
          { roomType: { contains: q, mode: 'insensitive' } },
        ],
      },
      // Newest first, matching the other listing endpoints.
      orderBy: { createdAt: 'desc' },
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
    // Admins keep the internal AI fields, but get the same verifiedStay flag the
    // public payload exposes so the dashboard doesn't have to derive it.
    res.status(200).json(
      reviews.map((r) => ({ ...r, verifiedStay: r.bookingId != null }))
    );
  } catch (err) {
    next(err);
  }
});

// --- GET /api/reviews/mine — the authenticated user's own reviews ---------
// (Registered before /:id so "mine" isn't captured as an id.)
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { authorId: Number(req.user.id) },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(reviews.map(toPublic));
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
  const { guestName, roomType, reviewText, rating, bookingId } = parsed.data;

  try {
    // Only stays the caller actually owns can verify a review.
    const verifiedBookingId = await resolveVerifiedBooking(bookingId, req.user.id);

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
        bookingId: verifiedBookingId,
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
    if (!canModify(existing, req.user)) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
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
    if (!canModify(existing, req.user)) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    await prisma.review.delete({ where: { id: reviewId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- POST /api/reviews/:id/regenerate — admin re-runs the AI analysis ------
// Useful when the original submission happened during an AI outage (null
// fields) or the admin wants a fresh draft reply.
router.post('/:id/regenerate', requireAuth, requireAdmin, async (req, res, next) => {
  const reviewId = parseInt(req.params.id, 10);
  try {
    const existing = Number.isNaN(reviewId)
      ? null
      : await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const ai = await analyzeReview({
      guestName: existing.guestName,
      roomType: existing.roomType,
      reviewText: existing.reviewText,
      rating: existing.rating,
    });
    if (!ai) {
      return res.status(502).json({
        error: 'The AI analyst is unavailable right now — please try again in a moment',
      });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        sentiment: ai.sentiment,
        aiTags: ai.aiTags,
        suggestedReply: ai.suggestedReply,
      },
    });
    res.status(200).json(updated);
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
      data: { adminReply: parsed.data.reply, adminReplied: true, repliedAt: new Date() },
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
