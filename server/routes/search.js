import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const postsResult = await pool.query(
      `SELECT id, content, created_at 
       FROM posts 
       WHERE search_vector @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
       LIMIT 10`,
      [q]
    );

    const profilesResult = await pool.query(
      `SELECT id, username, bio 
       FROM profiles 
       WHERE search_vector @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
       LIMIT 10`,
      [q]
    );

    return res.json({
      posts: postsResult.rows,
      profiles: profilesResult.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;