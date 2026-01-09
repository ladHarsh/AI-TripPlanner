const User = require("../models/User");
const tokenManager = require("../utils/tokens");
const { logger } = require("./logging");
const { cache } = require("./cache");

/**
 * Enhanced Authentication Middleware with Security Features
 */

/**
 * Protect routes - require valid access token
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = tokenManager.extractTokenFromHeader(req.headers.authorization);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Validate token structure
    if (!tokenManager.isValidTokenStructure(token)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // Check if token is blacklisted (optional implementation)
    if (await tokenManager.isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked",
      });
    }

    // Verify access token
    let decoded;
    try {
      decoded = tokenManager.verifyAccessToken(token);
    } catch (error) {
      logger.warn("Invalid access token:", {
        error: error.message,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(401).json({
        success: false,
        message:
          error.message === "Access token expired"
            ? "Token expired. Please refresh your session."
            : "Invalid token",
      });
    }

    // Check if user exists and is active
    const user = await User.findOne({
      _id: decoded.id,
      isActive: true,
    }).select("-password");

    if (!user) {
      logger.warn("Token valid but user not found or inactive:", {
        userId: decoded.id,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: "User not found or account deactivated",
      });
    }

    // Check if account is locked
    if (user.isAccountLocked) {
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked",
        lockUntil: user.lockUntil,
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      logger.warn("Token issued before password change:", {
        userId: user._id,
        tokenIat: decoded.iat,
        passwordChangedAt: user.passwordChangedAt,
      });

      return res.status(401).json({
        success: false,
        message: "Password recently changed. Please log in again.",
      });
    }

    // Update user's last activity
    user.lastActivity = new Date();
    await user.save();

    // Add user to request object
    req.user = user;
    req.tokenPayload = decoded;

    // Log successful authentication
    logger.debug("User authenticated successfully:", {
      userId: user._id,
      ip: req.ip,
      route: req.originalUrl,
    });

    next();
  } catch (error) {
    logger.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Authorize specific roles
 * Usage: authorize('admin', 'superadmin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn("Unauthorized access attempt:", {
          userId: req.user._id,
          userRole: req.user.role,
          requiredRoles: roles,
          route: req.originalUrl,
          ip: req.ip,
        });

        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(
            " or "
          )}. Your role: ${req.user.role}`,
        });
      }

      logger.debug("User authorized successfully:", {
        userId: req.user._id,
        userRole: req.user.role,
        route: req.originalUrl,
      });

      next();
    } catch (error) {
      logger.error("Authorization middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  };
};

/**
 * Check specific permissions (more granular than roles)
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Define permission hierarchy
      const permissions = {
        "admin.users.read": ["admin", "superadmin"],
        "admin.users.write": ["superadmin"],
        "admin.system.manage": ["superadmin"],
        "user.profile.update": ["user", "admin", "superadmin"],
        "ai.requests.unlimited": ["premium", "enterprise"],
        // Add more permissions as needed
      };

      const requiredRoles = permissions[permission];

      if (!requiredRoles) {
        logger.error("Unknown permission requested:", { permission });
        return res.status(403).json({
          success: false,
          message: "Invalid permission",
        });
      }

      // Check role-based permissions
      if (!requiredRoles.includes(req.user.role)) {
        // Check plan-based permissions for certain actions
        if (
          permission.startsWith("ai.") &&
          requiredRoles.includes(req.user.planType)
        ) {
          return next();
        }

        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      logger.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Optional authentication - doesn't require token but adds user if valid token exists
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = tokenManager.extractTokenFromHeader(req.headers.authorization);
    }

    if (token && tokenManager.isValidTokenStructure(token)) {
      try {
        const decoded = tokenManager.verifyAccessToken(token);
        const user = await User.findOne({
          _id: decoded.id,
          isActive: true,
        }).select("-password");

        if (
          user &&
          !user.isAccountLocked &&
          !user.changedPasswordAfter(decoded.iat)
        ) {
          req.user = user;
          req.tokenPayload = decoded;

          // Update last activity
          user.lastActivity = new Date();
          await user.save();
        }
      } catch (error) {
        // Token is invalid but we don't block the request
        logger.debug("Optional auth token invalid:", {
          error: error.message,
          ip: req.ip,
        });
      }
    }

    next();
  } catch (error) {
    logger.error("Optional auth middleware error:", error);
    // Don't block the request on error
    next();
  }
};

/**
 * Require email verification
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required",
      action: "verify_email",
    });
  }

  next();
};

/**
 * Check account status (active, not locked, etc.)
 */
const checkAccountStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Account is deactivated",
    });
  }

  if (req.user.isAccountLocked) {
    return res.status(423).json({
      success: false,
      message: "Account is temporarily locked",
      lockUntil: req.user.lockUntil,
    });
  }

  next();
};

/**
 * Rate limiting by user (additional to IP-based rate limiting)
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(); // Skip if no user (let IP-based rate limiting handle it)
    }

    try {
      const key = `user_rate_limit:${req.user._id}`;
      const current = await cache.incr(key, Math.ceil(windowMs / 1000));

      if (current > maxRequests) {
        logger.warn("User rate limit exceeded:", {
          userId: req.user._id,
          requests: current,
          limit: maxRequests,
          ip: req.ip,
        });

        return res.status(429).json({
          success: false,
          message: "Too many requests. Please slow down.",
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      res.set({
        "X-RateLimit-Limit": maxRequests,
        "X-RateLimit-Remaining": Math.max(0, maxRequests - current),
        "X-RateLimit-Reset": new Date(Date.now() + windowMs),
      });

      next();
    } catch (error) {
      logger.error("User rate limit error:", error);
      next(); // Don't block on rate limit errors
    }
  };
};

module.exports = {
  protect,
  authorize,
  checkPermission,
  optionalAuth,
  requireEmailVerification,
  checkAccountStatus,
  userRateLimit,
};
