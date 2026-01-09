import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { Button, Input, Card } from "../../components/ui";
import {
  FaRoute,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaShieldAlt,
  FaRocket,
  FaGlobe,
  FaHeart,
} from "react-icons/fa";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const { values, errors, handleChange, handleBlur, isValid } =
    useFormValidation(
      {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      {
        name: {
          required: true,
          minLength: 2,
        },
        email: {
          required: true,
          email: true,
        },
        password: {
          required: true,
          minLength: 6,
        },
        confirmPassword: {
          required: true,
          validate: (value, allValues) => {
            if (!allValues || !allValues.password) return null;
            return value === allValues.password
              ? null
              : "Passwords do not match";
          },
        },
      }
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const result = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      if (result.success) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: FaRocket, text: "AI-powered trip planning" },
    { icon: FaGlobe, text: "Interactive maps" },
    { icon: FaShieldAlt, text: "Secure & private" },
  ];

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
        {/* Registration Form */}
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
                Create Your Account
              </motion.p>
            </div>

            <Card className="p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Input
                    name="name"
                    type="text"
                    label="Full Name"
                    placeholder="Enter your full name"
                    icon={FaUser}
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.name}
                    required
                  />
                </div>

                <div>
                  <Input
                    name="email"
                    type="email"
                    label="Email Address"
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
                    placeholder="Create a strong password"
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

                  {/* Password Requirement */}
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <div
                      className={`flex items-center ${
                        values.password && values.password.length >= 6
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <span className="mr-1">✓</span>
                      Minimum 6 characters required
                    </div>
                  </div>
                </div>

                <div>
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    icon={FaLock}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.confirmPassword}
                    required
                    rightElement={
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    }
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  disabled={!isValid || isLoading}
                  loading={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create my account"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </Card>

            {/* Trust Indicators */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <FaShieldAlt className="h-4 w-4 mr-1.5 text-green-500" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center">
                  <FaRocket className="h-4 w-4 mr-1.5 text-purple-500" />
                  <span>Free to Start</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
