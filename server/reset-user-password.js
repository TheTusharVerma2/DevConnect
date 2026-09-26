import pool from './db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function resetPassword() {
  const args = process.argv.slice(2);
  const email = args[0];
  const newPassword = args[1];

  if (!email || !newPassword) {
    console.log('Usage: node reset-user-password.js <email> <newPassword>');
    console.log('Example: node reset-user-password.js developer@example.com newpass123');
    process.exit(1);
  }

  try {
    const userRes = await pool.query('SELECT id, email FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (userRes.rows.length === 0) {
      console.error(`❌ Error: No user found with email "${email}"`);
      process.exit(1);
    }

    const userId = userRes.rows[0].id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    console.log(`✅ Password successfully updated for user "${email}"!`);
    console.log(`🔑 You can now log in with password: "${newPassword}"`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset password:', err.message);
    process.exit(1);
  }
}

resetPassword();
