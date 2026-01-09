import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Layout = ({
  children,
  showSidebar = false,
  fullScreen = false,
  showNavbarOnly = false,
}) => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  // Add theme class to body
  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const shouldShowSidebar = showSidebar && isAuthenticated;

  // For navbar only (like Maps page)
  if (showNavbarOnly) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
        <Navbar />
        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children || <Outlet />}
          </motion.div>
        </main>
      </div>
    );
  }

  // For full-screen layouts (like auth pages)
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          {children || <Outlet />}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar - only show if authenticated and enabled */}
        {shouldShowSidebar && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden lg:flex lg:flex-shrink-0"
          >
            <Sidebar />
          </motion.aside>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            shouldShowSidebar ? "lg:ml-0" : ""
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full min-h-[calc(100vh-64px)]"
          >
            {children || <Outlet />}
          </motion.div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

// Enhanced Layout with contexts and error boundary
export const LayoutWithProviders = ({ children, ...props }) => {
  return <Layout {...props}>{children}</Layout>;
};

export { Layout };
export default Layout;
