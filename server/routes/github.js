import express from 'express';
import redisClient from '../redis.js';

const router = express.Router();

router.get('/:githubUsername/repos', async (req, res) => {
  try {
    const { githubUsername } = req.params;
    const cacheKey = `github-repos:${githubUsername}`;

    // TODO 1: Check Redis first for a cached response
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('Cache HIT for', githubUsername);
      return res.json(JSON.parse(cached));
    }

    console.log('Cache MISS for', githubUsername, '— calling GitHub API');

    // TODO 2: Cache miss — call the real GitHub API
    const githubResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos`);
    const data = await githubResponse.json();

    // TODO 3: Store the result in Redis, expiring after 10 minutes (600 seconds)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(data));

    // TODO 4: Return the fresh data
    return res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch GitHub repos' });
  }
});

export default router;