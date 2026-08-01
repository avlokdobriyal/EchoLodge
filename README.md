# EchoLodge

The direct-booking site for **EchoLodge**, a twelve-room riverside lodge in
Laxman Jhula, Rishikesh. One property, not a marketplace: guests browse the
three room categories, check real availability, book directly, and review their
stay afterwards. Booking here means no travel-site commission in the middle.

## 🌐 Live Deployment

| | URL |
|---|---|
| **Frontend (Vercel)** | https://echolodge.vercel.app |
| **Backend (Render)** | https://echolodge-00cc.onrender.com |

> **Free-tier note:** Render spins a free service down after ~15 minutes of
> inactivity, and the next request pays a 30–60s cold start. The server now
> keeps itself warm by pinging its own health check every 12 minutes (see
> `Keep-alive` in `backend/server.js`), so this should only be visible right
> after a deploy. The rooms page explains the wait if it does happen.

### Tech Stack

- **Frontend:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · NextAuth (Credentials + Google OAuth) — deployed on **Vercel**
- **Backend:** Node.js · Express 5 · Zod validation · JWT auth · express-rate-limit — deployed on **Render**
- **Database:** PostgreSQL on **Supabase** (transaction pooler) via **Prisma ORM**
- **AI:** Google Gemini (`gemini-flash-latest`) — review sentiment analysis, drafted admin replies, and the trip-planning AI Concierge

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
