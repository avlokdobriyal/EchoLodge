const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const router = express.Router();

const SALT_ROUNDS = 12;
// Must cover the NextAuth session lifetime (30d default) — a shorter backend
// token dies mid-session and every authorized call starts silently 401ing.
const JWT_EXPIRES_IN = '30d';

// --- Rate limiting --------------------------------------------------------
// IMPORTANT: /login is not called by the browser. NextAuth's authorize() runs
// on the Vercel server, so every credential login in production arrives from
// the same handful of Vercel egress IPs. An IP-keyed limiter here is really a
// single global bucket — five guests signing in would lock out everyone else.
// So brute-force protection is keyed by the account being targeted instead,
// which is what we actually want to protect. /register and /oauth are keyed by
// IP (register is called browser-direct, so the IP is the real client's).
function emailKey(req) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  // Fall back to the IP for malformed bodies so the limiter is never keyless.
  return email || ipKeyGenerator(req.ip);
}

// Per-account brute-force guard: 10 failed sign-ins per account per 15 minutes.
// Successful logins are not counted, so a legitimate guest is never locked out
// by their own activity.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  skipSuccessfulRequests: true,
  message: { error: 'Too many sign-in attempts for this account. Please try again in 15 minutes.' },
});

// Signup abuse guard: 10 new accounts per IP per hour.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this network. Please try again later.' },
});

// The OAuth bridge only runs after Google has already authenticated the user,
// so this is a runaway-loop backstop rather than a security control.
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  message: { error: 'Too many sign-in attempts. Please try again shortly.' },
});

// --- Validation schemas --------------------------------------------------
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const oauthSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Strip the password before returning a user over the wire.
function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// --- POST /api/auth/register --------------------------------------------
router.post('/register', registerLimiter, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { email, password, name } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || null },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/auth/login ------------------------------------------------
router.post('/login', loginLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Same generic error whether the email is unknown or the password is wrong.
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.status(200).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/auth/oauth ------------------------------------------------
// Bridge for NextAuth OAuth (Google) sign-ins: upsert a passwordless user and
// mint a backend JWT so OAuth users can reach the protected review routes.
router.post('/oauth', oauthLimiter, async (req, res, next) => {
  const parsed = oauthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  }
  const { email, name } = parsed.data;

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined },
      create: { email, name: name || null, password: null },
    });

    const token = signToken(user);
    res.status(200).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
