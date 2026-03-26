import redis from '../config/Redis.config.js';
import Logger from '../utils/Logger.js';

const logger = new Logger('src/middleware/RedisCache.js');

/**
 * Middleware for caching API responses using Redis.
 * @param {number} ttl - Time to live in seconds (default is 300 / 5 minutes).
 * @returns {Function} Express middleware.
 */
export const redisCache = (ttl = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests or if auth state isn't available
    if (req.method !== 'GET') {
      return next();
    }

    // Cache key based on URL and user ID (if available)
    const userId = req.school_id || req.user_id || 'anonymous';
    const cacheKey = `api_cache:${userId}:${req.originalUrl}`;

    try {
      const cachedResponse = await redis.get(cacheKey);

      if (cachedResponse) {
        // Parse and send cached data
        const data = JSON.parse(cachedResponse);
        logger.info(`Cache Hit: ${req.originalUrl} for User: ${userId}`);
        return res.status(200).json(data);
      }

      // If no cache, wrap the 'res.json' method to capture and cache response
      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode === 200) {
          redis.set(cacheKey, JSON.stringify(body), 'EX', ttl).catch((err) => {
            logger.error(
              `Failed to cache response for ${cacheKey}: ${err.message}`
            );
          });
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error(`Redis Cache Error for ${cacheKey}: ${error.message}`);
      next(); // Fail gracefully and proceed without cache
    }
  };
};

/**
 * Utility to clear specific cache keys if needed (e.g., after an update).
 * @param {string} pattern - Pattern to clear (e.g., "api_cache:USER_ID:*").
 */
export const clearCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (err) {
    logger.error(`Error clearing cache pattern ${pattern}: ${err.message}`);
  }
};
