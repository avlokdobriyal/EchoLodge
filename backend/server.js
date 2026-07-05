const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes

// 2. GET /api/reviews/search - Search reviews by q query parameter matching text or sentiment.
app.get('/api/reviews/search', async (req, res, next) => {
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
    res.status(200).json(filteredReviews);
  } catch (err) {
    next(err);
  }
});

// 1. GET /api/reviews - List all reviews.
app.get('/api/reviews', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/reviews/:id - Get a single review by ID.
app.get('/api/reviews/:id', async (req, res, next) => {
  const reviewId = parseInt(req.params.id);
  if (Number.isNaN(reviewId)) {
    return res.status(404).json({ error: 'Review not found' });
  }
  try {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
});

// 4. POST /api/reviews - Create a new review.
app.post('/api/reviews', async (req, res, next) => {
  const { guestName, roomType, reviewText, sentiment } = req.body;
  if (!guestName || !roomType || !reviewText || !sentiment) {
    return res.status(400).json({ error: 'All fields (guestName, roomType, reviewText, sentiment) are required' });
  }
  try {
    const newReview = await prisma.review.create({
      data: { guestName, roomType, reviewText, sentiment },
    });
    res.status(201).json(newReview);
  } catch (err) {
    next(err);
  }
});

// 5. PUT /api/reviews/:id - Update a review completely.
app.put('/api/reviews/:id', async (req, res, next) => {
  const reviewId = parseInt(req.params.id);
  const { guestName, roomType, reviewText, sentiment } = req.body;

  try {
    const existing = Number.isNaN(reviewId)
      ? null
      : await prisma.review.findUnique({ where: { id: reviewId } });

    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (!guestName || !roomType || !reviewText || !sentiment) {
      return res.status(400).json({ error: 'All fields are required for update' });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { guestName, roomType, reviewText, sentiment },
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

// 6. DELETE /api/reviews/:id - Delete a review.
app.delete('/api/reviews/:id', async (req, res, next) => {
  const reviewId = parseInt(req.params.id);
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

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Close the Prisma connection pool on shutdown.
const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
