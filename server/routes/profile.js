import express from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

//UPDATE profile (partial updates)
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

    // Insert the new profile. user_id comes from req.userId (set by the
    // authenticateToken middleware from the verified JWT) — NEVER from
    // req.body, since a client could otherwise claim to be any user_id
    const result = await pool.query(
      `INSERT INTO profiles (user_id, username, bio, skills, experience, education, social_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.userId, username, bio, skills, experience, education, social_links]
    );

    // 201 = resource successfully created; return the full new profile row
    return res.status(201).json({ profile: result.rows[0] });

  } catch (err) {
    console.error(err);
    // 23505 = Postgres unique_violation. Fires if either `username` is
    // already taken, or this user_id already has a profile (both columns
    // have UNIQUE constraints)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken or profile already exists for this user' });
    }
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

//GET public profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Public profile lookup — profiles table only, never join in
    // users.email or users.password_hash. Public pages show what's
    // meant to be public.
    const result = await pool.query(
      'SELECT id, username, bio, skills, experience, education, social_links, created_at FROM profiles WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({ profile: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
export default router;