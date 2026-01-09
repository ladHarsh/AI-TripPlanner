const express = require("express");
const { protect: auth } = require("../middleware/auth");
const googleMapsService = require("../services/googleMapsService");
const User = require("../models/User");
const { logger } = require("../middleware/logging");
const { cacheMiddleware } = require("../middleware/cache");

const router = express.Router();

// @route   GET /api/maps/places/nearby
// @desc    Get nearby places (hotels, restaurants, attractions)
// @access  Public
router.get("/places/nearby", cacheMiddleware(3600), async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type = "lodging", keyword } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Validate coordinates
    if (
      !googleMapsService.validateCoordinates(parseFloat(lat), parseFloat(lng))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided",
      });
    }

    const location = `${lat},${lng}`;
    const nearbyPlaces = await googleMapsService.nearbySearch(
      location,
      parseInt(radius),
      type,
      keyword
    );

    // Add photo URLs
    const placesWithPhotos = nearbyPlaces.results.map((place) => ({
      ...place,
      photos: place.photos.map((photo) => ({
        ...photo,
        url: googleMapsService.getPhotoUrl(photo.photo_reference, 400),
      })),
    }));

    res.json({
      success: true,
      data: {
        places: placesWithPhotos,
        status: nearbyPlaces.status,
        nextPageToken: nearbyPlaces.next_page_token,
      },
    });
  } catch (error) {
    logger.error("Nearby places error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching nearby places",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/places/search
// @desc    Search for places by text query
// @access  Public
router.get("/places/search", cacheMiddleware(3600), async (req, res) => {
  try {
    const { query, location, radius = 50000, type } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchResults = await googleMapsService.searchPlaces(
      query,
      location,
      parseInt(radius),
      type
    );

    // Add photo URLs
    const placesWithPhotos = searchResults.results.map((place) => ({
      ...place,
      photos: place.photos.map((photo) => ({
        ...photo,
        url: googleMapsService.getPhotoUrl(photo.photo_reference, 400),
      })),
    }));

    res.json({
      success: true,
      data: {
        places: placesWithPhotos,
        status: searchResults.status,
        nextPageToken: searchResults.next_page_token,
      },
    });
  } catch (error) {
    logger.error("Places search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching places",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/places/details
// @desc    Get detailed information about a place
// @access  Public
router.get("/places/details", cacheMiddleware(43200), async (req, res) => {
  try {
    const { placeId, fields } = req.query;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "Place ID is required",
      });
    }

    const requestedFields = fields ? fields.split(",") : undefined;
    const placeDetails = await googleMapsService.getPlaceDetails(
      placeId,
      requestedFields
    );

    // Add photo URLs if photos exist
    if (placeDetails.photos) {
      placeDetails.photos = placeDetails.photos.map((photo) => ({
        ...photo,
        url: googleMapsService.getPhotoUrl(photo.photo_reference, 800),
      }));
    }

    res.json({
      success: true,
      data: {
        place: placeDetails,
      },
    });
  } catch (error) {
    logger.error("Place details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching place details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/directions
// @desc    Get directions between two points
// @access  Public
router.get("/directions", cacheMiddleware(3600), async (req, res) => {
  try {
    const {
      origin,
      destination,
      mode = "driving",
      waypoints,
      alternatives = false,
    } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination are required",
      });
    }

    const waypointArray = waypoints ? waypoints.split("|") : [];
    const directionsData = await googleMapsService.getDirections(
      origin,
      destination,
      mode,
      waypointArray,
      alternatives === "true"
    );

    res.json({
      success: true,
      data: directionsData,
    });
  } catch (error) {
    logger.error("Directions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching directions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/distance-matrix
// @desc    Get travel distance and time between multiple points
// @access  Public
router.get("/distance-matrix", cacheMiddleware(21600), async (req, res) => {
  try {
    const { origins, destinations, mode = "driving" } = req.query;

    if (!origins || !destinations) {
      return res.status(400).json({
        success: false,
        message: "Origins and destinations are required",
      });
    }

    const originArray = origins.split("|");
    const destinationArray = destinations.split("|");

    if (originArray.length > 25 || destinationArray.length > 25) {
      return res.status(400).json({
        success: false,
        message: "Maximum 25 origins and 25 destinations allowed",
      });
    }

    const distanceMatrix = await googleMapsService.getDistanceMatrix(
      originArray,
      destinationArray,
      mode
    );

    res.json({
      success: true,
      data: distanceMatrix,
    });
  } catch (error) {
    logger.error("Distance matrix error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching distance matrix",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/geocode
// @desc    Geocode an address to coordinates
// @access  Public
router.get("/geocode", cacheMiddleware(86400), async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    const geocodeResult = await googleMapsService.geocode(address);

    res.json({
      success: true,
      data: {
        result: geocodeResult,
      },
    });
  } catch (error) {
    logger.error("Geocoding error:", error);
    res.status(500).json({
      success: false,
      message: "Error geocoding address",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/reverse-geocode
// @desc    Reverse geocode coordinates to address
// @access  Public
router.get("/reverse-geocode", cacheMiddleware(86400), async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Validate coordinates
    if (
      !googleMapsService.validateCoordinates(parseFloat(lat), parseFloat(lng))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided",
      });
    }

    const reverseGeocodeResult = await googleMapsService.reverseGeocode(
      parseFloat(lat),
      parseFloat(lng)
    );

    res.json({
      success: true,
      data: {
        result: reverseGeocodeResult,
      },
    });
  } catch (error) {
    logger.error("Reverse geocoding error:", error);
    res.status(500).json({
      success: false,
      message: "Error reverse geocoding coordinates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/maps/save-location
// @desc    Save user's current location
// @access  Private
router.post("/save-location", auth, async (req, res) => {
  try {
    const { name, lat, lng, address } = req.body;

    if (!name || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Name, latitude, and longitude are required",
      });
    }

    // Validate coordinates
    if (
      !googleMapsService.validateCoordinates(parseFloat(lat), parseFloat(lng))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided",
      });
    }

    // Get address if not provided
    let locationAddress = address;
    if (!locationAddress) {
      try {
        const reverseGeocodeResult = await googleMapsService.reverseGeocode(
          parseFloat(lat),
          parseFloat(lng)
        );
        locationAddress = reverseGeocodeResult.formatted_address;
      } catch (error) {
        logger.warn("Failed to reverse geocode for saved location:", error);
        locationAddress = `${lat}, ${lng}`;
      }
    }

    // Add location to user's saved destinations
    const user = await User.findById(req.user.id);

    // Check if location already exists
    const existingLocation = user.savedDestinations.find(
      (dest) =>
        googleMapsService.calculateDistance(
          dest.coordinates.lat,
          dest.coordinates.lng,
          parseFloat(lat),
          parseFloat(lng)
        ) < 0.1 // Less than 100 meters
    );

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: "Location already saved",
      });
    }

    user.savedDestinations.push({
      name,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      address: locationAddress,
    });

    await user.save();

    res.json({
      success: true,
      message: "Location saved successfully",
      data: {
        savedDestinations: user.savedDestinations,
      },
    });
  } catch (error) {
    logger.error("Save location error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/saved-locations
// @desc    Get user's saved locations
// @access  Private
router.get("/saved-locations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        savedDestinations: user.savedDestinations,
      },
    });
  } catch (error) {
    logger.error("Get saved locations error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved locations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   DELETE /api/maps/saved-locations/:id
// @desc    Remove a saved location
// @access  Private
router.delete("/saved-locations/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const locationIndex = user.savedDestinations.findIndex(
      (dest) => dest._id.toString() === req.params.id
    );

    if (locationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Saved location not found",
      });
    }

    user.savedDestinations.splice(locationIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Location removed successfully",
      data: {
        savedDestinations: user.savedDestinations,
      },
    });
  } catch (error) {
    logger.error("Remove saved location error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing saved location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/maps/route-optimization
// @desc    Optimize route for multiple destinations
// @access  Public
router.get("/route-optimization", cacheMiddleware(3600), async (req, res) => {
  try {
    const { origin, destinations, mode = "driving" } = req.query;

    if (!origin || !destinations) {
      return res.status(400).json({
        success: false,
        message: "Origin and destinations are required",
      });
    }

    const destinationArray = destinations.split("|");

    if (destinationArray.length > 23) {
      // Google allows max 25 waypoints including origin and destination
      return res.status(400).json({
        success: false,
        message: "Maximum 23 destinations allowed for route optimization",
      });
    }

    // Get distance matrix for all destinations
    const allLocations = [origin, ...destinationArray];
    const distanceMatrix = await googleMapsService.getDistanceMatrix(
      allLocations,
      allLocations,
      mode
    );

    // Simple nearest neighbor algorithm for route optimization
    const optimizedRoute = optimizeRoute(distanceMatrix, allLocations);

    // Get directions for optimized route
    const waypoints = optimizedRoute.slice(1, -1); // Remove origin and destination
    const destination = optimizedRoute[optimizedRoute.length - 1];

    const directions = await googleMapsService.getDirections(
      origin,
      destination,
      mode,
      waypoints,
      false
    );

    res.json({
      success: true,
      data: {
        optimizedRoute,
        directions,
        distanceMatrix,
      },
    });
  } catch (error) {
    logger.error("Route optimization error:", error);
    res.status(500).json({
      success: false,
      message: "Error optimizing route",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Helper function for simple route optimization (nearest neighbor)
function optimizeRoute(distanceMatrix, locations) {
  const n = locations.length;
  if (n <= 2) return locations;

  const unvisited = new Set(Array.from({ length: n }, (_, i) => i));
  const route = [0]; // Start with origin
  unvisited.delete(0);

  let currentIndex = 0;

  while (unvisited.size > 0) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (const index of unvisited) {
      const element = distanceMatrix.rows[currentIndex]?.elements[index];
      if (element && element.status === "OK" && element.distance) {
        const distance = element.distance.value;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }
    }

    if (nearestIndex !== -1) {
      route.push(nearestIndex);
      unvisited.delete(nearestIndex);
      currentIndex = nearestIndex;
    } else {
      // If no valid route found, add remaining locations in order
      route.push(...Array.from(unvisited));
      break;
    }
  }

  return route.map((index) => locations[index]);
}

module.exports = router;

// @route   GET /api/maps/places/details
// @desc    Get detailed information about a place
// @access  Public
router.get("/places/details", async (req, res) => {
  try {
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "Place ID is required",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Google Maps API key not configured",
      });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const params = {
      place_id: placeId,
      fields:
        "name,formatted_address,geometry,formatted_phone_number,website,rating,reviews,photos,opening_hours,price_level,types",
      key: apiKey,
    };

    const response = await axios.get(url, { params });

    if (response.data.status === "OK") {
      res.json({
        success: true,
        place: response.data.result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Places API error: ${response.data.status}`,
        error: response.data.error_message,
      });
    }
  } catch (error) {
    console.error("Place details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching place details",
    });
  }
});

// @route   GET /api/maps/directions
// @desc    Get directions between two points
// @access  Public
router.get("/directions", async (req, res) => {
  try {
    const { origin, destination, mode = "driving" } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination are required",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Google Maps API key not configured",
      });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json`;
    const params = {
      origin: origin,
      destination: destination,
      mode: mode,
      key: apiKey,
    };

    const response = await axios.get(url, { params });

    if (response.data.status === "OK") {
      res.json({
        success: true,
        routes: response.data.routes,
        geocoded_waypoints: response.data.geocoded_waypoints,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Directions API error: ${response.data.status}`,
        error: response.data.error_message,
      });
    }
  } catch (error) {
    console.error("Directions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching directions",
    });
  }
});

// @route   GET /api/maps/geocode
// @desc    Geocode an address to coordinates
// @access  Public
router.get("/geocode", async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Google Maps API key not configured",
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = {
      address: address,
      key: apiKey,
    };

    const response = await axios.get(url, { params });

    if (response.data.status === "OK") {
      res.json({
        success: true,
        results: response.data.results,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Geocoding API error: ${response.data.status}`,
        error: response.data.error_message,
      });
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      success: false,
      message: "Error geocoding address",
    });
  }
});

// @route   GET /api/maps/reverse-geocode
// @desc    Reverse geocode coordinates to address
// @access  Public
router.get("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Google Maps API key not configured",
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = {
      latlng: `${lat},${lng}`,
      key: apiKey,
    };

    const response = await axios.get(url, { params });

    if (response.data.status === "OK") {
      res.json({
        success: true,
        results: response.data.results,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Google Geocoding API error: ${response.data.status}`,
        error: response.data.error_message,
      });
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    res.status(500).json({
      success: false,
      message: "Error reverse geocoding coordinates",
    });
  }
});

// @route   POST /api/maps/save-location
// @desc    Save user's current location (authenticated users only)
// @access  Private
router.post("/save-location", auth, async (req, res) => {
  try {
    const { name, lat, lng } = req.body;

    if (!name || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Name, latitude, and longitude are required",
      });
    }

    // Add location to user's saved destinations
    const user = await User.findById(req.user.id);
    user.savedDestinations.push({
      name,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
    });
    await user.save();

    res.json({
      success: true,
      message: "Location saved successfully",
      savedDestinations: user.savedDestinations,
    });
  } catch (error) {
    console.error("Save location error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving location",
    });
  }
});

// @route   GET /api/maps/saved-locations
// @desc    Get user's saved locations
// @access  Private
router.get("/saved-locations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      savedDestinations: user.savedDestinations,
    });
  } catch (error) {
    console.error("Get saved locations error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved locations",
    });
  }
});

// @route   DELETE /api/maps/saved-locations/:id
// @desc    Remove a saved location
// @access  Private
router.delete("/saved-locations/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedDestinations = user.savedDestinations.filter(
      (dest) => dest._id.toString() !== req.params.id
    );
    await user.save();

    res.json({
      success: true,
      message: "Location removed successfully",
      savedDestinations: user.savedDestinations,
    });
  } catch (error) {
    console.error("Remove saved location error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing saved location",
    });
  }
});

module.exports = router;
