# EchoLodge

The direct-booking site for **EchoLodge**, a twelve-room riverside lodge in
Laxman Jhula, Rishikesh. One property, not a marketplace: guests browse the
three room categories, check real availability, book directly, and review their
stay afterwards. Booking here means no travel-site commission in the middle.

## 🌐 Deployment

The application is fully deployed and publicly accessible.

### Live URLs

| Service | URL |
|---|---|
| **Live Frontend** (Vercel) | **https://echolodge.vercel.app** |
| **Live Backend / API** (Render) | **https://echolodge-00cc.onrender.com** |
| Backend health check | https://echolodge-00cc.onrender.com/api/health |

### Tech Stack

| Layer | Technology | Hosted on |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · NextAuth (Credentials + Google OAuth) | **Vercel** |
| **Backend** | Node.js · Express 5 · Zod validation · JWT auth · express-rate-limit | **Render** |
| **Database** | PostgreSQL via **Prisma ORM**, accessed through the transaction pooler | **Supabase** |
| **AI** | Google Gemini (`gemini-flash-latest`) — review sentiment analysis, drafted admin replies, and the trip-planning Concierge | Google AI Studio |

See [Architecture](#architecture) for how these fit together.

### Known Limitations on the Free Tier

Every service in this stack runs on a free plan. These are the constraints that
are actually visible in production, and what has been done about each.

**1. Render spins the backend down after ~15 minutes of inactivity.**
The next request then has to start the service from cold, which takes roughly
**30–60 seconds** — measured at 22s on this project. Because the homepage and
rooms page fetch live inventory on load, that delay is the first thing a visitor
would see.

*Mitigation:* the server keeps itself awake by pinging its own health check
every 12 minutes, using the `RENDER_EXTERNAL_URL` that Render injects (see
*Keep-alive* in `backend/server.js`). This runs inside the process, so it
narrows the window rather than closing it — a cold start is still possible
immediately after a deploy, before the first ping cycle. When it happens, the
rooms page explains the wait after 4 seconds instead of showing a spinner that
looks broken.

**2. Supabase pauses free projects after extended inactivity.**
Note that the keep-alive above does *not* prevent this: `/api/health`
deliberately avoids touching the database so it can report that the service is
up even when the database is not. Keeping the API warm therefore does not keep
Postgres warm. If the project has been idle for a long stretch, it may need to
be resumed from the Supabase dashboard before the site works.

**3. Free-tier compute is limited and single-instance.**
The API runs as one small shared-CPU instance with no horizontal scaling, so
throughput is modest. This is partly why booking writes use a Serializable
transaction and return a retryable `409` on conflict rather than relying on
application-level locking.

**4. Gemini's free tier is rate-limited.**
Under heavy use, review analysis can fail. This is handled rather than
surfaced: `analyzeReview` returns `null` on any failure, the review still saves
with empty AI fields, and an admin can re-run the analysis from the dashboard.
A guest's submission is never lost to an upstream outage.

**5. Vercel's Hobby plan is for non-commercial use.**
Taking real bookings for the lodge would require a paid plan.

**6. No payment processing.**
A booking is a reservation, not a paid transaction — there is no payment
gateway integrated. Guests settle at the property.

## Features

**Booking**
- Three room categories (Ganga View Balcony, Standard Balcony, Super Deluxe Ganga View Suite) across 12 rooms, driven entirely by the live inventory.
- Live availability shown *before* submitting: the modal queries `GET /api/rooms/availability` as soon as the dates are valid, clamps the quantity stepper to what is free, and disables the button when a category is full.
- Bookings are created inside a **Serializable** transaction, so two concurrent requests can never double-book the same room.
- Past-dated stays are rejected server-side, not just hidden by the date picker.

**Reviews**
- Publicly readable — no sign-in required to read them. Writing, editing and deleting require an account.
- Full-text search across review text, sentiment, guest name and room type.
- **Verified stay** badge: a review can be attached to one of the guest's own bookings. Ownership is resolved server-side, so the badge cannot be spoofed by the client, and each booking can back at most one review.
- Every review is run through Gemini on submit for sentiment, internal tags, and a drafted reply. If the AI call fails the review still saves, and an admin can re-run the analysis.

**Admin**
- Room catalogue management and a review inbox with AI-drafted replies.
- Admin rights are **not** grantable over the API. They are set only by whoever holds the database credentials, via `npm run set-admin`. `requireAdmin` re-reads the role from the database on every request, so revoking access takes effect immediately rather than waiting out a 30-day token.

**AI Concierge**
- `POST /api/ai/itinerary` builds a day-by-day Rishikesh itinerary anchored to the lodge. Prompt iterations are documented in `PROMPTS.md`.

## Environment Variables

Copy the example files and fill in real values (never commit the real `.env` files):

```bash
cp .env.example .env                  # frontend (NextAuth, Google OAuth, API URL)
cp backend/.env.example backend/.env  # backend (Supabase, JWT, Gemini, CORS)
```

- **Vercel (frontend):** `NEXT_PUBLIC_API_URL` → the live Render URL, plus `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Render (backend):** `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL` → the live Vercel URL

> `DATABASE_URL` uses Supabase's **transaction** pooler (port 6543) for app
> queries. `DIRECT_URL` must use the **session** pooler (port **5432**) — Prisma
> uses it for schema commands, and DDL cannot run through transaction-mode
> pooling (`prisma db push` will hang against 6543).

## Running Locally

Frontend:

```bash
npm install
npm run dev          # http://localhost:3000
```

Backend (in a second terminal):

```bash
cd backend
npm install
npx prisma generate
npm run dev          # http://localhost:5000
```

With `NEXT_PUBLIC_API_URL` unset, the frontend falls back to `http://localhost:5000`.

## Database

The Express API is backed by PostgreSQL through [Prisma](https://www.prisma.io/).
A relational database fits because bookings, reviews, rooms and users are highly
structured and genuinely related — a review points at the booking that justifies
it, and a booking points at both the room and the guest. Supabase's managed
Postgres also provides a transaction pooler, which keeps connections stable for
an API made of many short-lived requests.

### Schema

[![EchoLodge database schema](./EchoLodge_DatabaseSchema.png)](./EchoLodge_DatabaseSchema.png)

*Click the diagram to view it full size. Source of truth is
[`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma).*

Four tables, and the relationships are what carry the business rules:

- **User → Booking** — a guest holds many stays. `password` is nullable, because
  Google OAuth users never have one locally.
- **Room → Booking** — each booking reserves one specific room. Rooms are sold
  by `category`, so the API picks free rooms within a category and books them
  atomically.
- **User → Review** — `authorId` records who wrote a review, so only the author
  or an admin can edit it.
- **Booking → Review** — `bookingId` is what makes a review a **verified stay**.
  It is unique, so one stay backs at most one review, and `ON DELETE SET NULL`
  means deleting a booking downgrades the review to unverified rather than
  destroying the guest's words. It stays nullable so guests who booked at the
  front desk can still review.

`sentiment`, `aiTags` and `suggestedReply` on **Review** are written by the
Gemini pipeline, and are all nullable so a review still saves when the AI call
fails.

Point the project at your own database in three steps:

1. **Create a Supabase project** and copy both connection strings from
   **Project Settings → Database** (pooled `DATABASE_URL` on 6543, direct
   `DIRECT_URL` on 5432).
2. **Add them** to `backend/.env` (see `backend/.env.example`).
3. **Create the schema and seed it:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

### Backend scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with nodemon |
| `npm start` | Start the API (used by Render) |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Seed rooms and demo verified stays (idempotent) |
| `npm run set-admin -- <email>` | Grant ADMIN (`--revoke` to remove, `--list` to show) |

Seeding creates the 12-room inventory plus a few past guests with completed
bookings and reviews linked to them, so the "Verified stay" badge and the AI
review pipeline have something to demonstrate. The demo accounts are
passwordless and cannot be signed into. Re-running the seed is a no-op.

## Architecture

```
Browser ──► Vercel (Next.js App Router, NextAuth session)
               │
               │  Bearer JWT
               ▼
            Render (Express API, Zod validation, rate limiting)
               │                    │
               ▼                    ▼
        Supabase Postgres      Google Gemini
          (via Prisma)      (review analysis, concierge)
```

Authentication is split deliberately: NextAuth owns the browser session, while
the Express API issues and verifies its own JWT. Credential logins and Google
sign-ins both exchange through the backend, so a single token type reaches the
API regardless of how the guest signed in.
