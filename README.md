# DevConnect 🚀

> A full-stack developer social platform and dynamic portfolio network built for developers to showcase GitHub repositories, publish code snippets, engage in nested technical discussions, and build a public presence.

---

## 📌 Problem & Solution

* **The Problem:** Traditional developer portfolios are static HTML files or flat resume sites that recruiters inspect once. Developers lack an active community space where they can showcase continuous code contributions, discuss technical topics, and demonstrate live project activity through their GitHub repositories.
* **The Solution:** DevConnect transforms static portfolios into an active social platform featuring real-time GitHub REST API synchronization, high-speed full-text search, sub-100ms cursor-paginated newsfeeds, and recursive nested discussion threads.

---

## ✨ Key Features

- 👤 **Developer Profiles & GitHub Sync:** Public developer showcase with live GitHub repository integration cached in Redis.
- 📝 **Code Posts & Media Uploads:** Publish technical snippets and media attachments powered by Cloudinary and Multer.
- 💬 **Recursive Nested Comments:** Self-referencing discussion threads supporting multi-level replies (`parent_comment_id`).
- ⚡ **Cursor-Based Newsfeed:** High-performance feed ordering by timestamp, eliminating duplicate items and page drift during infinite scroll.
- 🔍 **PostgreSQL Full-Text Search:** Relevance-ranked full-text search across posts and profiles using `tsvector` generated columns and GIN indexing.
- 🔐 **Dual-Token Authentication:** Secure 15-minute access token (in-memory) + 7-day refresh token rotation with server-side revocation in PostgreSQL.
- 🛡️ **API Rate Limiting & Protection:** Built-in rate limiting (`express-rate-limit`) on sensitive write and authentication endpoints.

---

## ⚡ Performance Benchmarks

| Metric | Before | After | Optimization Strategy |
|---|---|---|---|
| **Feed Query Latency (2,000+ posts)** | `2.540 ms` | `0.091 ms` (**96% faster**) | Added B-Tree index on `posts.created_at DESC` + Cursor Pagination |
| **GitHub Repos API Fetch** | `587 ms` | `9 ms` (**98% faster**) | Redis response caching with a 10-minute TTL |

---

## 🏗️ Technical Architecture & Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string email
        string password_hash
        timestamp created_at
    }
    PROFILES {
        int id PK
        int user_id FK
        string username
        text bio
        string skills
        string experience
        string education
        string social_links
    }
    FOLLOWS {
        int follower_id FK
        int followed_id FK
        timestamp created_at
    }
    POSTS {
        int id PK
        int user_id FK
        text content
        string image_url
        timestamp created_at
        tsvector search_vector
    }
    COMMENTS {
        int id PK
        int post_id FK
        int user_id FK
        int parent_comment_id FK
        text content
        timestamp created_at
    }
    LIKES {
        int user_id FK
        int post_id FK
        timestamp created_at
    }
    REFRESH_TOKENS {
        int id PK
        int user_id FK
        text token
        timestamp created_at
        timestamp expires_at
    }

    USERS ||--|| PROFILES : "has"
    USERS ||--o{ POSTS : "creates"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ LIKES : "gives"
    USERS ||--o{ REFRESH_TOKENS : "owns"
    POSTS ||--o{ COMMENTS : "contains"
    POSTS ||--o{ LIKES : "receives"
    COMMENTS ||--o{ COMMENTS : "parent"
    USERS ||--o{ FOLLOWS : "follower"
    USERS ||--o{ FOLLOWS : "followed"
```

---

## 💻 Tech Stack

* **Frontend:** Next.js (App Router), React, Vanilla CSS / CSS Modules
* **Backend:** Node.js, Express.js, Multer
* **Database:** PostgreSQL (with Connection Pooling, `tsvector` & GIN Indexes)
* **Caching & In-Memory Storage:** Redis
* **Authentication:** JWT (Short-Lived Access + Persisted Refresh Tokens), bcrypt
* **Media Management:** Cloudinary API
* **Testing:** Vitest, Supertest

---

## 🔒 Authentication & Token Lifecycle

1. **Login (`POST /api/auth/login`):** Validates credentials using `bcrypt.compare`. Issues a short-lived **15-minute Access Token** returned to client state and a **7-day Refresh Token** saved in the `refresh_tokens` table and set via secure `HTTP-Only` cookie.
2. **Authorized Requests:** Client passes the access token in the `Authorization: Bearer <token>` header. Express middleware checks signature statelessly in `<1ms`.
3. **Silent Refresh (`POST /api/auth/refresh`):** When the access token expires, client calls refresh route. Server verifies against the `refresh_tokens` DB table and issues a new access token.
4. **Logout (`POST /api/auth/logout`):** Deletes the refresh token from PostgreSQL and clears cookies, revoking session renewal across all devices.

---

## 📑 API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate user & issue tokens |
| `POST` | `/api/auth/refresh` | No | Rotate access token using valid refresh token |
| `POST` | `/api/auth/logout` | Yes | Revoke refresh token & end session |
| `GET` | `/api/profile/:username` | No | Fetch public developer profile & skills |
| `POST` | `/api/profile` | Yes | Create or update user profile |
| `GET` | `/api/posts` | No | Get cursor-paginated newsfeed |
| `POST` | `/api/posts` | Yes | Publish code post or upload media |
| `POST` | `/api/posts/upload-image` | Yes | Upload image asset to Cloudinary |
| `GET` | `/api/search` | No | Full-text search posts and profiles |
| `GET` | `/api/github/:username/repos` | No | Cached GitHub repos fetch |

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Redis Server (running locally or remote URI)

### 1. Repository Setup
```bash
git clone https://github.com/TusharVerma/DevConnect.git
cd DevConnect
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/` using `.env.example`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/devconnect
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Seed the PostgreSQL database schema:
```bash
psql -U postgres -d devconnect -f schema.sql
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup (in a separate terminal)
```bash
cd ../client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

DevConnect includes integration tests covering authentication, route authorization, and post feeds.

```bash
cd server
npm run test
```
*12/12 passing integration tests powered by **Vitest** & **Supertest**.*

---

## 📐 Scalability & Architectural Trade-offs

1. **Read vs Write Optimization in Newsfeed:** 
   Currently uses a *Pull-on-Read* model filtered by follow relationships. At 100x scale, high-volume users would transition to a *Push-on-Write (Fan-out)* architecture utilizing Redis Sorted Sets (`ZADD`).
2. **Cursor vs Offset Pagination:** 
   Chosen cursor-based pagination for $O(1)$ query speed over arbitrary page jumping.
3. **In-Memory vs Distributed Caching:** 
   Redis was selected over in-memory JS objects to ensure cache survival across server restarts and load-balanced node clusters.


