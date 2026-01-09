const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

// Enhanced security middleware
const securityMiddleware = (app) => {
  // Helmet for security headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:", "data:"],
          scriptSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://maps.googleapis.com",
          ],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://maps.googleapis.com",
          ],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
        },
      },
    })
  );

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS attacks
  app.use(xss());

  // Prevent HTTP Parameter Pollution attacks
  app.use(hpp());

  // Rate limiting configurations
  const createRateLimit = (windowMs, max, message) =>
    rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        message:
          message || "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: "Rate limit exceeded",
          retryAfter: Math.round(windowMs / 1000),
        });
      },
    });

  // General rate limiting
  app.use(
    "/api/",
    createRateLimit(
      15 * 60 * 1000, // 15 minutes
      100, // 100 requests per window
      "Too many API requests from this IP"
    )
  );

  // Stricter rate limiting for authentication routes
  app.use(
    "/api/auth/",
    createRateLimit(
      15 * 60 * 1000, // 15 minutes
      5, // 5 requests per window
      "Too many authentication attempts"
    )
  );

  // AI route rate limiting
  app.use(
    "/api/ai/",
    createRateLimit(
      60 * 60 * 1000, // 1 hour
      20, // 20 AI requests per hour
      "Too many AI requests from this IP"
    )
  );

  // Payment route rate limiting
  app.use(
    "/api/payments/",
    createRateLimit(
      15 * 60 * 1000, // 15 minutes
      10, // 10 payment requests per window
      "Too many payment requests"
    )
  );

  // HTTPS enforcement for production
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (req.header("x-forwarded-proto") !== "https") {
        res.redirect(`https://${req.header("host")}${req.url}`);
      } else {
        next();
      }
    });
  }
};

module.exports = securityMiddleware;
