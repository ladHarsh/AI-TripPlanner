const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');
const Trip = require('../models/Trip');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/ai/generate-itinerary
// @desc    Generate AI-powered trip itinerary
// @access  Private
router.post('/generate-itinerary', protect, async (req, res) => {
  try {
    const {
      destination,
      duration,
      budget,
      travelStyle,
      interests,
      groupSize,
      accommodation,
      transport,
      startDate,
      endDate
    } = req.body;

    // Validate required fields
    if (!destination || !duration || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Destination, duration, and budget are required'
      });
    }

    // Create prompt for OpenAI
    const prompt = `Create a detailed ${duration}-day travel itinerary for ${destination} with the following preferences:
    
    Travel Style: ${travelStyle || 'balanced'}
    Budget Range: $${budget.min || 0} - $${budget.max || 5000} ${budget.currency || 'USD'}
    Group Size: ${groupSize || 1} people
    Accommodation Preference: ${accommodation || 'hotel'}
    Transport Preferences: ${transport?.join(', ') || 'flexible'}
    Interests: ${interests?.join(', ') || 'general sightseeing'}
    
    Please provide a detailed day-by-day itinerary including:
    1. Daily activities with timing
    2. Recommended attractions, restaurants, and activities
    3. Estimated costs for each activity
    4. Transportation options between locations
    5. Accommodation suggestions
    6. Local tips and recommendations
    7. Weather considerations
    8. Safety tips
    
    Format the response as a structured JSON object with the following structure:
    {
      "summary": "Brief trip overview",
      "totalEstimatedCost": {"amount": number, "currency": "USD"},
      "days": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "activities": [
            {
              "time": "09:00",
              "activity": "Activity name",
              "location": {
                "name": "Location name",
                "address": "Full address",
                "coordinates": {"lat": number, "lng": number}
              },
              "duration": 2,
              "cost": {"amount": 25, "currency": "USD"},
              "description": "Detailed description",
              "type": "attraction|restaurant|transport|accommodation|activity",
              "bookingRequired": false
            }
          ],
          "totalCost": {"amount": 150, "currency": "USD"}
        }
      ],
      "recommendations": {
        "weather": {"forecast": "Weather info", "bestTime": "Best time to visit"},
        "localTips": ["Tip 1", "Tip 2"],
        "mustSee": ["Must see 1", "Must see 2"],
        "budgetTips": ["Budget tip 1", "Budget tip 2"],
        "safetyTips": ["Safety tip 1", "Safety tip 2"]
      }
    }`;

    // Call Gemini AI API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let itineraryData;
    try {
      // Extract JSON from the response (Gemini might include markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        itineraryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      return res.status(500).json({
        success: false,
        message: 'Error parsing AI-generated itinerary'
      });
    }

    // Create trip in database
    const trip = await Trip.create({
      user: req.user.id,
      title: `${destination} - ${duration} Day Trip`,
      description: itineraryData.summary,
      destination: {
        city: destination.split(',')[0].trim(),
        country: destination.split(',').pop().trim()
      },
      preferences: {
        budget: budget,
        duration: duration,
        travelStyle: travelStyle || 'balanced',
        groupSize: groupSize || 1,
        interests: interests || [],
        accommodation: accommodation || 'hotel',
        transport: transport || []
      },
      itinerary: {
        generatedBy: 'AI',
        generatedAt: new Date(),
        days: itineraryData.days,
        totalCost: itineraryData.totalEstimatedCost,
        summary: itineraryData.summary
      },
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      recommendations: itineraryData.recommendations
    });

    res.json({
      success: true,
      message: 'Itinerary generated successfully',
      trip
    });

  } catch (error) {
    console.error('AI itinerary generation error:', error);
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return res.status(500).json({
        success: false,
        message: 'AI service quota exceeded. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error generating itinerary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ai/optimize-itinerary
// @desc    Optimize existing itinerary based on feedback
// @access  Private
router.post('/optimize-itinerary', protect, async (req, res) => {
  try {
    const { tripId, feedback, changes } = req.body;

    if (!tripId || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID and feedback are required'
      });
    }

    // Get the existing trip
    const trip = await Trip.findOne({ _id: tripId, user: req.user.id });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Create optimization prompt
    const prompt = `Please optimize this travel itinerary based on the following feedback:
    
    Original Destination: ${trip.destination.city}, ${trip.destination.country}
    Original Duration: ${trip.preferences.duration} days
    Original Budget: $${trip.preferences.budget.min} - $${trip.preferences.budget.max}
    Travel Style: ${trip.preferences.travelStyle}
    
    User Feedback: ${feedback}
    Requested Changes: ${changes || 'None specified'}
    
    Current Itinerary Summary: ${trip.itinerary.summary}
    
    Please provide an optimized version of the itinerary that addresses the feedback while maintaining the core structure. Return the response in the same JSON format as the original itinerary.`;

    // Call Gemini AI API for optimization
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the optimized itinerary
    let optimizedData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        optimizedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing optimized Gemini response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Error parsing optimized itinerary'
      });
    }

    // Update the trip with optimized itinerary
    trip.itinerary.days = optimizedData.days;
    trip.itinerary.totalCost = optimizedData.totalEstimatedCost;
    trip.itinerary.summary = optimizedData.summary;
    trip.recommendations = optimizedData.recommendations;
    await trip.save();

    res.json({
      success: true,
      message: 'Itinerary optimized successfully',
      trip
    });

  } catch (error) {
    console.error('AI itinerary optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error optimizing itinerary'
    });
  }
});

// @route   POST /api/ai/travel-suggestions
// @desc    Get AI-powered travel suggestions for a destination
// @access  Public
router.post('/travel-suggestions', async (req, res) => {
  try {
    const { destination, interests, budget, duration } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }

    const prompt = `Provide travel suggestions for ${destination} with the following preferences:
    
    Interests: ${interests?.join(', ') || 'general sightseeing'}
    Budget: ${budget || 'moderate'}
    Duration: ${duration || 'flexible'}
    
    Please provide:
    1. Top 5 must-visit attractions
    2. Top 3 local restaurants
    3. Best time to visit
    4. Local customs and tips
    5. Budget-friendly alternatives
    6. Safety considerations
    
    Format as JSON with the following structure:
    {
      "attractions": [{"name": "Name", "description": "Description", "cost": "Cost info"}],
      "restaurants": [{"name": "Name", "cuisine": "Cuisine", "priceRange": "Price range"}],
      "bestTimeToVisit": "Description",
      "localTips": ["Tip 1", "Tip 2"],
      "budgetAlternatives": ["Alternative 1", "Alternative 2"],
      "safetyTips": ["Safety tip 1", "Safety tip 2"]
    }`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let suggestions;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini suggestions response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Error parsing travel suggestions'
      });
    }

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('AI travel suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating travel suggestions'
    });
  }
});

module.exports = router;
