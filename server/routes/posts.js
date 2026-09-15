import express from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, image_url } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await pool.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, content, image_url]
    );

    return res.status(201).json({ post: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.get('/', async (req, res) => {
  try {
    const limit = 10; // posts per page
    const { cursor } = req.query; // e.g. ?cursor=2026-09-10T12:00:00.000Z

    let result;
    if (cursor) {
      // Get posts older than the cursor timestamp
      result = await pool.query(
        `SELECT posts.*, profiles.username 
         FROM posts 
         JOIN profiles ON posts.user_id = profiles.user_id
         WHERE posts.created_at < $1 
         ORDER BY posts.created_at DESC 
         LIMIT $2`,
        [cursor, limit]
      );
    } else {
      // First page — no cursor yet
      result = await pool.query(
        `SELECT posts.*, profiles.username 
         FROM posts 
         JOIN profiles ON posts.user_id = profiles.user_id
         ORDER BY posts.created_at DESC 
         LIMIT $1`,
        [limit]
      );
    }

    const posts = result.rows;
    // The next cursor is the created_at of the LAST post in this batch
    const nextCursor = posts.length > 0 ? posts[posts.length - 1].created_at : null;

    return res.json({ posts, nextCursor });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    await pool.query(
      'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
      [req.userId, postId]
    );

    return res.status(201).json({ message: 'Post liked' });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already liked this post' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

router.delete('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
      [req.userId, postId]
    );

    return res.json({ message: 'Post unliked' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_comment_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, req.userId, parent_comment_id || null, content]
    );

    return res.status(201).json({ comment: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT comments.*, profiles.username 
       FROM comments 
       JOIN profiles ON comments.user_id = profiles.user_id
       WHERE comments.post_id = $1 
       ORDER BY comments.created_at ASC`,
      [postId]
    );

    const flatComments = result.rows;

    // Build a map for quick lookup by id, and add an empty `replies` array to each
    const commentMap = {};
    flatComments.forEach(comment => {
      comment.replies = [];
      commentMap[comment.id] = comment;
    });

    // Walk through again, nesting each reply under its parent
    const topLevelComments = [];
    flatComments.forEach(comment => {
      if (comment.parent_comment_id === null) {
        topLevelComments.push(comment);
      } else {
        const parent = commentMap[comment.parent_comment_id];
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    return res.json({ comments: topLevelComments });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

import multer from 'multer';
import cloudinary from '../cloudinary.js';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert the file buffer into a base64 string Cloudinary can accept
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'devconnect',
    });

    return res.json({ imageUrl: result.secure_url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

export default router;