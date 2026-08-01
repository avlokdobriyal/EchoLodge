const prisma = require('../lib/prisma');

// Authorization gate for admin-only routes. MUST run after requireAuth, which
// populates req.user from the verified JWT.
//
// The role claim inside the JWT is a 30-day snapshot taken at sign-in, so it
// goes stale: revoking someone's admin rights in the database would otherwise
// leave their existing token working for up to a month. The database is the
// single source of truth for privilege, so this re-reads it on every admin
// request. That costs one indexed primary-key lookup on the handful of
// admin-only endpoints — a fair price for revocation that takes effect
// immediately.
//
// Promotion to ADMIN is deliberately not exposed over the API: it is done by
// the owner with `npm run set-admin` (see backend/scripts/set-admin.js).
async function requireAdmin(req, res, next) {
  if (!req.user) {
    // Defensive: requireAuth should always run first.
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { role: true },
    });

    if (!user) {
      // Token is validly signed but the account is gone.
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Keep req.user consistent with the authoritative value.
    req.user.role = user.role;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAdmin;
