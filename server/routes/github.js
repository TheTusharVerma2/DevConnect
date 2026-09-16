import express from 'express';
import redisClient from '../redis.js';

const router = express.Router();

router.get('/:githubUsername/repos', async (req, res) => {
  try {
    const { githubUsername } = req.params;
    const cacheKey = `github-repos:${githubUsername}`;

    // Try checking Redis cache
    let cached = null;
    try {
      if (redisClient.isOpen) {
        cached = await redisClient.get(cacheKey);
      }
    } catch (cacheErr) {
      console.warn('Redis read error:', cacheErr.message);
    }

    if (cached) {
      console.log('Cache HIT for', githubUsername);
      return res.json(JSON.parse(cached));
    }

    console.log('Cache MISS for', githubUsername, '— calling GitHub API');

    const githubResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=10`, {
      headers: {
        'User-Agent': 'DevConnect-App'
      }
    });

    if (!githubResponse.ok) {
      return res.status(githubResponse.status).json({ error: 'Failed to fetch repositories from GitHub' });
    }

    const data = await githubResponse.json();

    // Try setting Redis cache
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(data));
      }
    } catch (cacheErr) {
      console.warn('Redis write error:', cacheErr.message);
    }

    return res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch GitHub repos' });
  }
});

export default router;