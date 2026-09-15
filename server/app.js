import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import authenticateToken from './middleware/auth.js';
import profileRoutes from './routes/profile.js';
import postRoutes from './routes/posts.js';
import githubRoutes from './routes/github.js';
import searchRoutes from './routes/search.js';
import pool from './db.js';
import './redis.js';

dotenv.config();

const app = express();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', writeLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', writeLimiter, postRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/api/protected-test', authenticateToken, (req, res) => {
  res.json({ message: `Hello user ${req.userId}` });
});

export default app;