<div align="center">

# ⚡ URL Shortener

**Ultra-fast, privacy-first short links with passcode protection, instant QR codes, real-time analytics & Redis caching.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Documentation](#-in-app-docs) • [Author](#-author)

---

</div>

## 🌟 Features

- ⚡ **Sub-Millisecond 302 Redirection**: Instant routing powered by in-memory Redis caching with automated fallback to PostgreSQL.
- 🔒 **Passcode Protection**: Secure sensitive URLs behind an interactive `/unlock/[code]` challenge screen.
- 📱 **Instant QR Code Generation**: Downloadable high-contrast QR codes for marketing campaigns, physical flyers, and presentations.
- 📈 **Real-Time Analytics Engine**:
  - 7-Day interactive activity charts and click trends.
  - Referrer breakdown (Google, X / Twitter, LinkedIn, GitHub, Direct).
  - Device category (Desktop, Mobile, Tablet) and Operating System distribution.
  - IP-to-Country geolocation mapping via edge headers & cached resolver.
- 🏷️ **Custom Aliases & Branded Slugs**: Create memorable links (e.g. `/:campaign-slug`) with automatic collision protection against reserved system routes.
- ⏳ **Link Expiration & Auto-Deactivation**: Define time-limited links with automated Redis cache invalidation.
- 🔑 **Google OAuth Authentication**: Modern sign-in and session management powered by [Better Auth](https://better-auth.com).
- 🔌 **REST API Ready**: Developer-friendly endpoints with multi-language code snippets for programmatic link creation.
- 🖤 **Monochrome Brutalist Aesthetic**: High-contrast, minimalist UI with smooth 3D flip card animations.

---

## 🏛️ Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client / Browser         │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │    Next.js 16 App Router      │
                                  │     (Server Components)       │
                                  └───────┬──────────────┬────────┘
                                          │              │
                    ┌─────────────────────┘              └─────────────────────┐
                    ▼                                                          ▼
     ┌─────────────────────────────┐                            ┌─────────────────────────────┐
     │      Redis Memory Cache     │                            │     PostgreSQL Database     │
     │      (1-Hour TTL Cache)     │                            │       (Drizzle ORM)         │
     └─────────────────────────────┘                            └──────────────┬──────────────┘
                                                                               │
                                                                               ▼
                                                                ┌─────────────────────────────┐
                                                                │   Real-Time Analytics Engine │
                                                                │  (Edge Headers / IP Geo)    │
                                                                └─────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.17+ or v20+)
- **PostgreSQL Database** (local instance or [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- **Redis Server** (local instance or [Upstash](https://upstash.com))

### 2. Clone the Repository
```bash
git clone https://github.com/shinas101/url-shortener.git
cd url-shortener
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your configuration details:
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/url_shortener"

# Redis Cache
REDIS_URL="redis://localhost:6379"

# Better Auth Configuration
BETTER_AUTH_SECRET="generate-a-32-character-random-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 5. Apply Database Schema
```bash
npx drizzle-kit push
```

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔌 API Reference

### 1. Shorten URL
```http
POST /api/shorten
Content-Type: application/json
```

#### Request Payload
```json
{
  "url": "https://example.com/long-landing-page",
  "pass": "optionalPassword",
  "expireAt": "2026-12-31T23:59:59.000Z"
}
```

#### Response (`201 Created`)
```json
{
  "id": "e938bf8c-1e24-41d8-a1fb-c89b33a59df7",
  "shortCode": "k9xL2pQ",
  "originalUrl": "https://example.com/long-landing-page",
  "hasPassword": true,
  "shortUrl": "http://localhost:3000/k9xL2pQ"
}
```

---

### 2. Verify Password Protected URL
```http
POST /api/verify-password
Content-Type: application/json
```

#### Request Payload
```json
{
  "code": "k9xL2pQ",
  "password": "optionalPassword"
}
```

#### Response (`200 OK`)
```json
{
  "url": "https://example.com/long-landing-page"
}
```

---

## 📖 In-App Docs

The application includes an in-depth, interactive documentation center located at [`/docs`](http://localhost:3000/docs), featuring:
- Step-by-step user onboarding & feature walkthroughs.
- Interactive multi-language REST API code examples (cURL, JavaScript, Python).
- FAQ & privacy details.

---

## 🛠️ Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Starts production server |
| `npx drizzle-kit push` | Applies schema migrations to PostgreSQL |
| `npx drizzle-kit studio` | Opens local visual Drizzle database GUI |

---

## 🖤 Author

Crafted with 🖤 by **[shinas101](https://github.com/shinas101)**.

Contributions and feedback are welcome! Feel free to open an issue or pull request.
