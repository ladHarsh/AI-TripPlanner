import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { FaMapMarkedAlt, FaCalendarAlt, FaDollarSign, FaUsers, FaBed, FaCar, FaLightbulb, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../services/api';

const TripPlanner = () => {
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Generate itinerary mutation
  const generateItineraryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/ai/generate-itinerary', data);
      return response.data;
    },
    onSuccess: (data) => {
      setItinerary(data.trip);
      toast.success('Itinerary generated successfully!');
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Error generating itinerary:', error);
      toast.error(error.response?.data?.message || 'Failed to generate itinerary');
      setIsGenerating(false);
    }
  });

  const onSubmit = async (data) => {
    setIsGenerating(true);
    
    // Format the data for the API
    const tripData = {
      destination: data.destination,
      duration: parseInt(data.duration),
      budget: {
        min: parseInt(data.budgetMin),
        max: parseInt(data.budgetMax),
        currency: 'USD'
      },
      travelStyle: data.travelStyle,
      groupSize: parseInt(data.groupSize),
      interests: data.interests || [],
      accommodation: data.accommodation,
      transport: data.transport ? [data.transport] : [],
      startDate: data.startDate,
      endDate: data.endDate
    };

    generateItineraryMutation.mutate(tripData);
  };

  const travelStyles = [
    { value: 'budget', label: 'Budget', icon: '💰' },
    { value: 'luxury', label: 'Luxury', icon: '✨' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'cultural', label: 'Cultural', icon: '🏛️' },
    { value: 'relaxation', label: 'Relaxation', icon: '🌴' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' }
  ];

  const accommodationTypes = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'resort', label: 'Resort' },
    { value: 'camping', label: 'Camping' }
  ];

  const transportOptions = [
    { value: 'public', label: 'Public Transport' },
    { value: 'rental', label: 'Car Rental' },
    { value: 'walking', label: 'Walking' },
    { value: 'biking', label: 'Biking' },
    { value: 'taxi', label: 'Taxi/Rideshare' }
  ];

  const interests = [
    'Museums', 'Nature', 'Food', 'Shopping', 'Sports', 'History', 
    'Art', 'Music', 'Photography', 'Architecture', 'Local Culture', 'Nightlife'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <FaLightbulb className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">AI Trip Planner</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let our AI create a personalized travel itinerary just for you. 
            Tell us your preferences and we'll plan the perfect trip!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trip Planning Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="card">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Plan Your Trip
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkedAlt className="inline mr-2" />
                    Destination *
                  </label>
                  <input
                    type="text"
                    {...register('destination', { required: 'Destination is required' })}
                    className={`input ${errors.destination ? 'input-error' : ''}`}
                    placeholder="e.g., Paris, France"
                  />
                  {errors.destination && (
                    <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="inline mr-2" />
                    Trip Duration (days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    {...register('duration', { 
                      required: 'Duration is required',
                      min: { value: 1, message: 'Minimum 1 day' },
                      max: { value: 30, message: 'Maximum 30 days' }
                    })}
                    className={`input ${errors.duration ? 'input-error' : ''}`}
                    placeholder="7"
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
                  )}
                </div>

                {/* Budget Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaDollarSign className="inline mr-2" />
                      Min Budget ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('budgetMin', { 
                        required: 'Minimum budget is required',
                        min: { value: 0, message: 'Budget must be positive' }
                      })}
                      className={`input ${errors.budgetMin ? 'input-error' : ''}`}
                      placeholder="500"
                    />
                    {errors.budgetMin && (
                      <p className="text-red-500 text-sm mt-1">{errors.budgetMin.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaDollarSign className="inline mr-2" />
                      Max Budget ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('budgetMax', { 
                        required: 'Maximum budget is required',
                        min: { value: 0, message: 'Budget must be positive' }
                      })}
                      className={`input ${errors.budgetMax ? 'input-error' : ''}`}
                      placeholder="2000"
                    />
                    {errors.budgetMax && (
                      <p className="text-red-500 text-sm mt-1">{errors.budgetMax.message}</p>
                    )}
                  </div>
                </div>

                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Style *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {travelStyles.map((style) => (
                      <label key={style.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          value={style.value}
                          {...register('travelStyle', { required: 'Travel style is required' })}
                          className="mr-3"
                        />
                        <span className="text-lg mr-2">{style.icon}</span>
                        <span className="text-sm font-medium">{style.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.travelStyle && (
                    <p className="text-red-500 text-sm mt-1">{errors.travelStyle.message}</p>
                  )}
                </div>

                {/* Group Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUsers className="inline mr-2" />
                    Group Size *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    {...register('groupSize', { 
                      required: 'Group size is required',
                      min: { value: 1, message: 'Minimum 1 person' },
                      max: { value: 10, message: 'Maximum 10 people' }
                    })}
                    className={`input ${errors.groupSize ? 'input-error' : ''}`}
                    placeholder="2"
                  />
                  {errors.groupSize && (
                    <p className="text-red-500 text-sm mt-1">{errors.groupSize.message}</p>
                  )}
                </div>

                {/* Accommodation Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaBed className="inline mr-2" />
                    Accommodation Preference
                  </label>
                  <select
                    {...register('accommodation')}
                    className="input"
                  >
                    <option value="">Any accommodation</option>
                    {accommodationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transport Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCar className="inline mr-2" />
                    Transport Preference
                  </label>
                  <select
                    {...register('transport')}
                    className="input"
                  >
                    <option value="">Any transport</option>
                    {transportOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests (Select multiple)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {interests.map((interest) => (
                      <label key={interest} className="flex items-center">
                        <input
                          type="checkbox"
                          value={interest.toLowerCase()}
                          {...register('interests')}
                          className="mr-2"
                        />
                        <span className="text-sm">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className="input"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold w-full flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Generating Itinerary...
                    </>
                  ) : (
                    <>
                      <FaLightbulb className="mr-2" />
                      Generate AI Itinerary
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Generated Itinerary */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {itinerary ? (
              <div className="card">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Your AI-Generated Itinerary
                </h2>
                
                <div className="space-y-6">
                  {/* Trip Summary */}
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-primary-900 mb-2">
                      {itinerary.title}
                    </h3>
                    <p className="text-primary-700">{itinerary.description}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-primary-600">
                        Total Cost: ${itinerary.itinerary?.totalCost?.amount || 'TBD'}
                      </span>
                      <span className="text-primary-600">
                        {itinerary.preferences?.duration} days
                      </span>
                    </div>
                  </div>

                  {/* Daily Itinerary */}
                  {itinerary.itinerary?.days?.map((day, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Day {day.day} - {day.date}
                      </h4>
                      
                      <div className="space-y-3">
                        {day.activities?.map((activity, actIndex) => (
                          <div key={actIndex} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-500 min-w-[60px]">
                              {activity.time}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">
                                {activity.activity}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {activity.location?.name || activity.location}
                              </p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span>${activity.cost?.amount || activity.cost}</span>
                                <span>{activity.duration}h</span>
                                <span className="capitalize">{activity.type}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Day Total:</span>
                          <span className="font-medium">
                            ${day.totalCost?.amount || day.totalCost}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Recommendations */}
                  {itinerary.recommendations && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                      
                      {itinerary.recommendations.localTips && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Local Tips</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {itinerary.recommendations.localTips.map((tip, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-primary-600 mr-2">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {itinerary.recommendations.safetyTips && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Safety Tips</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {itinerary.recommendations.safetyTips.map((tip, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-warning-600 mr-2">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button className="btn bg-primary-600 text-white hover:bg-primary-700 flex-1">
                      Save Trip
                    </button>
                    <button className="btn border border-gray-300 text-gray-700 hover:bg-gray-50 flex-1">
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FaLightbulb className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Itinerary Yet</h3>
                  <p className="text-sm">
                    Fill out the form on the left and click "Generate AI Itinerary" 
                    to create your personalized travel plan.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
