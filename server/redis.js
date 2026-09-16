import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err.message));

try {
  await redisClient.connect();
  console.log('Connected to Redis');
} catch (err) {
  console.warn('Redis connection failed (optional cache disabled):', err.message);
}

export default redisClient;