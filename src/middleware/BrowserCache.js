/**
 * Middleware to set Cache-Control headers for browser caching.
 * @param {number} duration - Cache duration in seconds.
 * @returns {Function} Middleware function.
 */
export const setBrowserCache = (duration) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${duration}`);
    } else {
      res.set('Cache-Control', 'no-store');
    }
    next();
  };
};

/**
 * Middleware to disable browser caching (useful for sensitive data).
 */
export const noCache = (req, res, next) => {
  res.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};
