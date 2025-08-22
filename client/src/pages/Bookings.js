import React from 'react';
import { motion } from 'framer-motion';
import { FaTicketAlt, FaCalendar, FaCheckCircle } from 'react-icons/fa';

const Bookings = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Bookings</h1>
          <p className="text-xl text-gray-600">View and manage your travel bookings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center py-12"
        >
          <FaTicketAlt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Management Coming Soon</h3>
          <p className="text-gray-600">
            We're working on bringing you comprehensive booking management features.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Bookings;
