# HackMatch

Hackathon teammate matching platform — React frontend + Express backend + **Supabase PostgreSQL**.

## What you need to provide (Supabase setup)

Create a free project at [supabase.com](https://supabase.com), then give yourself these values in `backend/.env`:

| Variable | Where to find it |
|----------|------------------|
| `DATABASE_URL` | **Project Settings → Database → Connection string → URI** (use Session pooler for production, Direct for local dev) |
| `JWT_SECRET` | Generate any long random string (e.g. `openssl rand -hex 32`) |
| `CORS_ORIGIN` | Your frontend URL, e.g. `http://localhost:5173` |

Optional (for future Supabase Auth / Storage / Realtime):

| Variable | Where to find it |
|----------|------------------|
| `SUPABASE_URL` | **Project Settings → API → Project URL** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → service_role** (keep secret, server-only) |

### Setup steps

1. Copy env files:
   ```bash
   cp backend/.env.example backend/.env
   cp react-frontend/.env.example react-frontend/.env
   ```

2. Paste your `DATABASE_URL` into `backend/.env`.

3. Run the schema (either way):
   - **Auto**: Start the backend — it runs `schema.sql` on boot.
   - **Manual**: Paste `supabase/migrations/00001_init.sql` into Supabase **SQL Editor → Run**.

4. Seed demo users (optional):
   ```bash
   cd backend && npm run seed
   ```
   Log in with `alice@example.com` / `password123`.

5. Run dev:
   ```bash
   make dev
   ```

## Stack Clash (chat unlock)

Before encrypted chat opens, both teammates must submit a valid solution to the **same coding challenge** (picked per connection). Challenges include:

- Return True, Sum Two Numbers, Reverse String, FizzBuzz, First Element, Is Even

Users can click **Reveal Answer** to see the reference solution if stuck.

## Environment reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection URI |
| `JWT_SECRET` | Yes | Token signing secret |
| `CORS_ORIGIN` | Yes | Frontend origin |
| `PORT` | No | Default `5000` |
| `DATABASE_SSL` | No | Default `true` |

### Frontend (`react-frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL, e.g. `http://localhost:5000` |

## Deploy

- **Backend**: Railway, Render, Fly.io (set `DATABASE_URL` + env vars)
- **Frontend**: Vercel (`VITE_API_URL` → your API)
