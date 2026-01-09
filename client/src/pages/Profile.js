import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Card, Button, LoadingSpinner } from "../components/ui";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaKey,
  FaBell,
  FaGlobe,
  FaShieldAlt,
  FaHeart,
  FaStar,
  FaRoute,
} from "react-icons/fa";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // profile, settings, security
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      // API call to update password
      toast.success("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      location: user?.location || "",
      bio: user?.bio || "",
    });
    setIsEditing(false);
  };

  // Mock stats
  const stats = [
    {
      label: "Trips Planned",
      value: user?.tripsCount || 12,
      icon: FaRoute,
      color: "from-blue-600 to-purple-600",
    },
    {
      label: "Destinations",
      value: user?.destinationsCount || 8,
      icon: FaGlobe,
      color: "from-purple-600 to-pink-600",
    },
    {
      label: "Favorites",
      value: user?.favoritesCount || 24,
      icon: FaHeart,
      color: "from-pink-600 to-red-600",
    },
    {
      label: "Reviews",
      value: user?.reviewsCount || 15,
      icon: FaStar,
      color: "from-yellow-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/50 dark:to-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            {/* Hero Section with Gradient */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              <div className="absolute -bottom-12 left-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-xl">
                    <FaUser className="h-12 w-12" />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:shadow-xl transition-all">
                    <FaCamera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-16 px-6 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {user?.name || "Your Name"}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center">
                    <FaEnvelope className="mr-2" />
                    {user?.email || "youremail@example.com"}
                  </p>
                  {user?.location && (
                    <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                      <FaMapMarkerAlt className="mr-2" />
                      {user.location}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center mt-1">
                    <FaCalendar className="mr-2" />
                    Member since{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "January 2024"}
                  </p>
                </div>
                {!isEditing && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg"
                    >
                      <FaEdit className="mr-2" />
                      Edit Profile
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05, y: -5 }}
                className="cursor-pointer"
              >
                <Card className="p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <div className="flex gap-2">
              {[
                { id: "profile", label: "Profile", icon: FaUser },
                { id: "settings", label: "Settings", icon: FaBell },
                { id: "security", label: "Security", icon: FaShieldAlt },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === "profile" && (
            <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Personal Information
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${
                        isEditing
                          ? "focus:ring-2 focus:ring-blue-500"
                          : "cursor-not-allowed opacity-75"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${
                        isEditing
                          ? "focus:ring-2 focus:ring-blue-500"
                          : "cursor-not-allowed opacity-75"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="+91 1234567890"
                      className={`w-full pl-10 pr-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${
                        isEditing
                          ? "focus:ring-2 focus:ring-blue-500"
                          : "cursor-not-allowed opacity-75"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="City, Country"
                      className={`w-full pl-10 pr-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${
                        isEditing
                          ? "focus:ring-2 focus:ring-blue-500"
                          : "cursor-not-allowed opacity-75"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows="4"
                    className={`w-full px-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${
                      isEditing
                        ? "focus:ring-2 focus:ring-blue-500"
                        : "cursor-not-allowed opacity-75"
                    }`}
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <FaSave className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="px-6 py-3 rounded-xl border-2 font-semibold"
                      >
                        <FaTimes className="mr-2" />
                        Cancel
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Notification Settings
              </h2>
              <div className="space-y-5">
                {[
                  {
                    label: "Email Notifications",
                    description: "Receive email updates about your trips",
                  },
                  {
                    label: "Push Notifications",
                    description: "Get push notifications on your device",
                  },
                  {
                    label: "Trip Reminders",
                    description: "Reminders before your trips",
                  },
                  {
                    label: "Marketing Emails",
                    description: "Receive promotional offers and updates",
                  },
                ].map((setting, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {setting.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {setting.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={index < 2}
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Change Password
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-4 py-3 border-0 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-4"
                >
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : "Update Password"}
                  </Button>
                </motion.div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
