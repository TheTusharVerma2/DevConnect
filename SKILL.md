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
users
  id (PK)
  email
  password_hash
  created_at

profiles
  id (PK)
  user_id (FK → users.id, one-to-one)
  username
  bio
  skills
  experience
  education
  social_links

follows
  follower_id (FK → users.id) ─┐
  followed_id (FK → users.id) ─┴─ composite PK
  created_at

posts
  id (PK)
  user_id (FK → users.id)
  content
  image_url
  created_at

comments
  id (PK)
  post_id (FK → posts.id)
  user_id (FK → users.id)
  parent_comment_id (FK → comments.id, nullable)
  content
  created_at

likes
  user_id (FK → users.id) ─┐
  post_id (FK → posts.id) ─┴─ composite PK
  created_at
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