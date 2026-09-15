import pool from './db.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding database...');

  // Create a test user + profile if they don't already exist
  const hashedPassword = await bcrypt.hash('seedpass123', 10);
  let userResult;
  try {
    userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['seeduser@example.com', hashedPassword]
    );
  } catch (err) {
    // if it already exists, just fetch it
    userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['seeduser@example.com']);
  }
  const userId = userResult.rows[0].id;

  try {
    await pool.query(
      'INSERT INTO profiles (user_id, username, bio) VALUES ($1, $2, $3)',
      [userId, 'seeduser', 'Seed data account']
    );
  } catch (err) {
    // profile already exists, ignore
  }

  // Insert 2000 fake posts
  console.log('Inserting 2000 posts...');
  for (let i = 0; i < 2000; i++) {
    await pool.query(
      'INSERT INTO posts (user_id, content) VALUES ($1, $2)',
      [userId, `Seed post number ${i}`]
    );
  }

  console.log('Done seeding!');
  process.exit(0);
}

seed();