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
# 3. Architecture

## Data Model (ER Diagram)

​```mermaid
erDiagram
    USERS ||--|| PROFILES : has
    USERS ||--o{ POSTS : writes
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ FOLLOWS : "follower_id"
    USERS ||--o{ FOLLOWS : "followed_id"
    USERS ||--o{ LIKES : "user_id"
    POSTS ||--o{ COMMENTS : has
    POSTS ||--o{ LIKES : "post_id"
    COMMENTS ||--o{ COMMENTS : "parent_comment_id"

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

# 6. Numbers I measured
| Metric | Before | After | How I measured it |
|---|---|---|---|
| | | | |

# 7. Things that broke and how I fixed them
1. Symptom: <what I saw>
   Cause:   <what it actually was>
   Fix:     <what I changed>
   Lesson:  <what I now do by default>

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