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
// Render injects PORT at runtime; 5000 is the local dev fallback.
const PORT = process.env.PORT || 5000;

// Render terminates TLS at its edge proxy and forwards the real client IP in
// X-Forwarded-For. Without this, req.ip is the proxy's address for every
// request — which silently collapses any IP-keyed rate limiter into a single
// global bucket shared by all users. One hop, so trust exactly one.
app.set('trust proxy', 1);

// CORS: the production Vercel origin comes from FRONTEND_URL; localhost stays
// allowed so the deployed API can also be hit from a local dev frontend.
// Requests with no Origin header (curl, health checks, server-to-server calls
// like NextAuth's authorize()) are always allowed.
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g. https://echolodge.vercel.app
  'http://localhost:3000',
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
app.use(express.json());

// Health check — lets Render (and humans) verify the service is up without
// touching the database.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

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
  // Rejected CORS origins are a client problem, not a server crash.
  if (err.message && err.message.includes('not allowed by CORS')) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
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
