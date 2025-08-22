const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock data for transport options (in real app, this would come from external APIs)
const mockFlights = [
  {
    id: 'FL001',
    type: 'flight',
    provider: 'Airline A',
    from: { city: 'New York', location: 'JFK Airport', coordinates: { lat: 40.6413, lng: -73.7781 } },
    to: { city: 'London', location: 'Heathrow Airport', coordinates: { lat: 51.4700, lng: -0.4543 } },
    departure: '2024-01-15T10:00:00Z',
    arrival: '2024-01-15T22:00:00Z',
    price: 800,
    availableSeats: 45,
    aircraft: 'Boeing 777'
  },
  {
    id: 'FL002',
    type: 'flight',
    provider: 'Airline B',
    from: { city: 'Los Angeles', location: 'LAX Airport', coordinates: { lat: 33.9416, lng: -118.4085 } },
    to: { city: 'Tokyo', location: 'Narita Airport', coordinates: { lat: 35.6762, lng: 139.6503 } },
    departure: '2024-01-16T14:30:00Z',
    arrival: '2024-01-17T18:30:00Z',
    price: 1200,
    availableSeats: 23,
    aircraft: 'Airbus A350'
  }
];

const mockTrains = [
  {
    id: 'TR001',
    type: 'train',
    provider: 'Railway Co',
    from: { city: 'Paris', location: 'Gare du Nord', coordinates: { lat: 48.8805, lng: 2.3552 } },
    to: { city: 'London', location: 'St Pancras', coordinates: { lat: 51.5320, lng: -0.1233 } },
    departure: '2024-01-15T08:00:00Z',
    arrival: '2024-01-15T11:30:00Z',
    price: 120,
    availableSeats: 156,
    trainNumber: 'Eurostar 9010'
  }
];

const mockBuses = [
  {
    id: 'BU001',
    type: 'bus',
    provider: 'Bus Company',
    from: { city: 'San Francisco', location: 'Greyhound Station', coordinates: { lat: 37.7749, lng: -122.4194 } },
    to: { city: 'Los Angeles', location: 'Union Station', coordinates: { lat: 34.0522, lng: -118.2437 } },
    departure: '2024-01-15T09:00:00Z',
    arrival: '2024-01-15T18:00:00Z',
    price: 45,
    availableSeats: 28,
    busNumber: 'Greyhound 1234'
  }
];

// @route   GET /api/transport/flights
// @desc    Search flights
// @access  Public
router.get('/flights', async (req, res) => {
  try {
    const { from, to, date, passengers = 1 } = req.query;

    // In a real app, this would call external flight API
    // For now, return mock data
    let flights = mockFlights;

    if (from) {
      flights = flights.filter(f => 
        f.from.city.toLowerCase().includes(from.toLowerCase())
      );
    }

    if (to) {
      flights = flights.filter(f => 
        f.to.city.toLowerCase().includes(to.toLowerCase())
      );
    }

    if (date) {
      const searchDate = new Date(date);
      flights = flights.filter(f => {
        const flightDate = new Date(f.departure);
        return flightDate.toDateString() === searchDate.toDateString();
      });
    }

    res.json({
      success: true,
      flights,
      count: flights.length
    });

  } catch (error) {
    console.error('Search flights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching flights'
    });
  }
});

// @route   GET /api/transport/trains
// @desc    Search trains
// @access  Public
router.get('/trains', async (req, res) => {
  try {
    const { from, to, date, passengers = 1 } = req.query;

    let trains = mockTrains;

    if (from) {
      trains = trains.filter(t => 
        t.from.city.toLowerCase().includes(from.toLowerCase())
      );
    }

    if (to) {
      trains = trains.filter(t => 
        t.to.city.toLowerCase().includes(to.toLowerCase())
      );
    }

    if (date) {
      const searchDate = new Date(date);
      trains = trains.filter(t => {
        const trainDate = new Date(t.departure);
        return trainDate.toDateString() === searchDate.toDateString();
      });
    }

    res.json({
      success: true,
      trains,
      count: trains.length
    });

  } catch (error) {
    console.error('Search trains error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching trains'
    });
  }
});

// @route   GET /api/transport/buses
// @desc    Search buses
// @access  Public
router.get('/buses', async (req, res) => {
  try {
    const { from, to, date, passengers = 1 } = req.query;

    let buses = mockBuses;

    if (from) {
      buses = buses.filter(b => 
        b.from.city.toLowerCase().includes(from.toLowerCase())
      );
    }

    if (to) {
      buses = buses.filter(b => 
        b.to.city.toLowerCase().includes(to.toLowerCase())
      );
    }

    if (date) {
      const searchDate = new Date(date);
      buses = buses.filter(b => {
        const busDate = new Date(b.departure);
        return busDate.toDateString() === searchDate.toDateString();
      });
    }

    res.json({
      success: true,
      buses,
      count: buses.length
    });

  } catch (error) {
    console.error('Search buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching buses'
    });
  }
});

// @route   POST /api/transport/taxi/estimate
// @desc    Get taxi fare estimate
// @access  Public
router.post('/taxi/estimate', async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, vehicleType = 'standard' } = req.body;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff locations are required'
      });
    }

    // Mock fare calculation (in real app, this would call Uber/Lyft API)
    const baseFare = 2.50;
    const perMileRate = 1.50;
    const perMinuteRate = 0.35;
    
    // Mock distance and duration calculation
    const distance = Math.random() * 20 + 5; // 5-25 miles
    const duration = Math.random() * 30 + 15; // 15-45 minutes
    
    const fare = baseFare + (distance * perMileRate) + (duration * perMinuteRate);
    
    // Apply vehicle type multiplier
    const multipliers = {
      standard: 1.0,
      premium: 1.5,
      xl: 1.3,
      pool: 0.7
    };

    const finalFare = fare * (multipliers[vehicleType] || 1.0);

    res.json({
      success: true,
      estimate: {
        fare: Math.round(finalFare * 100) / 100,
        currency: 'USD',
        distance: Math.round(distance * 10) / 10,
        duration: Math.round(duration),
        vehicleType,
        pickupLocation,
        dropoffLocation
      }
    });

  } catch (error) {
    console.error('Taxi estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating taxi fare'
    });
  }
});

// @route   POST /api/transport/taxi/request
// @desc    Request taxi ride
// @access  Private
router.post('/taxi/request', protect, async (req, res) => {
  try {
    const { 
      pickupLocation, 
      dropoffLocation, 
      vehicleType = 'standard',
      estimatedFare,
      specialRequests 
    } = req.body;

    if (!pickupLocation || !dropoffLocation || !estimatedFare) {
      return res.status(400).json({
        success: false,
        message: 'Pickup location, dropoff location, and estimated fare are required'
      });
    }

    // Mock taxi request (in real app, this would call Uber/Lyft API)
    const requestId = `TAXI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate driver assignment
    const drivers = [
      { id: 'DR001', name: 'John Smith', rating: 4.8, vehicle: 'Toyota Camry' },
      { id: 'DR002', name: 'Maria Garcia', rating: 4.9, vehicle: 'Honda Civic' },
      { id: 'DR003', name: 'David Johnson', rating: 4.7, vehicle: 'Ford Fusion' }
    ];
    
    const assignedDriver = drivers[Math.floor(Math.random() * drivers.length)];
    const eta = Math.floor(Math.random() * 10) + 3; // 3-12 minutes

    res.json({
      success: true,
      message: 'Taxi requested successfully',
      request: {
        id: requestId,
        status: 'confirmed',
        driver: assignedDriver,
        eta: eta,
        pickupLocation,
        dropoffLocation,
        vehicleType,
        estimatedFare,
        specialRequests
      }
    });

  } catch (error) {
    console.error('Taxi request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting taxi'
    });
  }
});

// @route   GET /api/transport/taxi/status/:requestId
// @desc    Get taxi request status
// @access  Private
router.get('/taxi/status/:requestId', protect, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Mock status check (in real app, this would call Uber/Lyft API)
    const statuses = ['confirmed', 'driver_en_route', 'arrived', 'in_progress', 'completed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    res.json({
      success: true,
      status: randomStatus,
      requestId,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Taxi status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking taxi status'
    });
  }
});

// @route   POST /api/transport/book
// @desc    Book transport (flight, train, bus)
// @access  Private
router.post('/book', protect, async (req, res) => {
  try {
    const { 
      transportId, 
      transportType, 
      passengers, 
      seatNumbers,
      specialRequests 
    } = req.body;

    if (!transportId || !transportType || !passengers) {
      return res.status(400).json({
        success: false,
        message: 'Transport ID, type, and passengers are required'
      });
    }

    // Find transport option
    let transport;
    switch (transportType) {
      case 'flight':
        transport = mockFlights.find(f => f.id === transportId);
        break;
      case 'train':
        transport = mockTrains.find(t => t.id === transportId);
        break;
      case 'bus':
        transport = mockBuses.find(b => b.id === transportId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid transport type'
        });
    }

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport option not found'
      });
    }

    if (transport.availableSeats < passengers.length) {
      return res.status(400).json({
        success: false,
        message: 'Not enough seats available'
      });
    }

    // Calculate total price
    const totalPrice = transport.price * passengers.length;

    // Create booking
    const booking = {
      type: transportType,
      transport: {
        type: transportType,
        provider: transport.provider,
        from: transport.from,
        to: transport.to,
        departure: transport.departure,
        arrival: transport.arrival,
        seatNumbers: seatNumbers || [],
        passengers: passengers,
        vehicleDetails: {
          model: transport.aircraft || transport.trainNumber || transport.busNumber,
          capacity: transport.availableSeats
        }
      },
      totalAmount: totalPrice,
      currency: 'USD',
      specialRequests: specialRequests || '',
      status: 'confirmed',
      paymentStatus: 'paid'
    };

    res.json({
      success: true,
      message: 'Transport booked successfully',
      booking
    });

  } catch (error) {
    console.error('Book transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking transport'
    });
  }
});

module.exports = router;
