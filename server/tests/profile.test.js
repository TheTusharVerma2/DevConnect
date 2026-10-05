import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';

let accessToken;
let userEmail;
let initialUsername;

beforeAll(async () => {
  userEmail = `profile-test-${Date.now()}@example.com`;
  initialUsername = `user_${Date.now()}`;
  const password = 'testpass123';

  await request(app).post('/api/auth/register').send({ email: userEmail, password });

  const loginRes = await request(app).post('/api/auth/login').send({ email: userEmail, password });
  accessToken = loginRes.body.accessToken;

  // Create initial profile
  await request(app)
    .post('/api/profile')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      username: initialUsername,
      bio: 'Initial test bio',
      skills: 'JavaScript, Node.js'
    });
});

describe('PUT /api/profile (Username Update & Decoupling)', () => {
  it('allows user to update their username anytime', async () => {
    const newUsername = `new_user_${Date.now()}`;

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ username: newUsername, bio: 'Updated bio' });

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe(newUsername);
    expect(res.body.profile.bio).toBe('Updated bio');

    // Verify GET /api/profile/me reflects new username
    const meRes = await request(app)
      .get('/api/profile/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.profile.username).toBe(newUsername);
  });

  it('rejects updating username to an already taken username', async () => {
    // Create second user & profile
    const email2 = `taken-user-${Date.now()}@example.com`;
    const takenUsername = `taken_${Date.now()}`;
    await request(app).post('/api/auth/register').send({ email: email2, password: 'testpass123' });
    const login2 = await request(app).post('/api/auth/login').send({ email: email2, password: 'testpass123' });
    
    await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${login2.body.accessToken}`)
      .send({ username: takenUsername });

    // Try updating user 1 to takenUsername
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ username: takenUsername });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already taken/i);
  });

  it('rejects updating username to an empty string', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ username: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot be empty/i);
  });
});

describe('POST /api/github/sync (Username Decoupling)', () => {
  it('preserves existing custom username when GitHub is synced', async () => {
    const currentMe = await request(app)
      .get('/api/profile/me')
      .set('Authorization', `Bearer ${accessToken}`);
    const existingUsername = currentMe.body.profile.username;

    // Perform GitHub sync for github user "octocat"
    const syncRes = await request(app)
      .post('/api/github/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ githubUsername: 'octocat' });

    expect(syncRes.status).toBe(200);
    // DevConnect username must NOT be overwritten to "octocat"
    expect(syncRes.body.profile.username).toBe(existingUsername);
    // social_links must contain github:octocat
    expect(syncRes.body.profile.social_links).toMatch(/github:octocat/i);
  });
});
