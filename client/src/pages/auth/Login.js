import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { Button, Input, Card, LoadingSpinner } from "../../components/ui";
import { FaRoute, FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { values, errors, handleChange, handleBlur, isValid } =
    useFormValidation(
      {
        email: "",
        password: "",
        rememberMe: false,
      },
      {
        email: {
          required: true,
          email: true,
        },
        password: {
          required: true,
          minLength: 6,
        },
      }
    );

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/50 dark:to-gray-900 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-2xl w-full mx-auto relative z-10">
        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full flex items-center justify-center p-4"
        >
          <div className="w-full">
            <div className="text-center mb-8">
              <motion.div
                className="flex justify-center mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75"></div>
                  <div className="relative bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl">
                    <FaRoute className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
              </motion.div>
              <motion.h2
                className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                AI Trip Planner
              </motion.h2>
              <motion.p
                className="text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Welcome Back
              </motion.p>
            </div>

            <Card className="p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Input
                    name="email"
                    type="email"
                    label="Email address"
                    placeholder="Enter your email"
                    icon={FaEnvelope}
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                    required
                  />
                </div>

                <div>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    placeholder="Enter your password"
                    icon={FaLock}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.password}
                    required
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={values.rememberMe}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                    >
                      Remember me
                    </label>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!isValid || isLoading}
                  loading={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                    >
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </form>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
