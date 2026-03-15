/**
 * Additional Security Middleware
 * Implements XSS protection, input sanitization, and security headers
 */

const xss = require('xss');

/**
 * Sanitize user input to prevent XSS attacks
 * Recursively sanitizes all string values in request body, query, and params
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return xss(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * Add additional security headers
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  next();
};

/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
  // Convert array parameters to single values (take first)
  const sanitizeParams = (params) => {
    const sanitized = {};
    for (const key in params) {
      sanitized[key] = Array.isArray(params[key]) ? params[key][0] : params[key];
    }
    return sanitized;
  };

  if (req.query) req.query = sanitizeParams(req.query);
  if (req.body) req.body = sanitizeParams(req.body);

  next();
};

/**
 * Validate content type for POST/PUT requests
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported Media Type. Use application/json or multipart/form-data'
      });
    }
  }
  next();
};

/**
 * Rate limit by IP and user
 */
const advancedRateLimit = (req, res, next) => {
  // This is a placeholder - implement with Redis in production
  // Track requests per IP and per user
  next();
};

module.exports = {
  sanitizeInput,
  securityHeaders,
  preventParameterPollution,
  validateContentType,
  advancedRateLimit
};
