import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
// register router
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // TODO 1: Basic validation — if email or password is missing, 
    // respond with a 400 status and an error message, then `return`
    // so the function stops here.
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // TODO 2: Hash the password using bcrypt.hash(). 
    // Use a cost factor of 10.
    const hashedPassword = await bcrypt.hash(password, 10);
    

    // TODO 3: Insert a new row into the `users` table with the 
    // email and the HASHED password (never the plain one).
    // Use pool.query() — look at how we did it in /api/db-test 
    // for the syntax, but this time you're inserting, not selecting.
    // Hint: parameterized query looks like:
    //   pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email', [email, hashedPassword])
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    // TODO 4: Send back a 201 status with the new user's id and email 
    // (never send back the password hash)
    const {id, email : userEmail} = result.rows[0];
    return res.status(201).json({user : {id, email : userEmail}});

  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
    return res.status(409).json({ error: 'Email already registered' });
  }
  res.status(500).json({ error: 'Registration failed' });
  }
});
 //login router
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // TODO 1: Validation — same as register, if email or password missing, 
    // return 400.
    if(!email || !password){
        return res.status(400).json({error : "Email and password are required"});
    }

    // TODO 2: Look up the user by email using pool.query().
    // SELECT id, email, password_hash FROM users WHERE email = $1
    // Hint: result.rows will be an EMPTY array if no user matches — 
    // check result.rows.length === 0, and if so, return 401 
    // with a generic message like "Invalid credentials" 
    // (never reveal "email not found" specifically — that leaks 
    // which emails are registered)
const result = await pool.query(
  'SELECT id, email, password_hash FROM users WHERE email = $1',
  [email]
);
if (result.rows.length === 0) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
const user = result.rows[0];

    // TODO 3: Compare the submitted password against the stored hash 
    // using bcrypt.compare(plainPassword, hash) — it returns a boolean.
    // If it doesn't match, return 401 with the SAME generic message 
    // as TODO 2 (again — don't reveal whether it was the email or 
    // password that was wrong)
const passwordMatch = await bcrypt.compare(password, user.password_hash);
if (passwordMatch === false) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

    // TODO 4 (given to you, this part's new):
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


    // TODO 5: Send back both tokens and the user's id/email 
    // (still never the password hash) as JSON, status 200
   return res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;