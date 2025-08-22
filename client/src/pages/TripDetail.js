import React from 'react';
import { motion } from 'framer-motion';
import { FaRoute, FaCalendar, FaMapMarkedAlt } from 'react-icons/fa';

const TripDetail = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <FaRoute className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Trip Details</h1>
          <p className="text-xl text-gray-600">
            Detailed trip information and itinerary coming soon.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TripDetail;
