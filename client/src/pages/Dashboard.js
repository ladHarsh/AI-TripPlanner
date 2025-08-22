import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  FaPlane, 
  FaHotel, 
  FaMapMarkedAlt, 
  FaRoute, 
  FaCalendarAlt,
  FaClock,
  FaPlus
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch user data
  const { data: tripsData, isLoading: tripsLoading } = useQuery(
    'upcomingTrips',
    () => api.get('/api/trips/upcoming?limit=3').then(res => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery(
    'recentBookings',
    () => api.get('/api/bookings?limit=5').then(res => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const stats = [
    {
      title: 'Upcoming Trips',
      value: tripsData?.count || 0,
      icon: FaPlane,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/trips'
    },
    {
      title: 'Active Bookings',
      value: bookingsData?.count || 0,
      icon: FaHotel,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/bookings'
    },
    {
      title: 'Saved Locations',
      value: user?.savedDestinations?.length || 0,
      icon: FaMapMarkedAlt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/maps'
    },
    {
      title: 'Total Trips',
      value: '12', // This would come from API
      icon: FaRoute,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/trips'
    }
  ];

  const quickActions = [
    {
      title: 'Plan New Trip',
      description: 'Create a new AI-powered itinerary',
      icon: FaPlus,
      link: '/planner',
      color: 'bg-gradient-to-r from-primary-600 to-primary-700'
    },
    {
      title: 'Book Hotel',
      description: 'Find and book accommodation',
      icon: FaHotel,
      link: '/hotels',
      color: 'bg-gradient-to-r from-green-600 to-green-700'
    },
    {
      title: 'Book Transport',
      description: 'Book flights, trains, or buses',
      icon: FaPlane,
      link: '/transport',
      color: 'bg-gradient-to-r from-blue-600 to-blue-700'
    },
    {
      title: 'Live Maps',
      description: 'Explore destinations and save locations',
      icon: FaMapMarkedAlt,
      link: '/maps',
      color: 'bg-gradient-to-r from-purple-600 to-purple-700'
    }
  ];

  if (tripsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg p-6 text-white"
      >
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to plan your next adventure? Let's make it amazing!
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="card-hover p-6 transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.title}
              to={action.link}
              className={`${action.color} text-white rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <action.icon className="h-8 w-8" />
                <FaPlus className="h-4 w-4 opacity-75" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Trips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
            <Link
              to="/trips"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          
          {tripsData?.trips?.length > 0 ? (
            <div className="space-y-4">
              {tripsData.trips.map((trip) => (
                <div key={trip._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FaPlane className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {trip.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {trip.destination.city}, {trip.destination.country}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(trip.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {trip.preferences.duration} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaCalendarAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No upcoming trips</p>
              <Link
                to="/planner"
                className="btn-primary"
              >
                Plan Your First Trip
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <Link
              to="/bookings"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          
          {bookingsData?.bookings?.length > 0 ? (
            <div className="space-y-4">
              {bookingsData.bookings.slice(0, 3).map((booking) => (
                <div key={booking._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {booking.type === 'hotel' ? (
                      <FaHotel className="h-6 w-6 text-green-600" />
                    ) : (
                      <FaPlane className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {booking.type === 'hotel' ? 'Hotel Booking' : `${booking.type} Booking`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.bookingReference}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`badge ${
                      booking.status === 'confirmed' ? 'badge-success' :
                      booking.status === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No recent bookings</p>
              <Link
                to="/hotels"
                className="btn-primary"
              >
                Book Your First Stay
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
