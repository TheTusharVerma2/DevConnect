---
project: DevConnect
track: full-stack
level: beginner-to-intermediate
started: 2026-08-31
shipped: 
repo: 
live: 
---

# 1. What this project is
<Two sentences. Explain it to a non-technical friend, then to an engineer.>

# 2. Problem it solves
<Why would anyone run this? If the honest answer is "it was a tutorial",
 change the project until there is a real answer.>

# 3. Architecture
<Paste an ASCII or image diagram. Every box must be something you can explain.>

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
​```

## Components
- **users** → auth identity (email, password) → separated from profile data so public-facing reads never touch sensitive auth fields
- **profiles** → public-facing user data (bio, skills, socials) → one-to-one with users
- **follows** → many-to-many self-relationship between users → join table instead of a list column, so it scales past 10M followers without rewriting a growing list on every follow
- **posts** → user-generated content → `created_at` doubles as the cursor for cursor-based pagination
- **comments** → self-referencing via `parent_comment_id` → enables nested replies without a separate table
- **likes** → many-to-many between users and posts → join table with composite PK `(user_id, post_id)` enforces "no duplicate likes" at the DB level, not in app code

# 4. Key decisions and trade-offs
| Decision | Options I considered | What I chose | Why | What I gave up |
|---|---|---|---|---|
| Feed query indexing | No index vs. index on posts.created_at | Added idx_posts_created_at (B-tree index on created_at DESC) | Measured with EXPLAIN ANALYZE on 2,000 seeded posts: without the index Postgres did a Seq Scan (2.540 ms); with it, an Index Scan (0.091 ms) — a ~96% reduction, and the gap only widens as the table grows | Slightly slower writes, since every INSERT now also updates the index — negligible at this scale |


| GitHub API response caching | In-memory JS object vs. Redis | Redis | Survives server restarts, and would work correctly if scaled to multiple server instances (in-memory caches don't share across processes) | More setup — an extra running service to install, run, and connect to, which isn't strictly necessary at this project's current scale |

# 5. Skills demonstrated
- [ ] <skill>    evidence: <file / commit / endpoint that proves it>
- [ ] <skill>    evidence: <...>

- [x] Node.js ↔ PostgreSQL connection via connection pooling    evidence: server/db.js, GET /api/db-test
- [x] Password hashing with bcrypt, parameterized SQL queries    evidence: server/routes/auth.js POST /register
- [x] JWT-based auth: access/refresh token issuance on login    evidence: server/routes/auth.js POST /login
- [x] Real logout with server-side token revocation (not just client-side)    evidence: server/routes/auth.js, refresh_tokens table
- [x] Profile creation with ownership enforced via JWT (req.userId, not client-supplied)    evidence: server/routes/profile.js POST /
- [x] Public profile lookup with explicit column selection (never SELECT *, never exposes users.email)    evidence: server/routes/profile.js GET /:username
- [x] Image upload via Cloudinary + multer (memory storage, base64 conversion)    evidence: server/routes/posts.js POST /upload-image
- [x] PostgreSQL full-text search (tsvector + GIN index) across posts and profiles, ranked by relevance    evidence: server/routes/search.js, migration adding search_vector columns
- [x] Rate limiting on write endpoints (express-rate-limit, 429 responses confirmed)    evidence: server/index.js, /api/posts and /api/auth
- [x] Automated test suite (Vitest + Supertest) covering auth register/login, including security regression test (password_hash never returned)    evidence: server/tests/auth.test.js, 5/5 passing
- [x] Test coverage for 2+ core routes (auth: register/login; posts: create/feed), 10 tests total, all passing    evidence: server/tests/auth.test.js, server/tests/posts.test.js

# 6. Numbers I measured
| Metric | Before | After | How I measured it |
|---|---|---|---|

| Feed query execution time (LIMIT 10, 2001 seeded posts) | 2.540 ms | 0.091 ms | EXPLAIN ANALYZE in psql, before/after adding an index on posts.created_at |

| GitHub repos fetch (single user) | 587 ms | 9 ms | `time curl` on GET /api/github/:username/repos, first call vs. immediate second call, Redis cache with 10-min TTL |
# 7. Things that broke and how I fixed them
1. Symptom: curl to localhost:5000/api/health returned 403 "Access denied" even though the server logged "running on port 5000" with no errors
   Cause:   macOS's AirPlay Receiver (Control Center) listens on port 5000 by default and intercepted the request before it ever reached Express
   Fix:     Changed the server to run on port 4000 instead
   Lesson:  On Mac, avoid port 5000 (and 7000, also used by AirPlay) for local dev servers — check `lsof -i :<port>` early when a server "runs" but doesn't respond as expected.
2. Symptom: Duplicate registration with an already-used email returned a generic 
   500 "Registration failed" error instead of a clear message
   Cause:   The UNIQUE constraint on users.email correctly rejected the duplicate 
   at the database level, but the catch block treated all errors the same way, 
   masking an expected case as a server failure
   Fix:     Checked err.code === '23505' (Postgres's unique-violation code) in 
   the catch block and returned a 409 Conflict with a specific "Email already 
   registered" message instead
   Lesson: in case of unique-violation, return 409 conflict , else return 500 internal-server-error.
3. Symptom: POST /login crashed with "Error: secretOrPrivateKey must have a value" 
   even though registration worked fine and the database query succeeded
   Cause:   JWT_SECRET and JWT_REFRESH_SECRET were referenced in jwt.sign() but 
   were never actually added to .env — process.env.JWT_SECRET was undefined
   Fix:     Generated two random secrets with crypto.randomBytes(32).toString('hex'), 
   added them to .env, restarted the server (nodemon doesn't reload .env changes)
   Lesson:  JWT_SECRET and JWT_REFRESH_SECRET env variables must always be present 
   in .env for the jwt.sign() method to work properly. Always generate and add them 
   before using jwt.sign() to avoid runtime errors.
4. Symptom: POST /refresh returned "invalid signature" even though login worked 
   and the refresh token looked correct
   Cause:   Manually copy-pasting the long JWT string between terminal commands 
   introduced a transcription error (a dropped/altered character), which broke 
   the cryptographic signature — confirmed by logging both secrets side-by-side 
   and finding them identical, ruling out a code bug
   Fix:     Used a shell one-liner with jq to extract and pass the token directly 
   from the login response into the refresh request, removing manual copying 
   entirely
   Lesson:  verify assumptions with evidence (the console.log comparison) 
   before assuming the code is wrong, and automating token capture instead of 
   hand-copying long strings.
5. Symptom: curl uploads to /api/posts/upload-image kept failing — first with 
   "Failed to open/read local data from file", then after switching to a 
   downloaded test file, with a Cloudinary error about an empty base64 string
   Cause:   (1) The original local file path had a subtle mismatch curl couldn't 
   resolve, despite `ls` confirming the file existed; (2) the replacement test 
   image was downloaded with `curl -o` without `-L`, so curl saved picsum.photos's 
   redirect response (empty) instead of following it to the actual image
   Fix:     Downloaded a fresh test image with `curl -L -o` (follow redirects), 
   verified its file size with `ls -la` before attempting upload, confirming 
   real image data existed before troubleshooting the upload code further
   Lesson: use curl -L for downloading images
6. Symptom: Deployed backend on Render returned 404 "Not Found" with header 
   x-render-routing: no-server, even though the deploy itself showed "succeeded"
   Cause:   A manually-set PORT=4000 environment variable in Render's dashboard 
   overrode Render's own dynamically-assigned port, so the app was listening on 
   a port Render's internal router wasn't forwarding traffic to
   Fix:     Deleted the manual PORT env var entirely, letting the existing 
   `process.env.PORT || 5000` fallback in index.js correctly pick up Render's 
   auto-assigned port (10000)
   Lesson:  On a platform like Render, avoid setting manual PORT env vars for Node.js apps unless you understand exactly how their routing works; let the platform's own dynamic port assignment work with your `process.env.PORT || default` pattern.
7. Symptom: Live backend crashed on any database query with "Error: connect 
   ENETUNREACH <IPv6 address>:5432", even though the app deployed and started 
   successfully
   Cause:   Supabase's direct connection string resolves to an IPv6 address by 
   default, and Render's network doesn't support outbound IPv6 connections
   Fix:     Switched DATABASE_URL to Supabase's connection pooler URL instead, 
   which is IPv4-compatible
   Lesson:  Supabase's direct connection string doesn't work on Render; use 
   their connection pooler URL instead. Their docs have a note about this — 
   always check provider docs for compatibility issues before assuming your own 
   code will work on a new platform.

# 8. What I would do differently at 100x scale
<Three bullets. This is the question senior interviewers always ask.>

# 9. Interview answers I have rehearsed
Q: <question from the project card>
A: <my answer, in my own words, under 90 seconds>

# 10. Honest limitations
<What this project does NOT do. Saying this out loud in an interview
 builds more trust than pretending it is production-grade.>

# 11. How to run it
```bash
git clone <repo> && cd <repo>
cp .env.example .env      # fill in the values listed below
docker compose up --build
# open http://localhost:3000
```

Required environment variables: <list them>

# 12. Credits
<Any tutorial, repository or article you learned from. Always credit.
 Copying is fine; uncredited copying is not.>