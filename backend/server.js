const express = require('express');
const cors = require('cors');
// quiet: dotenv v17 prints promotional "tips" to stdout on every load
require('dotenv').config({ quiet: true });
const prisma = require('./lib/prisma');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Auth routes (rate limiting is applied inside the router).
app.use('/api/auth', authRoutes);

// Feature routes (per-route auth/admin guards applied inside each router).
app.use('/api/reviews', reviewRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// AI concierge routes (requireAuth applied inside the router).
app.use('/api/ai', aiRoutes);

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
