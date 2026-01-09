const axios = require("axios");
const { logger } = require("../middleware/logging");
const { cache } = require("../middleware/cache");

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseURL = "https://maps.googleapis.com/maps/api";

    // Silent in development when not configured
    if (!this.apiKey && process.env.NODE_ENV === "production") {
      logger.warn("Google Maps API key not configured");
    }
  }

  // Geocoding - Convert address to coordinates
  async geocode(address) {
    try {
      if (!this.apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      // Check cache first
      const cacheKey = `geocode:${address}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info("Geocoding cache hit:", { address });
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/geocode/json`, {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status !== "OK") {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      const geocodeData = {
        formatted_address: result.formatted_address,
        location: result.geometry.location,
        place_id: result.place_id,
        types: result.types,
        address_components: result.address_components,
      };

      // Cache for 24 hours
      await cache.set(cacheKey, geocodeData, 86400);

      logger.info("Geocoding successful:", {
        address,
        result: geocodeData.formatted_address,
      });

      return geocodeData;
    } catch (error) {
      logger.error("Geocoding error:", error);
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  // Reverse Geocoding - Convert coordinates to address
  async reverseGeocode(lat, lng) {
    try {
      if (!this.apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      // Check cache first
      const cacheKey = `reverse_geocode:${lat},${lng}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info("Reverse geocoding cache hit:", { lat, lng });
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
        },
      });

      if (response.data.status !== "OK") {
        throw new Error(`Reverse geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      const reverseGeocodeData = {
        formatted_address: result.formatted_address,
        location: result.geometry.location,
        place_id: result.place_id,
        types: result.types,
        address_components: result.address_components,
      };

      // Cache for 24 hours
      await cache.set(cacheKey, reverseGeocodeData, 86400);

      logger.info("Reverse geocoding successful:", {
        lat,
        lng,
        result: reverseGeocodeData.formatted_address,
      });

      return reverseGeocodeData;
    } catch (error) {
      logger.error("Reverse geocoding error:", error);
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  // Places Search - Find places by query
  async searchPlaces(query, location = null, radius = 50000, type = null) {
    try {
      if (!this.apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      // Check cache first
      const cacheKey = `places_search:${query}:${location}:${radius}:${type}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info("Places search cache hit:", { query });
        return cached;
      }

      const params = {
        query,
        key: this.apiKey,
      };

      if (location) {
        params.location = location;
        params.radius = radius;
      }

      if (type) {
        params.type = type;
      }

      const response = await axios.get(
        `${this.baseURL}/place/textsearch/json`,
        {
          params,
        }
      );

      if (
        response.data.status !== "OK" &&
        response.data.status !== "ZERO_RESULTS"
      ) {
        throw new Error(`Places search failed: ${response.data.status}`);
      }

      const searchResults = {
        results: response.data.results.map((place) => ({
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating || null,
          price_level: place.price_level || null,
          types: place.types,
          opening_hours: place.opening_hours || null,
          photos: place.photos ? place.photos.slice(0, 5) : [],
        })),
        status: response.data.status,
        next_page_token: response.data.next_page_token || null,
      };

      // Cache for 6 hours
      await cache.set(cacheKey, searchResults, 21600);

      logger.info("Places search successful:", {
        query,
        resultCount: searchResults.results.length,
      });

      return searchResults;
    } catch (error) {
      logger.error("Places search error:", error);
      throw new Error(`Places search failed: ${error.message}`);
    }
  }

  // Get place details
  async getPlaceDetails(
    placeId,
    fields = [
      "name",
      "formatted_address",
      "geometry",
      "rating",
      "reviews",
      "photos",
      "opening_hours",
      "international_phone_number",
      "website",
    ]
  ) {
    try {
      if (!this.apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      // Check cache first
      const cacheKey = `place_details:${placeId}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info("Place details cache hit:", { placeId });
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/place/details/json`, {
        params: {
          place_id: placeId,
          fields: fields.join(","),
          key: this.apiKey,
        },
      });

      if (response.data.status !== "OK") {
        throw new Error(`Place details failed: ${response.data.status}`);
      }

      const placeDetails = response.data.result;

      // Cache for 12 hours
      await cache.set(cacheKey, placeDetails, 43200);

      logger.info("Place details successful:", {
        placeId,
        name: placeDetails.name,
      });

      return placeDetails;
    } catch (error) {
      logger.error("Place details error:", error);
      throw new Error(`Place details failed: ${error.message}`);
    }
  }

  // Nearby Search - Find places near a location
  async nearbySearch(location, radius = 5000, type = null, keyword = null) {
    try {
      if (!this.apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      // Check cache first
      const cacheKey = `nearby_search:${location}:${radius}:${type}:${keyword}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info("Nearby search cache hit:", { location, type });
        return cached;
      }

      const params = {
        location,
        radius,
        key: this.apiKey,
      };

      if (type) {
        params.type = type;
      }

      if (keyword) {
        params.keyword = keyword;
      }

      const response = await axios.get(
        `${this.baseURL}/place/nearbysearch/json`,
        {
          params,
        }
      );

      if (
        response.data.status !== "OK" &&
        response.data.status !== "ZERO_RESULTS"
      ) {
        throw new Error(`Nearby search failed: ${response.data.status}`);
      }

      const nearbyResults = {
        results: response.data.results.map((place) => ({
          place_id: place.place_id,
          name: place.name,
          vicinity: place.vicinity,
          location: place.geometry.location,
          rating: place.rating || null,
          price_level: place.price_level || null,
          types: place.types,
          opening_hours: place.opening_hours || null,
          photos: place.photos ? place.photos.slice(0, 3) : [],
        })),
        status: response.data.status,
        next_page_token: response.data.next_page_token || null,
      };

      // Cache for 3 hours
      await cache.set(cacheKey, nearbyResults, 10800);

      logger.info("Nearby search successful:", {
        location,
        type,
        resultCount: nearbyResults.results.length,
      });

      return nearbyResults;
    } catch (error) {
      logger.error("Nearby search error:", error);
      throw new Error(`Nearby search failed: ${error.message}`);
    }
  }

  // Directions - Get route between locations
  async getDirections(
    origin,
    destination,
    mode = "driving",
    waypoints = [],
    alternatives = false
  ) {
    try {
      if (!this.apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      // Check cache first
      const cacheKey = `directions:${origin}:${destination}:${mode}:${waypoints.join(
        ","
      )}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info("Directions cache hit:", { origin, destination });
        return cached;
      }

      const params = {
        origin,
        destination,
        mode,
        alternatives,
        key: this.apiKey,
      };

      if (waypoints.length > 0) {
        params.waypoints = waypoints.join("|");
      }

      const response = await axios.get(`${this.baseURL}/directions/json`, {
        params,
      });

      if (response.data.status !== "OK") {
        throw new Error(`Directions failed: ${response.data.status}`);
      }

      const directionsData = {
        routes: response.data.routes.map((route) => ({
          summary: route.summary,
          legs: route.legs.map((leg) => ({
            distance: leg.distance,
            duration: leg.duration,
            start_address: leg.start_address,
            end_address: leg.end_address,
            start_location: leg.start_location,
            end_location: leg.end_location,
            steps: leg.steps.map((step) => ({
              distance: step.distance,
              duration: step.duration,
              instructions: step.html_instructions.replace(/<[^>]*>/g, ""),
              start_location: step.start_location,
              end_location: step.end_location,
              travel_mode: step.travel_mode,
            })),
          })),
          overview_polyline: route.overview_polyline,
          bounds: route.bounds,
        })),
        status: response.data.status,
      };

      // Cache for 1 hour
      await cache.set(cacheKey, directionsData, 3600);

      logger.info("Directions successful:", {
        origin,
        destination,
        routeCount: directionsData.routes.length,
      });

      return directionsData;
    } catch (error) {
      logger.error("Directions error:", error);
      throw new Error(`Directions failed: ${error.message}`);
    }
  }

  // Distance Matrix - Get travel distance and time
  async getDistanceMatrix(origins, destinations, mode = "driving") {
    try {
      if (!this.apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      // Check cache first
      const cacheKey = `distance_matrix:${origins.join(
        ","
      )}:${destinations.join(",")}:${mode}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info("Distance matrix cache hit:", { origins, destinations });
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/distancematrix/json`, {
        params: {
          origins: origins.join("|"),
          destinations: destinations.join("|"),
          mode,
          key: this.apiKey,
        },
      });

      if (response.data.status !== "OK") {
        throw new Error(`Distance matrix failed: ${response.data.status}`);
      }

      const distanceMatrixData = {
        origin_addresses: response.data.origin_addresses,
        destination_addresses: response.data.destination_addresses,
        rows: response.data.rows.map((row) => ({
          elements: row.elements.map((element) => ({
            distance: element.distance || null,
            duration: element.duration || null,
            status: element.status,
          })),
        })),
        status: response.data.status,
      };

      // Cache for 6 hours
      await cache.set(cacheKey, distanceMatrixData, 21600);

      logger.info("Distance matrix successful:", {
        originCount: origins.length,
        destinationCount: destinations.length,
      });

      return distanceMatrixData;
    } catch (error) {
      logger.error("Distance matrix error:", error);
      throw new Error(`Distance matrix failed: ${error.message}`);
    }
  }

  // Get photo URL
  getPhotoUrl(photoReference, maxWidth = 400) {
    if (!this.apiKey || !photoReference) {
      return null;
    }

    return `${this.baseURL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  // Validate coordinates
  validateCoordinates(lat, lng) {
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new GoogleMapsService();
