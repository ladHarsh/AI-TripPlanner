const express = require('express');
const axios = require('axios');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/maps/places/nearby
// @desc    Get nearby places (hotels, restaurants, attractions)
// @access  Public
router.get('/places/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type = 'lodging' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const params = {
      location: `${lat},${lng}`,
      radius: radius,
      type: type,
      key: apiKey
    };

    const response = await axios.get(url, { params });
    
    if (response.data.status === 'OK') {
      res.json({
        success: true,
        places: response.data.results,
        nextPageToken: response.data.next_page_token
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Places API error: ${response.data.status}`,
        error: response.data.error_message
      });
    }
  } catch (error) {
    console.error('Nearby places error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby places'
    });
  }
});

// @route   GET /api/maps/places/details
// @desc    Get detailed information about a place
// @access  Public
router.get('/places/details', async (req, res) => {
  try {
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required'
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const params = {
      place_id: placeId,
      fields: 'name,formatted_address,geometry,formatted_phone_number,website,rating,reviews,photos,opening_hours,price_level,types',
      key: apiKey
    };

    const response = await axios.get(url, { params });
    
    if (response.data.status === 'OK') {
      res.json({
        success: true,
        place: response.data.result
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Places API error: ${response.data.status}`,
        error: response.data.error_message
      });
    }
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching place details'
    });
  }
});

// @route   GET /api/maps/directions
// @desc    Get directions between two points
// @access  Public
router.get('/directions', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json`;
    const params = {
      origin: origin,
      destination: destination,
      mode: mode,
      key: apiKey
    };

    const response = await axios.get(url, { params });
    
    if (response.data.status === 'OK') {
      res.json({
        success: true,
        routes: response.data.routes,
        geocoded_waypoints: response.data.geocoded_waypoints
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Directions API error: ${response.data.status}`,
        error: response.data.error_message
      });
    }
  } catch (error) {
    console.error('Directions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching directions'
    });
  }
});

// @route   GET /api/maps/geocode
// @desc    Geocode an address to coordinates
// @access  Public
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = {
      address: address,
      key: apiKey
    };

    const response = await axios.get(url, { params });
    
    if (response.data.status === 'OK') {
      res.json({
        success: true,
        results: response.data.results
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Geocoding API error: ${response.data.status}`,
        error: response.data.error_message
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Error geocoding address'
    });
  }
});

// @route   GET /api/maps/reverse-geocode
// @desc    Reverse geocode coordinates to address
// @access  Public
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = {
      latlng: `${lat},${lng}`,
      key: apiKey
    };

    const response = await axios.get(url, { params });
    
    if (response.data.status === 'OK') {
      res.json({
        success: true,
        results: response.data.results
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Geocoding API error: ${response.data.status}`,
        error: response.data.error_message
      });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reverse geocoding coordinates'
    });
  }
});

// @route   POST /api/maps/save-location
// @desc    Save user's current location (authenticated users only)
// @access  Private
router.post('/save-location', protect, async (req, res) => {
  try {
    const { name, lat, lng } = req.body;

    if (!name || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Name, latitude, and longitude are required'
      });
    }

    // Add location to user's saved destinations
    const user = await User.findById(req.user.id);
    user.savedDestinations.push({
      name,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
    await user.save();

    res.json({
      success: true,
      message: 'Location saved successfully',
      savedDestinations: user.savedDestinations
    });
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving location'
    });
  }
});

// @route   GET /api/maps/saved-locations
// @desc    Get user's saved locations
// @access  Private
router.get('/saved-locations', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      savedDestinations: user.savedDestinations
    });
  } catch (error) {
    console.error('Get saved locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved locations'
    });
  }
});

// @route   DELETE /api/maps/saved-locations/:id
// @desc    Remove a saved location
// @access  Private
router.delete('/saved-locations/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedDestinations = user.savedDestinations.filter(
      dest => dest._id.toString() !== req.params.id
    );
    await user.save();

    res.json({
      success: true,
      message: 'Location removed successfully',
      savedDestinations: user.savedDestinations
    });
  } catch (error) {
    console.error('Remove saved location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing saved location'
    });
  }
});

module.exports = router;
