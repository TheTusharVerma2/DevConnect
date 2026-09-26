import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { validateEmailExists } from '../utils/emailValidator.js';

const router = express.Router();

// register router
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailCheck = await validateEmailExists(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.error });
    }
    const cleanEmail = emailCheck.email;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [cleanEmail, hashedPassword]
    );

    const { id, email: userEmail } = result.rows[0];
    return res.status(201).json({ user: { id, email: userEmail } });

  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// login router
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailCheck = await validateEmailExists(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.error });
    }
    const cleanEmail = emailCheck.email;

    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [cleanEmail]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (passwordMatch === false) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    return res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// forgot password router
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const emailCheck = await validateEmailExists(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.error });
    }

    const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [emailCheck.email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const user = result.rows[0];

    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    return res.json({
      message: 'Password reset token generated successfully!',
      resetToken,
      resetUrl: `/reset-password?token=${resetToken}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
});

// reset password router
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid password reset token' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, decoded.userId]
    );

    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.userId]);

    return res.json({ message: 'Password reset successfully! You can now log in with your new password.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// refresh router
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    return res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'No refresh token provided' });
    }

    await pool.query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    );

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;