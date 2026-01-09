import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiService, { authAPI } from "../services/apiNew";

/**
 * Enhanced AuthContext with Enterprise Security Features
 *
 * Features:
 * - Dual-token JWT system (memory + HttpOnly cookies)
 * - Automatic token refresh
 * - Cross-tab synchronization
 * - Account lockout handling
 * - Email verification flow
 * - Security event logging
 * - Role-based permissions
 * - Session management
 */

const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  lastActivity: null,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  securityEvents: [],
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_INITIALIZED":
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        lastActivity: Date.now(),
      };

    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        lastActivity: null,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case "UPDATE_ACTIVITY":
      return {
        ...state,
        lastActivity: Date.now(),
      };

    case "ADD_SECURITY_EVENT":
      return {
        ...state,
        securityEvents: [action.payload, ...state.securityEvents.slice(0, 9)], // Keep last 10
      };

    case "SESSION_EXPIRED":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        lastActivity: null,
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);
  const sessionTimeoutRef = useRef(null);
  const activityListenerRef = useRef(null);

  /**
   * Add security event to logs
   */
  const addSecurityEvent = useCallback(
    (event) => {
      const securityEvent = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...event,
      };

      dispatch({
        type: "ADD_SECURITY_EVENT",
        payload: securityEvent,
      });

      // Also send to server for logging
      if (state.isAuthenticated) {
        authAPI.getSecurityLog().catch(() => {
          // Ignore errors in security logging
        });
      }
    },
    [state.isAuthenticated]
  );

  /**
   * Update user activity
   */
  const updateActivity = useCallback(() => {
    if (state.isAuthenticated) {
      dispatch({ type: "UPDATE_ACTIVITY" });
      resetSessionTimeout();
    }
  }, [state.isAuthenticated]);

  /**
   * Reset session timeout
   */
  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    if (state.isAuthenticated) {
      sessionTimeoutRef.current = setTimeout(() => {
        dispatch({ type: "SESSION_EXPIRED" });
        toast.error("Session expired due to inactivity");
        logout();
      }, state.sessionTimeout);
    }
  }, [state.isAuthenticated, state.sessionTimeout]);

  /**
   * Setup activity listeners
   */
  const setupActivityListeners = useCallback(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    const activityHandler = () => {
      updateActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, activityHandler, true);
    });

    activityListenerRef.current = () => {
      events.forEach((event) => {
        document.removeEventListener(event, activityHandler, true);
      });
    };
  }, [updateActivity]);

  /**
   * Setup automatic token refresh
   */
  const setupTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Refresh token every 14 minutes (access token expires in 15 minutes)
    refreshIntervalRef.current = setInterval(async () => {
      if (state.isAuthenticated) {
        try {
          await authAPI.refresh();
          addSecurityEvent({
            type: "TOKEN_REFRESH",
            status: "success",
          });
        } catch (error) {
          console.error("Token refresh failed:", error);
          addSecurityEvent({
            type: "TOKEN_REFRESH",
            status: "failed",
            error: error.message,
          });
          logout();
        }
      }
    }, 14 * 60 * 1000); // 14 minutes
  }, [state.isAuthenticated, addSecurityEvent]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Try to get user profile (this will trigger token refresh if needed)
      const response = await authAPI.getProfile();

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.user,
        },
      });

      addSecurityEvent({
        type: "AUTH_INITIALIZED",
        status: "success",
      });
    } catch (error) {
      console.error("Auth initialization failed:", error);
      dispatch({ type: "LOGIN_FAILURE" });

      addSecurityEvent({
        type: "AUTH_INITIALIZED",
        status: "failed",
        error: error.message,
      });
    } finally {
      dispatch({ type: "SET_INITIALIZED" });
    }
  }, [addSecurityEvent]);

  /**
   * Login function
   */
  const login = async (email, password, deviceInfo = {}) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.login({
        email,
        password,
        deviceFingerprint: generateDeviceFingerprint(),
        ...deviceInfo,
      });

      const { user, accessToken } = response;

      // Set access token in memory
      apiService.setAccessToken(accessToken);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user },
      });

      addSecurityEvent({
        type: "LOGIN",
        status: "success",
        email,
      });

      toast.success("Login successful!");

      // Redirect based on user role or intended destination
      const redirectTo =
        sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirectTo);

      return { success: true };
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE" });

      const errorData = error;
      const message = errorData.message || "Login failed";

      addSecurityEvent({
        type: "LOGIN",
        status: "failed",
        email,
        error: message,
        errorCode: errorData.code,
      });

      // Handle specific error cases
      if (errorData.code === "ACCOUNT_LOCKED") {
        toast.error(`Account locked. ${message}`);
      } else if (errorData.code === "EMAIL_NOT_VERIFIED") {
        toast.error("Please verify your email before logging in");
      } else if (errorData.code === "INVALID_CREDENTIALS") {
        toast.error("Invalid email or password");
      } else {
        toast.error(message);
      }

      return {
        success: false,
        message,
        code: errorData.code,
        remainingAttempts: errorData.remainingAttempts,
      };
    }
  };

  /**
   * Register function
   */
  const register = async (userData, deviceInfo = {}) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.register({
        ...userData,
        deviceFingerprint: generateDeviceFingerprint(),
        ...deviceInfo,
      });

      const { user, accessToken, emailVerificationRequired } = response;

      if (emailVerificationRequired) {
        toast.success(
          "Registration successful! Please check your email for verification link."
        );
        navigate("/verify-email", { state: { email: userData.email } });
        return { success: true, emailVerificationRequired: true };
      }

      // Set access token if no verification required
      apiService.setAccessToken(accessToken);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user },
      });

      addSecurityEvent({
        type: "REGISTER",
        status: "success",
        email: userData.email,
      });

      toast.success("Registration successful!");
      navigate("/dashboard");

      return { success: true };
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE" });

      const errorData = error;
      const message = errorData.message || "Registration failed";

      addSecurityEvent({
        type: "REGISTER",
        status: "failed",
        email: userData.email,
        error: message,
      });

      toast.error(message);
      return { success: false, message, errors: errorData.errors };
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      // Clear timeouts
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      // Call logout API
      await authAPI.logout();

      addSecurityEvent({
        type: "LOGOUT",
        status: "success",
      });
    } catch (error) {
      console.error("Logout error:", error);
      addSecurityEvent({
        type: "LOGOUT",
        status: "failed",
        error: error.message,
      });
    } finally {
      // Clear access token
      apiService.setAccessToken(null);

      dispatch({ type: "LOGOUT" });
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  /**
   * Verify email
   */
  const verifyEmail = async (token) => {
    try {
      const response = await authAPI.verify(token);
      const { user, accessToken } = response;

      apiService.setAccessToken(accessToken);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user },
      });

      addSecurityEvent({
        type: "EMAIL_VERIFIED",
        status: "success",
      });

      toast.success("Email verified successfully!");
      navigate("/dashboard");

      return { success: true };
    } catch (error) {
      const message = error.message || "Email verification failed";
      toast.error(message);

      addSecurityEvent({
        type: "EMAIL_VERIFIED",
        status: "failed",
        error: message,
      });

      return { success: false, message };
    }
  };

  /**
   * Resend verification email
   */
  const resendVerification = async () => {
    try {
      await authAPI.resendVerification();
      toast.success("Verification email sent!");
      return { success: true };
    } catch (error) {
      const message = error.message || "Failed to send verification email";
      toast.error(message);
      return { success: false, message };
    }
  };

  /**
   * Forgot password
   */
  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword(email);
      toast.success("Password reset link sent to your email!");
      return { success: true };
    } catch (error) {
      const message = error.message || "Failed to send reset email";
      toast.error(message);
      return { success: false, message };
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (token, password, confirmPassword) => {
    try {
      await authAPI.resetPassword(token, password, confirmPassword);
      toast.success("Password reset successfully!");
      navigate("/login");
      return { success: true };
    } catch (error) {
      const message = error.message || "Password reset failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  /**
   * Change password
   */
  const changePassword = async (
    currentPassword,
    newPassword,
    confirmPassword
  ) => {
    try {
      await authAPI.changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      );

      addSecurityEvent({
        type: "PASSWORD_CHANGED",
        status: "success",
      });

      toast.success("Password changed successfully!");
      return { success: true };
    } catch (error) {
      const message = error.message || "Password change failed";

      addSecurityEvent({
        type: "PASSWORD_CHANGED",
        status: "failed",
        error: message,
      });

      toast.error(message);
      return { success: false, message };
    }
  };

  /**
   * Update profile
   */
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);

      dispatch({
        type: "UPDATE_USER",
        payload: response.user,
      });

      addSecurityEvent({
        type: "PROFILE_UPDATED",
        status: "success",
      });

      toast.success("Profile updated successfully!");
      return { success: true };
    } catch (error) {
      const message = error.message || "Profile update failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!state.user) return false;

      // Admin has all permissions
      if (state.user.role === "admin") return true;

      // Check role-based permissions
      const userRoles = Array.isArray(state.user.roles)
        ? state.user.roles
        : [state.user.role];
      const userPermissions = state.user.permissions || [];

      // Check direct permission
      if (userPermissions.includes(permission)) return true;

      // Check role-based permissions
      switch (permission) {
        case "admin":
          return userRoles.includes("admin");
        case "premium":
          return ["premium", "pro", "admin"].some((role) =>
            userRoles.includes(role)
          );
        case "pro":
          return ["pro", "admin"].some((role) => userRoles.includes(role));
        default:
          return true; // Basic permissions
      }
    },
    [state.user]
  );

  /**
   * Check if user has role
   */
  const hasRole = useCallback(
    (role) => {
      if (!state.user) return false;
      const userRoles = Array.isArray(state.user.roles)
        ? state.user.roles
        : [state.user.role];
      return userRoles.includes(role);
    },
    [state.user]
  );

  /**
   * Get remaining AI requests
   */
  const getRemainingAiRequests = useCallback(() => {
    if (!state.user) return 0;
    return state.user.aiRequestsRemaining || 0;
  }, [state.user]);

  /**
   * Generate device fingerprint
   */
  const generateDeviceFingerprint = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Device fingerprint", 2, 2);

    return btoa(
      JSON.stringify({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvas.toDataURL(),
      })
    );
  };

  // Setup effects
  useEffect(() => {
    if (!state.isInitialized) {
      initializeAuth();
    }
  }, [state.isInitialized, initializeAuth]);

  useEffect(() => {
    if (state.isAuthenticated) {
      setupTokenRefresh();
      setupActivityListeners();
      resetSessionTimeout();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (activityListenerRef.current) {
        activityListenerRef.current();
      }
    };
  }, [
    state.isAuthenticated,
    setupTokenRefresh,
    setupActivityListeners,
    resetSessionTimeout,
  ]);

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    lastActivity: state.lastActivity,
    securityEvents: state.securityEvents,

    // Auth methods
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,

    // Permission methods
    hasPermission,
    hasRole,
    getRemainingAiRequests,

    // Utility methods
    updateActivity,
    addSecurityEvent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
