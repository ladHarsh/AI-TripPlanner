const express = require("express");
const axios = require("axios");
const freeMapService = require("../services/freeMapService");
const { cacheMiddleware } = require("../middleware/cache");
const { logger } = require("../middleware/logging");

const router = express.Router();

// GET /api/maps-free/geocode
router.get("/geocode", cacheMiddleware(86400), async (req, res) => {
  try {
    const { address } = req.query;
    if (!address)
      return res
        .status(400)
        .json({ success: false, message: "Address is required" });
    const result = await freeMapService.geocode(address);
    return res.json({ success: true, result });
  } catch (err) {
    logger.error("/maps-free/geocode error", err);
    res
      .status(500)
      .json({ success: false, message: "Error geocoding address" });
  }
});

// GET /api/maps-free/reverse-geocode
router.get("/reverse-geocode", cacheMiddleware(86400), async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!lat || !lng || !freeMapService.validateCoordinates(latNum, lngNum)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid lat and lng are required" });
    }
    const result = await freeMapService.reverseGeocode(latNum, lngNum);
    return res.json({ success: true, result });
  } catch (err) {
    logger.error("/maps-free/reverse-geocode error", err);
    res
      .status(500)
      .json({ success: false, message: "Error reverse geocoding coordinates" });
  }
});

// GET /api/maps-free/places/nearby
router.get("/places/nearby", cacheMiddleware(3600), async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5000,
      type = "tourist_attraction",
      keyword,
    } = req.query;
    if (!lat || !lng) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Latitude and longitude are required",
        });
    }
    const location = `${lat},${lng}`;
    const data = await freeMapService.nearbySearch(
      location,
      parseInt(radius, 10),
      type,
      keyword
    );
    res.json({
      success: true,
      data: { places: data.results, status: data.status },
    });
  } catch (err) {
    logger.error("/maps-free/places/nearby error", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching nearby places" });
  }
});

// GET /api/maps-free/places/search
router.get("/places/search", cacheMiddleware(3600), async (req, res) => {
  try {
    const { query, location, radius = 50000, type } = req.query;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }
    const data = await freeMapService.searchPlaces(
      query,
      location,
      parseInt(radius, 10),
      type
    );
    res.json({
      success: true,
      data: { places: data.results, status: data.status },
    });
  } catch (err) {
    logger.error("/maps-free/places/search error", err);
    res.status(500).json({ success: false, message: "Error searching places" });
  }
});

// GET /api/maps-free/directions
router.get("/directions", cacheMiddleware(3600), async (req, res) => {
  try {
    const { origin, destination, mode = "driving" } = req.query;
    if (!origin || !destination) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Origin and destination are required",
        });
    }
    const data = await freeMapService.getDirections(
      origin,
      destination,
      mode.toLowerCase()
    );
    res.json({ success: true, data });
  } catch (err) {
    logger.error("/maps-free/directions error", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching directions" });
  }
});

module.exports = router;
