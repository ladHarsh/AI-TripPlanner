const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const { logger } = require("./logging");

/**
 * Enhanced Security Middleware Stack
 * Comprehensive security configuration for production deployment
 */

// Account lockout tracking (in-memory for demo, use Redis for production)
const accountAttempts = new Map();
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Account lockout middleware
 */
const accountLockout = (req, res, next) => {
  const identifier = req.ip + (req.body?.email || "");
  const attempts = accountAttempts.get(identifier);

  if (attempts && attempts.count >= LOCKOUT_ATTEMPTS) {
    const timeLeft = attempts.lockedUntil - Date.now();
    if (timeLeft > 0) {
      logger.warn("Account lockout active:", {
        identifier,
        ip: req.ip,
        timeLeft: Math.round(timeLeft / 1000),
      });

      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${Math.ceil(
          timeLeft / 60000
        )} minutes.`,
        code: "ACCOUNT_LOCKED",
        retryAfter: Math.ceil(timeLeft / 1000),
      });
    } else {
      // Lockout expired, reset
      accountAttempts.delete(identifier);
    }
  }

  // Track failed login for lockout
  req.trackFailedLogin = () => {
    const current = accountAttempts.get(identifier) || { count: 0 };
    current.count += 1;

    if (current.count >= LOCKOUT_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_DURATION;
      logger.warn("Account locked due to failed attempts:", {
        identifier,
        ip: req.ip,
        attempts: current.count,
      });
    }

    accountAttempts.set(identifier, current);
  };

  // Reset attempts on successful login
  req.resetLoginAttempts = () => {
    accountAttempts.delete(identifier);
  };

  next();
};

/**
 * Enhanced security middleware configuration
 */
const enhancedSecurity = (app) => {
  // Trust proxy for Heroku, AWS, etc.
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Comprehensive Helmet configuration
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https:",
            "data:",
            "fonts.googleapis.com",
          ],
          scriptSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://maps.googleapis.com",
            "https://www.google.com",
            process.env.NODE_ENV === "development" ? "'unsafe-eval'" : null,
          ].filter(Boolean),
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "blob:",
            "*.googleapis.com",
            "*.gstatic.com",
          ],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://maps.googleapis.com",
            "https://fonts.googleapis.com",
            process.env.NODE_ENV === "development" ? "ws://localhost:*" : null,
            process.env.NODE_ENV === "development"
              ? "http://localhost:*"
              : null,
          ].filter(Boolean),
          fontSrc: [
            "'self'",
            "https:",
            "data:",
            "fonts.googleapis.com",
            "fonts.gstatic.com",
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "data:", "https:"],
          frameSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://hooks.stripe.com",
            "https://www.google.com",
          ],
          workerSrc: ["'self'", "blob:"],
          manifestSrc: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      permittedCrossDomainPolicies: false,
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // Prevent MIME sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // XSS Protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Feature Policy / Permissions Policy
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(self), payment=(self)"
    );

    // Remove server fingerprinting
    res.removeHeader("X-Powered-By");
    res.setHeader("Server", "AITripPlanner");

    next();
  });

  // Data sanitization against NoSQL query injection
  app.use(
    mongoSanitize({
      allowDots: false,
      replaceWith: "_",
    })
  );

  // Data sanitization against XSS attacks
  app.use(xss());

  // Prevent HTTP Parameter Pollution attacks
  app.use(
    hpp({
      whitelist: ["sort", "fields", "page", "limit", "filter"],
    })
  );

  // Enhanced rate limiting with different tiers
  const createRateLimit = (options) =>
    rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: {
        success: false,
        message:
          options.message ||
          "Too many requests from this IP, please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === "/api/health";
      },
      handler: (req, res) => {
        logger.warn("Rate limit exceeded:", {
          ip: req.ip,
          path: req.path,
          userAgent: req.get("User-Agent"),
        });

        res.status(429).json({
          success: false,
          message: options.message || "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.round(options.windowMs / 1000),
        });
      },
    });

  // Global API rate limiting
  app.use(
    "/api/",
    createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === "production" ? 100 : 1000,
      message: "Too many API requests from this IP",
    })
  );

  // Authentication routes - strictest rate limiting
  app.use(
    "/api/auth/login",
    createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: "Too many login attempts, please try again later",
    })
  );

  app.use(
    "/api/auth/register",
    createRateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: "Too many registration attempts, please try again later",
    })
  );

  app.use(
    "/api/auth/forgot-password",
    createRateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: "Too many password reset requests, please try again later",
    })
  );

  app.use(
    "/api/auth/",
    createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20,
      message: "Too many authentication requests",
    })
  );

  // AI routes - resource intensive
  app.use(
    "/api/ai/",
    createRateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: process.env.NODE_ENV === "production" ? 20 : 100,
      message: "Too many AI requests from this IP",
    })
  );

  // Payment routes - sensitive operations
  app.use(
    "/api/payments/",
    createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      message: "Too many payment requests",
    })
  );

  // File upload routes
  app.use(
    "/api/upload",
    createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20,
      message: "Too many file upload requests",
    })
  );

  // Account lockout for login attempts
  app.use("/api/auth/login", accountLockout);

  // HTTPS enforcement for production
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      const proto = req.headers["x-forwarded-proto"];
      if (proto && proto !== "https") {
        logger.info("Redirecting HTTP to HTTPS:", {
          originalUrl: req.originalUrl,
          ip: req.ip,
        });
        return res.redirect(`https://${req.get("host")}${req.originalUrl}`);
      }
      next();
    });
  }

  // Request size limiting
  app.use((req, res, next) => {
    // Set smaller limits for specific routes
    if (req.path.startsWith("/api/auth/")) {
      req.rawBodyLimit = "1mb";
    } else if (req.path.startsWith("/api/upload/")) {
      req.rawBodyLimit = "10mb";
    }
    next();
  });

  // Security logging middleware
  app.use((req, res, next) => {
    // Log security-relevant requests
    if (req.method !== "GET" || req.path.includes("auth")) {
      logger.info("Security event:", {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  // Silent load in development
  if (process.env.NODE_ENV === "production") {
    logger.info("Enhanced security middleware loaded");
  }
};

module.exports = enhancedSecurity;
