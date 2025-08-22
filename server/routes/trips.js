const express = require('express');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trips
// @desc    Get user's trips
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(filter);

    res.json({
      success: true,
      count: trips.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + trips.length < total,
        hasPrev: parseInt(page) > 1
      },
      trips
    });

  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trips'
    });
  }
});

// @route   GET /api/trips/:id
// @desc    Get single trip
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('bookings.booking');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      trip
    });

  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trip'
    });
  }
});

// @route   POST /api/trips
// @desc    Create new trip
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const tripData = {
      ...req.body,
      user: req.user.id
    };

    const trip = await Trip.create(tripData);

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip
    });

  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trip'
    });
  }
});

// @route   PUT /api/trips/:id
// @desc    Update trip
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip updated successfully',
      trip
    });

  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip'
    });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete trip
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });

  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting trip'
    });
  }
});

// @route   POST /api/trips/:id/bookings
// @desc    Add booking to trip
// @access  Private
router.post('/:id/bookings', protect, async (req, res) => {
  try {
    const { bookingId, day, activityIndex } = req.body;

    const trip = await Trip.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    await trip.addBooking(bookingId, day, activityIndex);

    res.json({
      success: true,
      message: 'Booking added to trip successfully',
      trip
    });

  } catch (error) {
    console.error('Add booking to trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding booking to trip'
    });
  }
});

// @route   PUT /api/trips/:id/status
// @desc    Update trip status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const trip = await Trip.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    await trip.updateStatus(status);

    res.json({
      success: true,
      message: 'Trip status updated successfully',
      trip
    });

  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip status'
    });
  }
});

// @route   GET /api/trips/upcoming
// @desc    Get upcoming trips
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const now = new Date();

    const trips = await Trip.find({
      user: req.user.id,
      startDate: { $gte: now },
      status: { $in: ['planning', 'booked'] }
    })
      .sort({ startDate: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: trips.length,
      trips
    });

  } catch (error) {
    console.error('Get upcoming trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming trips'
    });
  }
});

// @route   GET /api/trips/past
// @desc    Get past trips
// @access  Private
router.get('/past', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const now = new Date();

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const trips = await Trip.find({
      user: req.user.id,
      endDate: { $lt: now },
      status: { $in: ['completed', 'cancelled'] }
    })
      .sort({ endDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments({
      user: req.user.id,
      endDate: { $lt: now },
      status: { $in: ['completed', 'cancelled'] }
    });

    res.json({
      success: true,
      count: trips.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + trips.length < total,
        hasPrev: parseInt(page) > 1
      },
      trips
    });

  } catch (error) {
    console.error('Get past trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching past trips'
    });
  }
});

module.exports = router;
