import express from 'express';
import redisClient from '../redis.js';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET public repositories for a given GitHub username
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

// POST sync GitHub profile and repos for authenticated user
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    let { githubUsername, username } = req.body;

    // Check existing user profile if username not explicitly passed
    const existingProfileRes = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.userId]
    );

    let existingProfile = existingProfileRes.rows[0] || null;

    if (!githubUsername && existingProfile && existingProfile.social_links) {
      const match = existingProfile.social_links.match(/github:([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        githubUsername = match[1];
      }
    }

    if (!githubUsername) {
      return res.status(400).json({ error: 'GitHub username is required to sync profile' });
    }

    githubUsername = githubUsername.trim();

    // Fetch GitHub User Info
    const userRes = await fetch(`https://api.github.com/users/${githubUsername}`, {
      headers: { 'User-Agent': 'DevConnect-App' }
    });

    if (!userRes.ok) {
      if (userRes.status === 404) {
        return res.status(404).json({ error: `GitHub account "@${githubUsername}" not found` });
      }
      return res.status(userRes.status).json({ error: 'Failed to fetch GitHub profile info' });
    }

    const githubData = await userRes.json();

    // Fetch GitHub User Repos
    const reposRes = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=15`, {
      headers: { 'User-Agent': 'DevConnect-App' }
    });

    let repos = [];
    let detectedLanguages = [];
    if (reposRes.ok) {
      repos = await reposRes.json();
      if (Array.isArray(repos)) {
        const langs = repos.map(r => r.language).filter(Boolean);
        detectedLanguages = [...new Set(langs)];
      }

      // Cache repos in Redis
      try {
        if (redisClient.isOpen) {
          await redisClient.setEx(`github-repos:${githubUsername}`, 600, JSON.stringify(repos));
        }
      } catch (cacheErr) {
        console.warn('Redis write error:', cacheErr.message);
      }
    }

    // Prepare updated fields
    const githubLinkTag = `github:${githubUsername}`;
    
    // Merge social links
    let socialLinks = existingProfile?.social_links || '';
    if (!socialLinks.toLowerCase().includes(`github:`)) {
      socialLinks = socialLinks ? `${socialLinks}, ${githubLinkTag}` : githubLinkTag;
    } else {
      socialLinks = socialLinks.replace(/github:[a-zA-Z0-9_-]+/i, githubLinkTag);
    }

    // Merge skills
    let existingSkillsArr = existingProfile?.skills
      ? existingProfile.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    let mergedSkillsArr = [...new Set([...existingSkillsArr, ...detectedLanguages])];
    let skillsStr = mergedSkillsArr.join(', ');

    // Merge bio
    let newBio = existingProfile?.bio || githubData.bio || `Developer building projects on GitHub (@${githubUsername})`;

    let updatedProfile;
    if (existingProfile) {
      const updateRes = await pool.query(
        `UPDATE profiles 
         SET bio = $1, skills = $2, social_links = $3
         WHERE user_id = $4
         RETURNING *`,
        [newBio, skillsStr, socialLinks, req.userId]
      );
      updatedProfile = updateRes.rows[0];
    } else {
      // Create profile if doesn't exist
      const desiredUsername = (username && username.trim()) ? username.trim() : githubUsername;
      const insertRes = await pool.query(
        `INSERT INTO profiles (user_id, username, bio, skills, social_links)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.userId, desiredUsername, newBio, skillsStr, socialLinks]
      );
      updatedProfile = insertRes.rows[0];
    }

    return res.json({
      message: 'GitHub profile & repositories synced successfully!',
      profile: updatedProfile,
      githubData: {
        username: githubUsername,
        name: githubData.name,
        avatar_url: githubData.avatar_url || `https://github.com/${githubUsername}.png`,
        bio: githubData.bio,
        public_repos: githubData.public_repos,
        followers: githubData.followers,
        html_url: githubData.html_url
      },
      repos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync GitHub profile' });
  }
});

export default router;