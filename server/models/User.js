const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'default-avatar.jpg'
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s-]+$/, 'Please provide a valid phone number']
  },
  dateOfBirth: {
    type: Date
  },
  preferences: {
    travelStyle: {
      type: String,
      enum: ['budget', 'luxury', 'adventure', 'relaxation', 'cultural'],
      default: 'budget'
    },
    preferredTransport: [{
      type: String,
      enum: ['flight', 'train', 'bus', 'car']
    }],
    preferredAccommodation: {
      type: String,
      enum: ['hotel', 'hostel', 'apartment', 'resort'],
      default: 'hotel'
    },
    budgetRange: {
      min: Number,
      max: Number
    }
  },
  savedDestinations: [{
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
