import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContextNew";
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const VerifyEmail = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [canResend, setCanResend] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  const email = location.state?.email || "";
  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setStatus("waiting");
      setMessage("Please check your email for verification link.");
    }
  }, [token]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerification = async () => {
    try {
      setStatus("loading");
      const result = await verifyEmail(token);

      if (result.success) {
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to dashboard...");

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.message || "Email verification failed.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred during verification. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    if (!canResend) return;

    try {
      setCanResend(false);
      setResendCooldown(60); // 60 seconds cooldown

      const result = await resendVerification();

      if (result.success) {
        setMessage("Verification email sent! Please check your inbox.");
      } else {
        setMessage(result.message || "Failed to send verification email.");
        setCanResend(true);
        setResendCooldown(0);
      }
    } catch (error) {
      setMessage("An error occurred. Please try again later.");
      setCanResend(true);
      setResendCooldown(0);
    }
  };

  const renderIcon = () => {
    switch (status) {
      case "loading":
        return <LoadingSpinner size="lg" className="text-indigo-600" />;
      case "success":
        return <CheckCircleIcon className="h-16 w-16 text-green-500" />;
      case "error":
        return <XCircleIcon className="h-16 w-16 text-red-500" />;
      case "waiting":
        return <InformationCircleIcon className="h-16 w-16 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "waiting":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        {/* Icon and Status */}
        <div className="space-y-6">
          <div className="flex justify-center">{renderIcon()}</div>

          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
            {status === "waiting" && "Check Your Email"}
          </div>

          <div className="text-gray-600">
            {email && (
              <p className="mb-4">
                Verification email sent to:{" "}
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            )}
            <p>{message}</p>
          </div>
        </div>

        {/* Action buttons */}
        {(status === "waiting" || status === "error") && (
          <div className="space-y-4">
            {/* Resend button */}
            <button
              onClick={handleResendVerification}
              disabled={!canResend}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Verification Email"}
            </button>

            {/* Back to login */}
            <Link
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Continue to Dashboard
            </Link>
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="text-left space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Didn't receive the email?
            </p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
              <li>Check your spam/junk folder</li>
              <li>Make sure the email address is correct</li>
              <li>Try adding our domain to your safe sender list</li>
              <li>Wait a few minutes and try resending</li>
            </ul>
          </div>
        </div>

        {/* Contact support */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Still having trouble?{" "}
            <Link
              to="/contact"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
