import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('POST /api/auth/register', () => {
  it('creates a new user with a unique email', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail, password: 'testpass123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('rejects registration with a duplicate email', async () => {
    const email = `dup-${Date.now()}@example.com`;

    await request(app).post('/api/auth/register').send({ email, password: 'testpass123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'testpass123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('rejects registration with missing password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noemail@example.com' });

    expect(res.status).toBe(400);
  });

  it('rejects registration with non-existent email domain', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'fakeuser@nonexistentdomainxyz12398745.com', password: 'testpass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not exist|invalid/i);
  });

  it('rejects registration with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalidemailformat', password: 'testpass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in successfully with correct credentials', async () => {
    const email = `login-${Date.now()}@example.com`;
    const password = 'testpass123';

    await request(app).post('/api/auth/register').send({ email, password });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('rejects login with wrong password', async () => {
    const email = `wrongpass-${Date.now()}@example.com`;

    await request(app).post('/api/auth/register').send({ email, password: 'correctpassword' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password & /reset-password', () => {
  it('generates a reset token and updates the password', async () => {
    const email = `reset-${Date.now()}@example.com`;
    const oldPassword = 'oldpassword123';
    const newPassword = 'newpassword456';

    await request(app).post('/api/auth/register').send({ email, password: oldPassword });

    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body).toHaveProperty('resetToken');

    const resetToken = forgotRes.body.resetToken;

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toMatch(/success/i);

    // Verify login with new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('accessToken');
  });
});