const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// In-memory data
let reviews = [
  { id: 1, guestName: 'Alice', roomType: 'Suite', reviewText: 'Amazing stay!', sentiment: 'positive' },
  { id: 2, guestName: 'Bob', roomType: 'Standard', reviewText: 'Good value for money.', sentiment: 'neutral' },
  { id: 3, guestName: 'Charlie', roomType: 'Deluxe', reviewText: 'Very noisy at night.', sentiment: 'negative' }
];

// Routes

// 2. GET /api/reviews/search - Search reviews by q query parameter matching text or sentiment.
app.get('/api/reviews/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query "q" is required' });
  }
  const query = q.toLowerCase();
  const filteredReviews = reviews.filter(
    (review) =>
      review.reviewText.toLowerCase().includes(query) ||
      review.sentiment.toLowerCase().includes(query)
  );
  res.status(200).json(filteredReviews);
});

// 1. GET /api/reviews - List all reviews.
app.get('/api/reviews', (req, res) => {
  res.status(200).json(reviews);
});

// 3. GET /api/reviews/:id - Get a single review by ID.
app.get('/api/reviews/:id', (req, res) => {
  const reviewId = parseInt(req.params.id);
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  res.status(200).json(review);
});

// 4. POST /api/reviews - Create a new review.
app.post('/api/reviews', (req, res) => {
  const { guestName, roomType, reviewText, sentiment } = req.body;
  if (!guestName || !roomType || !reviewText || !sentiment) {
    return res.status(400).json({ error: 'All fields (guestName, roomType, reviewText, sentiment) are required' });
  }
  const newId = reviews.length > 0 ? Math.max(...reviews.map((r) => r.id)) + 1 : 1;
  const newReview = { id: newId, guestName, roomType, reviewText, sentiment };
  reviews.push(newReview);
  res.status(201).json(newReview);
});

// 5. PUT /api/reviews/:id - Update a review completely.
app.put('/api/reviews/:id', (req, res) => {
  const reviewId = parseInt(req.params.id);
  const { guestName, roomType, reviewText, sentiment } = req.body;
  const reviewIndex = reviews.findIndex((r) => r.id === reviewId);
  
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }
  if (!guestName || !roomType || !reviewText || !sentiment) {
    return res.status(400).json({ error: 'All fields are required for update' });
  }
  
  reviews[reviewIndex] = { id: reviewId, guestName, roomType, reviewText, sentiment };
  res.status(200).json(reviews[reviewIndex]);
});

// 6. DELETE /api/reviews/:id - Delete a review.
app.delete('/api/reviews/:id', (req, res) => {
  const reviewId = parseInt(req.params.id);
  const reviewIndex = reviews.findIndex((r) => r.id === reviewId);
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }
  reviews.splice(reviewIndex, 1);
  res.status(204).send();
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
