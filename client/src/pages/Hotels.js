import React from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaMapMarkerAlt, FaStar } from 'react-icons/fa';

const Hotels = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Hotel</h1>
          <p className="text-xl text-gray-600">Discover amazing accommodations worldwide</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Destination"
                className="input pl-10"
              />
            </div>
            <input
              type="date"
              placeholder="Check-in"
              className="input"
            />
            <input
              type="date"
              placeholder="Check-out"
              className="input"
            />
            <button className="btn bg-primary-600 text-white hover:bg-primary-700">
              <FaSearch className="mr-2" />
              Search Hotels
            </button>
          </div>
        </motion.div>

        {/* Content Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center py-12"
        >
          <FaSearch className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hotel Search Coming Soon</h3>
          <p className="text-gray-600">
            We're working on bringing you the best hotel search experience.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Hotels;
