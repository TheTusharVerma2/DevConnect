import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config(); // loads variables from .env into process.env

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());          // allow requests from your frontend's origin
app.use(express.json());  // parse incoming JSON request bodies automatically
// ... after app.use(express.json()) ...
app.use('/api/auth', authRoutes);
// A simple test route to confirm the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import pool from './db.js';

// ... existing code ...

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


