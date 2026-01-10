import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";
import { userAPI, tripAPI, aiAPI } from "../services/api";
import { Card, Button, LoadingSpinner, Badge } from "../components/ui";
import {
  FaPlane,
  FaMapMarkedAlt,
  FaRoute,
  FaCalendarAlt,
  FaRocket,
  FaGlobe,
  FaArrowRight,
  FaPlus,
  FaStar,
} from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasPermission, getRemainingAiRequests } = useAuth();
  const { data: recentTrips, isLoading: tripsLoading } = useApi(
    ["userTrips"],
    () => tripAPI.getTrips().then((res) => res.data.trips || res.data)
  );
  const { 
    data: recommendations, 
    isLoading: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations 
  } = useApi(
    ["aiRecommendations"], 
    () => aiAPI.getRecommendations().then((res) => res.data.data || res.data)
  );

  const remainingAiRequests = getRemainingAiRequests();

  // Function to refresh recommendations
  const handleRefreshRecommendations = async () => {
    try {
      // Call refresh endpoint (clears cache and generates new recommendations)
      await aiAPI.refreshRecommendations();
      // Refetch to update UI
      await refetchRecommendations();
      toast.success("New trip recommendations generated!");
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      toast.error("Failed to generate new recommendations");
    }
  };

  // Filter out draft trips (status === "draft") from dashboard
  const nonDraftTrips =
    recentTrips?.filter((trip) => trip.status !== "draft") || [];

  const quickActions = [
    {
      title: "Plan New Trip",
      description: "Create AI-powered itinerary",
      icon: FaPlane,
      href: "/trip-planner",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "Explore Maps",
      description: "Discover destinations",
      icon: FaMapMarkedAlt,
      href: "/maps",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
  ];

  // Calculate upcoming and completed trips (excluding drafts)
  const upcomingTrips =
    nonDraftTrips?.filter((trip) => {
      const startDate = new Date(trip.startDate);
      const now = new Date();
      return startDate > now;
    }).length || 0;

  const completedTrips =
    nonDraftTrips?.filter((trip) => {
      const endDate = new Date(trip.endDate);
      const now = new Date();
      // Show trips where end date has passed
      return endDate < now;
    }).length || 0;

  const statsCards = [
    {
      title: "Total Trips Generated",
      value: nonDraftTrips?.length || 0,
      icon: FaRoute,
      trend: "All Time",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Upcoming Trips",
      value: upcomingTrips,
      icon: FaCalendarAlt,
      trend: "Planned",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Past Trips",
      value: completedTrips,
      icon: FaStar,
      trend: "Completed",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "AI Requests Left",
      value: remainingAiRequests === -1 ? "∞" : remainingAiRequests,
      icon: FaRocket,
      trend: user?.planType === "free" ? "Upgrade" : "Unlimited",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/50 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold"
                >
                  Welcome back, {user?.name}! 👋
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-blue-100"
                >
                  Ready to plan your next adventure? Let's make it amazing.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 md:mt-0 flex items-center space-x-3"
              >
                <Badge
                  variant={user?.planType === "free" ? "warning" : "success"}
                  className="capitalize text-sm px-3 py-1"
                >
                  {user?.planType} Plan
                </Badge>

                {user?.planType === "free" && (
                  <Link to="/billing">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      <FaRocket className="mr-2" />
                      Upgrade
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {tripsLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          stat.value
                        )}
                      </div>
                      <span
                        className={`ml-2 text-xs font-semibold px-2 py-1 rounded-full ${stat.bgColor} ${stat.color}`}
                      >
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-xl ${stat.bgColor}`}
                  >
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaRocket className="mr-3 text-blue-600" />
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={action.href}
                      className={`block p-6 rounded-2xl text-white transition-all duration-300 transform shadow-lg hover:shadow-2xl ${action.color} ${action.hoverColor}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <action.icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{action.title}</h3>
                          <p className="text-sm text-white/90 mt-1">
                            {action.description}
                          </p>
                        </div>
                        <FaArrowRight className="h-5 w-5" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  AI Recommended Trips
                </h2>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <FaRocket className="h-5 w-5 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                {recommendationsError ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaRocket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {recommendationsError.message?.includes("401") || recommendationsError.message?.includes("Unauthorized")
                        ? "Please log in to see personalized recommendations"
                        : "Unable to load recommendations"}
                    </p>
                  </div>
                ) : recommendationsLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaRocket className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p>Generating personalized recommendations...</p>
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  recommendations.slice(0, 3).map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-start space-x-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-xl"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FaGlobe className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {rec.destination}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {rec.highlights}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge
                            variant="secondary"
                            size="sm"
                            className="font-semibold"
                          >
                            ₹{rec.estimatedCost?.min?.toLocaleString()} - ₹
                            {rec.estimatedCost?.max?.toLocaleString()}
                          </Badge>
                          <Badge variant="secondary" size="sm">
                            {rec.duration} days
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaRocket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recommendations available yet</p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={handleRefreshRecommendations}
                disabled={recommendationsLoading}
              >
                {recommendationsLoading ? (
                  <>
                    <FaRocket className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaRocket className="mr-2" />
                    Get More Recommendations
                  </>
                )}
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Recent Trips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaRoute className="mr-3 text-purple-600" />
                My Trips
              </h2>
              <Link
                to="/trips"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-semibold flex items-center transition-colors"
              >
                View All Trips
                <FaArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </div>

            {tripsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : nonDraftTrips?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nonDraftTrips.map((trip, index) => (
                  <motion.div
                    key={trip._id || trip.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200/50 dark:border-gray-700/50"
                    onClick={() =>
                      (window.location.href = `/trips/${trip._id || trip.id}`)
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                          {trip.destination?.city || trip.title || "Unknown"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(trip.startDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          -{" "}
                          {new Date(trip.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          new Date(trip.endDate) < new Date()
                            ? "success"
                            : "warning"
                        }
                        size="sm"
                      >
                        {new Date(trip.endDate) < new Date()
                          ? "Completed"
                          : "Upcoming"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center">
                        <FaCalendarAlt className="h-4 w-4 mr-2" />
                        <span>
                          {trip.preferences?.duration ||
                            trip.duration ||
                            trip.itinerary?.days?.length ||
                            "N/A"}{" "}
                          days
                        </span>
                      </div>
                      {trip.preferences?.travelStyle && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full capitalize">
                          {trip.preferences.travelStyle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Budget
                        </p>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹
                          {(
                            trip.preferences?.budget?.max ||
                            trip.itinerary?.totalCost?.amount ||
                            trip.totalCost ||
                            0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Activities
                        </p>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {trip.itinerary?.days?.reduce(
                            (total, day) =>
                              total + (day.activities?.length || 0),
                            0
                          ) || 0}{" "}
                          planned
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <FaPlane className="relative h-20 w-20 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No trips yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Start planning your first adventure with AI assistance
                </p>
                <Link to="/trip-planner">
                  <Button variant="primary" className="px-6 py-3">
                    <FaPlus className="mr-2" />
                    Plan Your First Trip
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
