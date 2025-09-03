let redisClient = null;
let cacheEnabled = false;
let connecting = false;

async function tryConnect(url = process.env.REDIS_URL || 'redis://redis:6379') {
  if (connecting || cacheEnabled) return;
  connecting = true;
  try {
    const redis = require('redis');
    redisClient = redis.createClient({ url });
    redisClient.on('error', (err) => {
      console.log('⚠️ Redis error:', err.message);
      cacheEnabled = false;
    });
    await redisClient.connect();
    cacheEnabled = true;
    console.log('✅ Connected to Redis');
  } catch (err) {
    console.log('⚠️ Redis not available:', err.message);
    cacheEnabled = false;
    redisClient = null;
  } finally {
    connecting = false;
  }
}

tryConnect();
setInterval(() => {
  if (!cacheEnabled) tryConnect();
}, 5000);

async function cacheGet(key) {
  if (!cacheEnabled || !redisClient) return null;
  try {
    const value = await redisClient.get(key);
    console.log('cacheGet', key, value ? 'HIT' : 'MISS');
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.log('cacheGet error', err.message);
    return null;
  }
}

async function cacheSet(key, value, ttl = 300) {
  if (!cacheEnabled || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    console.log('cacheSet', key);
  } catch (err) {
    console.log('cacheSet error', err.message);
  }
}

async function cacheDel(key) {
  if (!cacheEnabled || !redisClient) return;
  try {
    await redisClient.del(key);
    console.log('cacheDel', key);
  } catch (err) {
    console.log('cacheDel error', err.message);
  }
}

module.exports = { cacheGet, cacheSet, cacheDel };