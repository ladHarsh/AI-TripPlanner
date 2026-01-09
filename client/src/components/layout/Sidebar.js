import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaChartBar,
  FaPlane,
  FaMapMarkedAlt,
  FaRoute,
  FaUsers,
  FaCog,
  FaQuestionCircle,
  FaLifeRing,
  FaDatabase,
  FaFileAlt,
  FaChevronDown,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  const { user, hasPermission, logout } = useAuth();
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState(null);

  const userNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: FaChartBar,
      description: "Overview & Analytics",
    },
    {
      name: "Trip Planner",
      href: "/trip-planner",
      icon: FaPlane,
      description: "Plan your next adventure",
    },
    {
      name: "My Trips",
      href: "/trips",
      icon: FaRoute,
      description: "View all trips",
    },
    {
      name: "Maps",
      href: "/maps",
      icon: FaMapMarkedAlt,
      description: "Explore destinations",
    },
  ];

  const adminNavigation = [
    {
      name: "Admin Panel",
      href: "/admin",
      icon: FaDatabase,
      description: "System management",
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: FaUsers,
      description: "Manage users",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: FaChartBar,
      description: "Platform insights",
    },
    {
      name: "Content Management",
      href: "/admin/content",
      icon: FaFileAlt,
      description: "Manage content",
    },
  ];

  const supportNavigation = [];

  const currentNavigation = hasPermission("admin")
    ? [...userNavigation, ...adminNavigation]
    : userNavigation;

  const NavItem = ({ item, isActive, index }) => (
    <motion.div
      key={item.name}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={item.href}
        className={`group relative flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20"
            : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white hover:shadow-md"
        }`}
      >
        <item.icon
          className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${
            isActive
              ? "text-white"
              : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          }`}
        />
        <div className="flex-1">
          <div className="font-semibold">{item.name}</div>
          <div
            className={`text-xs line-clamp-1 ${
              isActive
                ? "text-blue-100"
                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            }`}
          >
            {item.description}
          </div>
        </div>
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-2.5 w-2.5 bg-white rounded-full shadow-md"
          />
        )}
      </Link>
    </motion.div>
  );

  return (
    <div className="w-72 bg-gradient-to-b from-blue-50 via-purple-50 to-white dark:from-gray-900 dark:via-blue-950/30 dark:to-gray-800 border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col h-screen overflow-hidden shadow-xl">
      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {/* Main Navigation */}
        <div className="space-y-1">
          <h4 className="px-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Main Menu
          </h4>
          {currentNavigation.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive}
                index={index}
              />
            );
          })}
        </div>

        {/* Support Section - Removed */}
        {supportNavigation.length > 0 && (
          <motion.div
            className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="px-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
              Support
            </h4>
            <div className="space-y-1">
              {supportNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavItem
                    key={item.name}
                    item={item}
                    isActive={isActive}
                    index={0}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Quick Actions */}
      <motion.div
        className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2 bg-gradient-to-t from-white via-blue-50/30 to-transparent dark:from-gray-800 dark:via-blue-950/20 dark:to-transparent"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/trip-planner"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 hover:shadow-xl"
          >
            <FaPlane className="mr-2 h-4 w-4" />
            Plan New Trip
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-red-200 dark:border-red-800/50 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200 hover:shadow-md"
          >
            <FaSignOutAlt className="mr-2 h-4 w-4" />
            Logout
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Sidebar;
