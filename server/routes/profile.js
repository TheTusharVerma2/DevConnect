import express from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.user_id, p.username, p.bio, p.skills, p.experience, p.education, p.social_links, p.created_at, u.email
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch current user profile' });
  }
});

// UPDATE profile (partial updates)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const allowedFields = ['bio', 'skills', 'experience', 'education', 'social_links'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    values.push(req.userId); // for the WHERE clause

    const query = `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({ profile: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, bio, skills, experience, education, social_links } = req.body;

    // Validate required field — username is mandatory, everything else is optional
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const result = await pool.query(
      `INSERT INTO profiles (user_id, username, bio, skills, experience, education, social_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.userId, username, bio, skills, experience, education, social_links]
    );

    return res.status(201).json({ profile: result.rows[0] });

  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken or profile already exists for this user' });
    }
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// GET public profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await pool.query(
      'SELECT id, user_id, username, bio, skills, experience, education, social_links, created_at FROM profiles WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = result.rows[0];

    // Counts
    const followersRes = await pool.query('SELECT COUNT(*)::int AS count FROM follows WHERE followed_id = $1', [profile.user_id]);
    const followingRes = await pool.query('SELECT COUNT(*)::int AS count FROM follows WHERE follower_id = $1', [profile.user_id]);

    profile.followers_count = followersRes.rows[0].count;
    profile.following_count = followingRes.rows[0].count;

    // Check optional follow status if token provided
    let isFollowing = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const followCheck = await pool.query(
          'SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2',
          [decoded.userId, profile.user_id]
        );
        isFollowing = followCheck.rows.length > 0;
      } catch (err) {
        // invalid token, ignore
      }
    }
    profile.is_following = isFollowing;

    return res.json({ profile });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/:username/follow', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    const target = await pool.query('SELECT user_id FROM profiles WHERE username = $1', [username]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const followedId = target.rows[0].user_id;

    if (followedId === req.userId) {
      return res.status(400).json({ error: "Can't follow yourself" });
    }

    await pool.query(
      'INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)',
      [req.userId, followedId]
    );

    return res.status(201).json({ message: 'Followed successfully' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already following this user' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to follow' });
  }
});

router.delete('/:username/follow', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    const target = await pool.query('SELECT user_id FROM profiles WHERE username = $1', [username]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const followedId = target.rows[0].user_id;

    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2',
      [req.userId, followedId]
    );

    return res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unfollow' });
  }
});

export default router;