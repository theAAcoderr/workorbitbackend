const redis = require('redis');
const { logger } = require('../middleware/logger');

// Redis client configuration
const useTLS = process.env.REDIS_TLS === 'true';

// Support both URL and individual config
const redisConfig = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        tls: useTLS,
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis retry limit exceeded');
            return new Error('Redis retry limit exceeded');
          }
          return Math.min(retries * 100, 3000);
        }
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0
    };

const redisClient = redis.createClient(redisConfig);

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('✅ Redis connected successfully');

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    // Don't throw - allow app to run without Redis
    return null;
  }
};

// Cache wrapper with error handling
class CacheService {
  constructor(client) {
    this.client = client;
    this.defaultTTL = 3600; // 1 hour
  }

  async get(key) {
    try {
      if (!this.client || !this.client.isOpen) return null;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache pattern invalidation error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      return await this.client.exists(key) === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(key, amount = 1) {
    try {
      if (!this.client || !this.client.isOpen) return null;
      return await this.client.incrBy(key, amount);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  async expire(key, ttl) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  async flushAll() {
    try {
      if (!this.client || !this.client.isOpen) return false;
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }
}

// Caching middleware
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if cache is not available
    if (!cache || !cache.client || !cache.client.isOpen) {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await cache.get(key);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        console.log(`✅ Cache HIT: ${key}`);
        return res.json(cachedResponse);
      }

      res.setHeader('X-Cache', 'MISS');
      console.log(`📝 Cache MISS: ${key} - will cache for ${duration}s`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method
      res.json = (data) => {
        cache.set(key, data, duration).then(() => {
          console.log(`💾 Cached: ${key}`);
        }).catch(err =>
          logger.error('Cache set failed:', err)
        );
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Session store for rate limiting per user
class RedisSessionStore {
  constructor(client, prefix = 'session:') {
    this.client = client;
    this.prefix = prefix;
  }

  async get(userId) {
    try {
      const data = await this.client.get(`${this.prefix}${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Session get error:', error);
      return null;
    }
  }

  async set(userId, data, ttl = 86400) {
    try {
      await this.client.setEx(`${this.prefix}${userId}`, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Session set error:', error);
      return false;
    }
  }

  async destroy(userId) {
    try {
      await this.client.del(`${this.prefix}${userId}`);
      return true;
    } catch (error) {
      logger.error('Session destroy error:', error);
      return false;
    }
  }
}

let cache = null;
let sessionStore = null;

const initializeCache = async () => {
  const client = await connectRedis();
  if (client) {
    cache = new CacheService(client);
    sessionStore = new RedisSessionStore(client);
  }
  return { cache, sessionStore, client };
};

module.exports = {
  redisClient,
  connectRedis,
  CacheService,
  cacheMiddleware,
  RedisSessionStore,
  initializeCache,
  getCache: () => cache,
  getSessionStore: () => sessionStore
};
