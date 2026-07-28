This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## 🌐 Live Deployment

| | URL |
|---|---|
| **Live Frontend (Vercel)** | `<YOUR_VERCEL_URL — e.g. https://echolodge.vercel.app>` |
| **Live Backend (Render)** | `<YOUR_RENDER_URL — e.g. https://echolodge-api.onrender.com>` |

> Known limitations on free tier: The Render backend free tier spins down after 15 minutes of inactivity. The first request after being idle takes 30–60 seconds to wake up.

### Tech Stack

- **Frontend:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · NextAuth (Credentials + Google OAuth) — deployed on **Vercel**
- **Backend:** Node.js · Express 5 · Zod validation · JWT auth · express-rate-limit — deployed on **Render**
- **Database:** PostgreSQL on **Supabase** (transaction pooler) via **Prisma ORM**
- **AI:** Google Gemini (`gemini-flash-latest`) — review sentiment analysis, drafted admin replies, and the trip-planning AI Concierge

### Environment Variables

Copy the example files and fill in real values (never commit the real `.env` files):

```bash
cp .env.example .env                  # frontend (NextAuth, Google OAuth, API URL)
cp backend/.env.example backend/.env  # backend (Supabase, JWT, Gemini, CORS)
```

- **Vercel (frontend):** `NEXT_PUBLIC_API_URL` → the live Render URL, plus `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Render (backend):** `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL` → the live Vercel URL

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## How to run the backend locally
1. `cd backend`
2. `npm install`
3. `npm run dev`

## Database Integration (Week 5)

The Express API is backed by a relational database accessed through the [Prisma](https://www.prisma.io/) ORM. The `Review` entity (guest name, room type, review text, sentiment, and a `createdAt` timestamp) is persisted in PostgreSQL and exposed via full CRUD routes at `/api/reviews`.

### Database Choice

**PostgreSQL, hosted on [Supabase](https://supabase.com/).** A relational database is a natural fit here because guest reviews are highly structured entities with a consistent, well-defined shape — every record shares the same typed columns, which keeps the data clean and easy to query, sort, and extend with relations later. Supabase's managed Postgres also provides a built-in **transaction pooler**, which keeps connections from the Express API stable and efficient (especially important when many short-lived API requests open and close connections).

### Database Setup

Another developer can point this project at their own database in three steps:

1. **Create a Supabase project** at [supabase.com](https://supabase.com/) and, from **Project Settings → Database**, copy the connection strings (both the pooled `DATABASE_URL` and the direct `DIRECT_URL`).
2. **Add the connection strings** to an environment file by copying `.env.example` and filling in the real values (the backend reads these from `backend/.env`):
   ```bash
   cp .env.example backend/.env
   # then edit backend/.env and paste your Supabase connection strings
   ```
3. **Generate the Prisma client** so the app can talk to the database:
   ```bash
   cd backend
   npx prisma generate
   ```

### Schema Diagram

![Database Schema](./W5_SchemaDiagram_TBI-26101274.png)
