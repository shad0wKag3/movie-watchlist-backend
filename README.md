# GDGoC Movie Watchlist & Review Platform Backend

Production-ready backend service built with Node.js ES Modules, Express.js, PostgreSQL (Neon), Prisma ORM, Zod, Bcryptjs, Jsonwebtoken, and Google Gemini API SDK (`@google/genai`).

Designed following a strict Layered Architecture and configured for seamless deployment to Vercel Serverless Functions.

---

## 🏛️ Architecture & Project Structure

The project implements a strict Layered Architecture:
```
Routes ──► Middlewares ──► Controllers ──► Services ──► Prisma Client / DB
```

```
Movie-watchlist-backend/
├── api/
│   └── index.js                   # Vercel serverless function entrypoint
├── data/
│   └── movies.json                # Official GDGoC 20 movies dataset
├── prisma/
│   ├── schema.prisma              # Prisma PostgreSQL schema
│   └── seed.js                    # Seeder script populating 20 movies
├── src/
│   ├── config/
│   │   └── env.js                 # Environment configuration & defaults
│   ├── errors/
│   │   └── appError.js            # Custom semantic HTTP error class
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT Bearer Token verification
│   │   ├── error.middleware.js    # Global error handler & Prisma P2002 mapping
│   │   ├── notFound.middleware.js # 404 route handler
│   │   └── validate.middleware.js # Zod validation schema runner
│   ├── validations/
│   │   ├── auth.validation.js     # Auth request schemas
│   │   ├── movie.validation.js    # Movie query & ID schemas
│   │   ├── watchlist.validation.js# Watchlist request schemas
│   │   └── watched.validation.js  # Watched history request schemas
│   ├── services/
│   │   ├── auth.service.js        # User registration & password hashing
│   │   ├── movie.service.js       # Movie retrieval, search & shuffle
│   │   ├── watchlist.service.js   # Watchlist management & duplicate handling
│   │   ├── watched.service.js     # Review & history management
│   │   └── ai.service.js          # Google Gemini 2.5 Flash In-Context Grounding
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── movie.controller.js
│   │   ├── watchlist.controller.js
│   │   └── watched.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── movie.routes.js
│   │   ├── watchlist.routes.js
│   │   ├── watched.routes.js
│   │   └── index.js               # Main API router (/api)
│   ├── prisma.js                  # Singleton Prisma Client instance
│   ├── app.js                     # Express application definition
│   └── server.js                  # Local development server entrypoint
├── tests/
│   ├── unit/                      # Unit test suite
│   │   ├── auth.service.test.js
│   │   ├── movie.service.test.js
│   │   ├── watchlist.service.test.js
│   │   ├── watched.service.test.js
│   │   └── ai.service.test.js
│   └── integration/               # Integration test suite (Supertest)
│       ├── auth.test.js
│       ├── movies.test.js
│       ├── watchlist.test.js
│       ├── watched.test.js
│       └── ai.test.js
├── .env.example
├── jest.config.js
├── vercel.json                    # Vercel serverless deployment config
└── package.json
```

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

- **User**: ID (UUID), email (unique), password_hash, name, created_at.
- **Movie**: ID (Autoincrement Int), title, overview, release_year, genres (`String[]`), poster_url, rating, duration, created_at.
- **Watchlist**: ID (UUID), user_id, movie_id, created_at. Unique compound index `@@unique([user_id, movie_id])`.
- **Watched**: ID (UUID), user_id, movie_id, rating (1-5), review_text, watched_at. Unique compound index `@@unique([user_id, movie_id])`.

---

## 🚀 API Endpoints (10 Endpoints under `/api`)

### 1. Authentication
- `POST /api/auth/register` (Public)
  - Body: `{ "email": "user@example.com", "password": "password123", "name": "John Doe" }`
  - Returns: `201 Created`
- `POST /api/auth/login` (Public)
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `200 OK` with JWT Bearer Token

### 2. Movies Catalog & AI Recommendation
- `GET /api/movies` (Public)
  - Query parameters: `?search=inception&shuffle=true&genre=Sci-Fi`
  - Returns: `200 OK` with filtered or shuffled candidate list
- `GET /api/movies/:id` (Public)
  - Returns: `200 OK` or `404 Not Found`
- `POST /api/movies/recommend` (Public / Optional Auth)
  - Body: `{ "prompt": "I want an emotional and visually breathtaking space journey" }`
  - Powered by: **Google Gemini API (`gemini-2.5-flash`)** with strict **In-Context Grounding** against local PostgreSQL candidate movies and defensive cross-checking.
  - Returns: `200 OK` with `{ "movie": { ... }, "reasoning": "..." }`

### 3. User Watchlist (Protected - Bearer Token)
- `GET /api/watchlist` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `200 OK` with user's saved movies
- `POST /api/watchlist` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "movieId": 1 }`
  - Returns: `201 Created` (Handles duplicate insertions via Prisma P2002 error mapping returning `409 Conflict`)
- `DELETE /api/watchlist/:movieId` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `200 OK` with confirmation or `404 Not Found`

### 4. Viewing History & Reviews (Protected - Bearer Token)
- `GET /api/watched` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `200 OK` with user's viewing history, ratings (1-5), and written reviews
- `POST /api/watched` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "movieId": 1, "rating": 5, "reviewText": "Absolute masterpiece!" }`
  - Returns: `201 Created`

---

## 🤖 Google Gemini AI Grounding Engine

The `/api/movies/recommend` endpoint implements strict in-context grounding:
1. Fetches candidate movies dynamically from PostgreSQL via Prisma.
2. Injects candidate catalog into a strict System Instruction.
3. Configures Gemini with:
   - Model: `gemini-2.5-flash`
   - `temperature: 0.3` (for deterministic, high-precision recommendations)
   - `responseMimeType: 'application/json'`
4. Performs defensive cross-checking against local DB: if Gemini ever outputs an ungrounded or non-catalog ID, it gracefully falls back to a verified catalog candidate.

---

## 🛠️ Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```env
PORT=5000
DATABASE_URL="your-neon-pooled-database-url"
DIRECT_URL="your-neon-direct-database-url"
JWT_SECRET="your-jwt-secret-key"
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. Database Push & Seeding
```bash
npx prisma db push
npm run prisma:seed
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```

---

## ☁️ Deployment to Vercel

1. Push your repository to GitHub.
2. Import repository in [Vercel](https://vercel.com).
3. Set the following Environment Variables in the Vercel project settings:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
4. Deploy! The included `vercel.json` and `api/index.js` handle serverless routing automatically.

