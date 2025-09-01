// cache.js
let redisClient = null;
let cacheEnabled = false;

try {
  const redis = require('redis');
  redisClient = redis.createClient({ url: 'redis://redis:6379' });
  redisClient.connect().then(() => {
    cacheEnabled = true;
    console.log('✅ Connected to Redis');
  }).catch((err) => {
    console.log('⚠️ Redis not available:', err.message);
  });
} catch (err) {
  console.log('⚠️ Redis module not installed or failed to load:', err.message);
}

async function cacheGet(key) {
  if (!cacheEnabled || !redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    return null;
  }
}

async function cacheSet(key, value, ttl = 300) {
  if (!cacheEnabled || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {}
}

async function cacheDel(key) {
  if (!cacheEnabled || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {}
}

module.exports = { cacheGet, cacheSet, cacheDel };
