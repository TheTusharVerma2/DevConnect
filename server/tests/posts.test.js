import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';

// Shared across tests in this file: register + login once, reuse the token
let accessToken;

beforeAll(async () => {
  const email = `posts-test-${Date.now()}@example.com`;
  const password = 'testpass123';

  await request(app).post('/api/auth/register').send({ email, password });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  accessToken = loginRes.body.accessToken;
});

describe('POST /api/posts', () => {
  it('creates a post when authenticated', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'A test post from Vitest' });

    expect(res.status).toBe(201);
    expect(res.body.post.content).toBe('A test post from Vitest');
  });

  it('rejects post creation without a token', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ content: 'Should not be allowed' });

    expect(res.status).toBe(401);
  });

  it('rejects post creation with empty content', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts', () => {
  it('returns a paginated feed with a nextCursor', async () => {
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
    expect(res.body).toHaveProperty('nextCursor');
  });

  it('does not require authentication to view the feed', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/posts/feed', () => {
  it('returns personalized feed for authenticated user', async () => {
    const res = await request(app)
      .get('/api/posts/feed')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
  });

  it('rejects unauthenticated access to personalized feed', async () => {
    const res = await request(app).get('/api/posts/feed');
    expect(res.status).toBe(401);
  });
});