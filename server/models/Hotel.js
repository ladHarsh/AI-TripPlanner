const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Hotel description is required']
  },
  address: {
    street: String,
    city: {
      type: String,
      required: true
    },
    state: String,
    country: {
      type: String,
      required: true
    },
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  amenities: [{
    name: String,
    icon: String,
    description: String
  }],
  roomTypes: [{
    name: String,
    description: String,
    capacity: Number,
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    availableRooms: {
      type: Number,
      default: 0
    },
    images: [String]
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  policies: {
    checkIn: String,
    checkOut: String,
    cancellation: String,
    pets: {
      type: Boolean,
      default: false
    },
    smoking: {
      type: Boolean,
      default: false
    }
  },
  category: {
    type: String,
    enum: ['budget', 'mid-range', 'luxury', 'boutique', 'resort'],
    default: 'mid-range'
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search functionality
hotelSchema.index({ 
  name: 'text', 
  description: 'text', 
  'address.city': 'text',
  'address.country': 'text' 
});

// Index for location-based queries
hotelSchema.index({ 'address.coordinates': '2dsphere' });

// Virtual for average rating calculation
hotelSchema.virtual('averageRating').get(function() {
  if (this.reviews.length === 0) return 0;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / this.reviews.length).toFixed(1);
});

// Method to update average rating
hotelSchema.methods.updateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
  } else {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = (total / this.reviews.length).toFixed(1);
    this.rating.count = this.reviews.length;
  }
  return this.save();
};

// Pre-save middleware to update rating
hotelSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    this.updateAverageRating();
  }
  next();
});

module.exports = mongoose.model('Hotel', hotelSchema);
