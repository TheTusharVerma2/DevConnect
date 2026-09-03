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
​```

## Components
- **users** → auth identity (email, password) → separated from profile data so public-facing reads never touch sensitive auth fields
- **profiles** → public-facing user data (bio, skills, socials) → one-to-one with users
- **follows** → many-to-many self-relationship between users → join table instead of a list column, so it scales past 10M followers without rewriting a growing list on every follow
- **posts** → user-generated content → `created_at` doubles as the cursor for cursor-based pagination
- **comments** → self-referencing via `parent_comment_id` → enables nested replies without a separate table
- **likes** → many-to-many between users and posts → join table with composite PK `(user_id, post_id)` enforces "no duplicate likes" at the DB level, not in app code

Components:
- <component> -> <responsibility> -> <why this technology and not the alternative>

# 4. Key decisions and trade-offs
| Decision | Options I considered | What I chose | Why | What I gave up |
|---|---|---|---|---|
| | | | | |

# 5. Skills demonstrated
- [ ] <skill>    evidence: <file / commit / endpoint that proves it>
- [ ] <skill>    evidence: <...>

- [x] Node.js ↔ PostgreSQL connection via connection pooling    evidence: server/db.js, GET /api/db-test
- [x] Password hashing with bcrypt, parameterized SQL queries    evidence: server/routes/auth.js POST /register
- [x] JWT-based auth: access/refresh token issuance on login    evidence: server/routes/auth.js POST /login
# 6. Numbers I measured
| Metric | Before | After | How I measured it |
|---|---|---|---|
| | | | |

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