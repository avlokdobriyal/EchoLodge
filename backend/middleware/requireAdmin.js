// Authorization gate for admin-only routes. MUST run after requireAuth, which
// populates req.user (including the role claim decoded from the JWT). Grants
// access only when the role is exactly "ADMIN"; otherwise 403 Forbidden.
function requireAdmin(req, res, next) {
  if (!req.user) {
    // Defensive: requireAuth should always run first.
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = requireAdmin;
