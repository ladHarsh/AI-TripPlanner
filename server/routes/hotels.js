const express = require('express');
const Hotel = require('../models/Hotel');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/hotels
// @desc    Get all hotels with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      city,
      country,
      minPrice,
      maxPrice,
      rating,
      category,
      amenities,
      checkIn,
      checkOut,
      guests,
      page = 1,
      limit = 10,
      sort = 'rating'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }
    
    if (country) {
      filter['address.country'] = { $regex: country, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      filter['roomTypes.price'] = {};
      if (minPrice) filter['roomTypes.price'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['roomTypes.price'].$lte = parseFloat(maxPrice);
    }
    
    if (rating) {
      filter['rating.average'] = { $gte: parseFloat(rating) };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (amenities) {
      const amenityArray = amenities.split(',');
      filter['amenities.name'] = { $in: amenityArray };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price':
        sortObj = { 'roomTypes.price': 1 };
        break;
      case 'price-desc':
        sortObj = { 'roomTypes.price': -1 };
        break;
      case 'rating':
        sortObj = { 'rating.average': -1 };
        break;
      case 'name':
        sortObj = { name: 1 };
        break;
      default:
        sortObj = { 'rating.average': -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hotels = await Hotel.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviews.user', 'name avatar');

    const total = await Hotel.countDocuments(filter);

    res.json({
      success: true,
      count: hotels.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + hotels.length < total,
        hasPrev: parseInt(page) > 1
      },
      hotels
    });

  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotels'
    });
  }
});

// @route   GET /api/hotels/search
// @desc    Search hotels by text
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hotels = await Hotel.find(
      { 
        $text: { $search: q },
        isActive: true 
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviews.user', 'name avatar');

    const total = await Hotel.countDocuments({ 
      $text: { $search: q },
      isActive: true 
    });

    res.json({
      success: true,
      count: hotels.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + hotels.length < total,
        hasPrev: parseInt(page) > 1
      },
      hotels
    });

  } catch (error) {
    console.error('Search hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching hotels'
    });
  }
});

// @route   GET /api/hotels/nearby
// @desc    Get hotels near a location
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, page = 1, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hotels = await Hotel.find({
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      isActive: true
    })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviews.user', 'name avatar');

    const total = await Hotel.countDocuments({
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      isActive: true
    });

    res.json({
      success: true,
      count: hotels.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + hotels.length < total,
        hasPrev: parseInt(page) > 1
      },
      hotels
    });

  } catch (error) {
    console.error('Nearby hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby hotels'
    });
  }
});

// @route   GET /api/hotels/:id
// @desc    Get single hotel
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('reviews.user', 'name avatar');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.json({
      success: true,
      hotel
    });

  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotel'
    });
  }
});

// @route   POST /api/hotels/:id/reviews
// @desc    Add review to hotel
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Check if user already reviewed this hotel
    const existingReview = hotel.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this hotel'
      });
    }

    // Add review
    hotel.reviews.push({
      user: req.user.id,
      rating: parseInt(rating),
      comment: comment || ''
    });

    await hotel.save();

    // Populate user info for the new review
    await hotel.populate('reviews.user', 'name avatar');

    res.json({
      success: true,
      message: 'Review added successfully',
      hotel
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review'
    });
  }
});

// @route   PUT /api/hotels/:id/reviews/:reviewId
// @desc    Update review
// @access  Private
router.put('/:id/reviews/:reviewId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    const review = hotel.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update review
    if (rating) review.rating = parseInt(rating);
    if (comment !== undefined) review.comment = comment;
    review.date = new Date();

    await hotel.save();
    await hotel.populate('reviews.user', 'name avatar');

    res.json({
      success: true,
      message: 'Review updated successfully',
      hotel
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

// @route   DELETE /api/hotels/:id/reviews/:reviewId
// @desc    Delete review
// @access  Private
router.delete('/:id/reviews/:reviewId', protect, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    const review = hotel.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    // Remove review
    review.remove();
    await hotel.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
});

// @route   POST /api/hotels
// @desc    Create new hotel (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      hotel
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating hotel'
    });
  }
});

// @route   PUT /api/hotels/:id
// @desc    Update hotel (Admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      hotel
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hotel'
    });
  }
});

// @route   DELETE /api/hotels/:id
// @desc    Delete hotel (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.json({
      success: true,
      message: 'Hotel deleted successfully'
    });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting hotel'
    });
  }
});

module.exports = router;
