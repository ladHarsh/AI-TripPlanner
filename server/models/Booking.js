const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['hotel', 'flight', 'train', 'bus', 'taxi', 'package'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  // Hotel booking specific fields
  hotel: {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel'
    },
    roomType: String,
    checkIn: Date,
    checkOut: Date,
    guests: {
      adults: {
        type: Number,
        default: 1
      },
      children: {
        type: Number,
        default: 0
      }
    },
    roomCount: {
      type: Number,
      default: 1
    }
  },
  
  // Transport booking specific fields
  transport: {
    type: String, // 'flight', 'train', 'bus', 'taxi'
    provider: String,
    from: {
      city: String,
      location: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    to: {
      city: String,
      location: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    departure: Date,
    arrival: Date,
    seatNumbers: [String],
    passengers: [{
      name: String,
      age: Number,
      seatNumber: String
    }],
    vehicleDetails: {
      model: String,
      number: String,
      capacity: Number
    }
  },
  
  // Taxi/Uber specific fields
  taxi: {
    pickupLocation: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    dropoffLocation: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    vehicleType: String,
    estimatedDuration: Number,
    estimatedDistance: Number
  },
  
  // Common booking fields
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash'],
    default: 'credit_card'
  },
  bookingReference: {
    type: String,
    unique: true
  },
  specialRequests: String,
  cancellationPolicy: String,
  refundAmount: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingReference = `BK${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Index for efficient queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingReference: 1 });

// Virtual for booking duration (for hotel bookings)
bookingSchema.virtual('duration').get(function() {
  if (this.hotel && this.hotel.checkIn && this.hotel.checkOut) {
    const diffTime = Math.abs(this.hotel.checkOut - this.hotel.checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Method to calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  // This is a simplified refund calculation
  // In a real app, you'd have more complex business logic
  const now = new Date();
  let refundPercentage = 0;
  
  if (this.type === 'hotel' && this.hotel.checkIn) {
    const daysUntilCheckIn = Math.ceil((this.hotel.checkIn - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilCheckIn > 7) {
      refundPercentage = 0.9; // 90% refund
    } else if (daysUntilCheckIn > 3) {
      refundPercentage = 0.5; // 50% refund
    } else if (daysUntilCheckIn > 1) {
      refundPercentage = 0.25; // 25% refund
    }
  } else if (this.type === 'flight' || this.type === 'train' || this.type === 'bus') {
    const hoursUntilDeparture = Math.ceil((this.transport.departure - now) / (1000 * 60 * 60));
    
    if (hoursUntilDeparture > 24) {
      refundPercentage = 0.8; // 80% refund
    } else if (hoursUntilDeparture > 6) {
      refundPercentage = 0.5; // 50% refund
    }
  }
  
  return this.totalAmount * refundPercentage;
};

// Method to cancel booking
bookingSchema.methods.cancelBooking = function() {
  this.status = 'cancelled';
  this.refundAmount = this.calculateRefund();
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema);
