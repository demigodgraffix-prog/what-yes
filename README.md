# WhatYes - Live Auction Platform

A Whatnot-style live auction marketplace built with Next.js, Prisma, and Supabase.

## Features

- **Live Auctions** - Real-time bidding with Socket.IO/Pusher
- **Seller Tiers** - Bronze (8%), Silver (7.5%), Gold (6%), Platinum (5%) commission rates
- **Promotions** - Bump, Featured, Promoted, Spotlight listings
- **Authentication** - Session-based auth with bcrypt password hashing

## Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Pusher / Socket.IO
- **Auth**: Custom session-based authentication

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `DIRECT_URL` - Direct database connection for migrations
- `JWT_SECRET` - Secret key for authentication

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Push Schema to Database

```bash
npx prisma db push
```

### 5. Seed the Database

```bash
npm run db:seed
```

This creates the seller tiers (Bronze, Silver, Gold, Platinum).

### 6. Start Development Server

```bash
npm run dev:all
```

This starts both:
- Next.js app on `http://localhost:3000`
- Socket.IO server on `http://localhost:3001`

## Project Structure

```
whatyes/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed seller tiers
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/    # Authentication API
│   │   │   └── seller/  # Seller promotions API
│   │   ├── admin/       # Admin dashboard
│   │   ├── seller/      # Seller dashboard
│   │   └── page.tsx     # Home page
│   ├── components/      # React components
│   ├── lib/
│   │   ├── auth.ts      # Auth utilities
│   │   ├── prisma.ts    # Prisma client
│   │   ├── tiers.ts     # Seller tier config
│   │   └── revenue.ts   # Revenue calculations
│   └── stores/          # Zustand stores
└── server.js            # Socket.IO server
```

## Seller Tiers

| Tier | Commission | Min Sales | Min Revenue |
|------|------------|-----------|-------------|
| 🥉 Bronze | 8.0% | 0 | $0 |
| 🥈 Silver | 7.5% | 50 | $10,000 |
| 🥇 Gold | 6.0% | 200 | $50,000 |
| 💎 Platinum | 5.0% | 500 | $200,000 |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth` | POST | Register/Login |
| `/api/auth` | GET | Get session |
| `/api/auth` | DELETE | Logout |
| `/api/seller/promotions` | GET/POST/PATCH | Manage promotions |

## License

MIT

## Deployment

### Netlify Deployment

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Set Environment Variables** in Netlify dashboard:
   - `DATABASE_URL` - PostgreSQL connection string (with `?pgbouncer=true` for connection pooling)
   - `DIRECT_URL` - Direct PostgreSQL connection string for migrations
   - `MUX_TOKEN_ID` - Mux API token ID
   - `MUX_TOKEN_SECRET` - Mux API token secret
   - `PUSHER_APP_ID` - Pusher app ID
   - `PUSHER_SECRET` - Pusher secret key
   - `NEXT_PUBLIC_PUSHER_APP_KEY` - Pusher public key
   - `NEXT_PUBLIC_PUSHER_CLUSTER` - Pusher cluster (e.g., `us2`)

3. **Deploy**: Push to your main branch or trigger a deploy

The `netlify.toml` is already configured with:
- Prisma client generation
- Next.js plugin for optimal deployment
- Proper Node.js version (20)
- Security headers

### Important Notes

- The standalone Socket.IO server (`server.js`) is not used on Netlify - real-time features use Pusher instead
- API routes are deployed as Netlify Functions
- Database migrations should be run manually: `npx prisma db push`
