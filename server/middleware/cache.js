const Redis = require("redis");
const { logger } = require("./logging");

let redisClient = null;

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Initialize Redis client
const initializeRedis = async () => {
  try {
    if (process.env.NODE_ENV === "production" || process.env.REDIS_URL) {
      redisClient = Redis.createClient({
        url:
          process.env.REDIS_URL ||
          `redis://${redisConfig.host}:${redisConfig.port}`,
        password: redisConfig.password,
        database: redisConfig.db,
        socket: {
          connectTimeout: redisConfig.connectTimeout,
          commandTimeout: redisConfig.commandTimeout,
          keepAlive: redisConfig.keepAlive,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error("Redis connection failed after 10 retries");
              return new Error("Redis connection failed");
            }
            return Math.min(retries * 50, 1000);
          },
        },
      });

      redisClient.on("error", (err) => {
        logger.error("Redis connection error:", err);
      });

      redisClient.on("connect", () => {
        logger.info("Redis client connected");
      });

      redisClient.on("ready", () => {
        logger.info("Redis client ready");
      });

      redisClient.on("end", () => {
        logger.warn("Redis connection ended");
      });

      await redisClient.connect();
      logger.info("Redis client initialized successfully");
    } else {
      // Silent in development
    }
  } catch (error) {
    logger.error("Failed to initialize Redis:", error);
  }
};

// Cache wrapper with error handling
const cache = {
  // Get value from cache
  get: async (key) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        return null;
      }
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Cache get error:", error);
      return null;
    }
  },

  // Set value in cache with TTL
  set: async (key, value, ttl = 3600) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        return false;
      }
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error("Cache set error:", error);
      return false;
    }
  },

  // Delete key from cache
  del: async (key) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        return false;
      }
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error("Cache delete error:", error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        return false;
      }
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      logger.error("Cache exists error:", error);
      return false;
    }
  },

  // Increment counter (for rate limiting)
  incr: async (key, ttl = 3600) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        return null;
      }
      const value = await redisClient.incr(key);
      if (value === 1) {
        await redisClient.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.error("Cache incr error:", error);
      return null;
    }
  },

  // Get multiple keys
  mget: async (keys) => {
    try {
      if (!redisClient || !redisClient.isReady || !keys.length) {
        return [];
      }
      const values = await redisClient.mGet(keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      logger.error("Cache mget error:", error);
      return [];
    }
  },

  // Set multiple keys
  mset: async (keyValuePairs, ttl = 3600) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        return false;
      }

      const pipeline = redisClient.multi();

      for (const [key, value] of keyValuePairs) {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error("Cache mset error:", error);
      return false;
    }
  },

  // Clear all cache (use with caution)
  flush: async () => {
    try {
      if (!redisClient || !redisClient.isReady) {
        return false;
      }
      await redisClient.flushDb();
      logger.info("Cache flushed");
      return true;
    } catch (error) {
      logger.error("Cache flush error:", error);
      return false;
    }
  },
};

// Caching middleware for routes
const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : `${req.method}:${req.originalUrl}:${req.user?.id || "anonymous"}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.info("Cache hit:", { key: cacheKey });
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function (body) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache
            .set(cacheKey, body, ttl)
            .then(() => logger.info("Cache set:", { key: cacheKey }))
            .catch((err) => logger.error("Cache set failed:", err));
        }

        // Call original res.json
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error:", error);
      next();
    }
  };
};

// Cache invalidation helpers
const invalidateCache = {
  // Invalidate user-specific cache
  user: async (userId) => {
    try {
      const pattern = `*:*:${userId}`;
      await invalidatePattern(pattern);
      logger.info("User cache invalidated:", { userId });
    } catch (error) {
      logger.error("User cache invalidation error:", error);
    }
  },

  // Invalidate trip-related cache
  trip: async (tripId, userId) => {
    try {
      const patterns = [
        `GET:/api/trips:${userId}`,
        `GET:/api/trips/${tripId}:*`,
        `GET:/api/trips/user/*:${userId}`,
      ];

      for (const pattern of patterns) {
        await invalidatePattern(pattern);
      }

      logger.info("Trip cache invalidated:", { tripId, userId });
    } catch (error) {
      logger.error("Trip cache invalidation error:", error);
    }
  },

  // Invalidate hotel cache
  hotel: async () => {
    try {
      const pattern = "GET:/api/hotels*";
      await invalidatePattern(pattern);
      logger.info("Hotel cache invalidated");
    } catch (error) {
      logger.error("Hotel cache invalidation error:", error);
    }
  },
};

// Helper to invalidate cache by pattern
const invalidatePattern = async (pattern) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      return;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error("Pattern invalidation error:", error);
  }
};

// Graceful shutdown
const closeRedis = async () => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.quit();
      logger.info("Redis connection closed");
    }
  } catch (error) {
    logger.error("Error closing Redis connection:", error);
  }
};

module.exports = {
  initializeRedis,
  cache,
  cacheMiddleware,
  invalidateCache,
  closeRedis,
  redisClient: () => redisClient,
};
