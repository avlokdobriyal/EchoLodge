// Single source of truth for the Express API's origin.
//
// NEXT_PUBLIC_ variables are inlined into the client bundle at build time, so
// the reference below must stay a static `process.env.NEXT_PUBLIC_API_URL`
// (no destructuring or dynamic lookup). On Vercel this bakes in the live
// Render URL; locally it's unset and falls back to the dev backend.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
