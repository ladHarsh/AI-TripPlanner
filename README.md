# AI Trip Planner - Full Stack MERN Application

A comprehensive AI-powered travel planning application built with the MERN stack (MongoDB, Express.js, React, Node.js). This application provides intelligent trip planning, hotel booking, transport booking, and real-time location tracking.

## 🚀 Features

### Core Features
- **AI-Powered Trip Planning**: Generate personalized itineraries using OpenAI API
- **Live Location Tracking**: Real-time location services with Google Maps integration
- **Hotel Booking System**: Search, filter, and book hotels with reviews and ratings
- **Transport Booking**: Book flights, trains, buses, and taxis
- **Uber/Taxi Integration**: Request rides directly from the app
- **User Authentication**: Secure JWT-based authentication system
- **User Dashboard**: Manage bookings, trips, and preferences

### Technical Features
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Updates**: Live booking status and notifications
- **Search & Filtering**: Advanced search with multiple filters
- **Payment Integration**: Secure payment processing
- **Admin Panel**: Manage users, hotels, and bookings
- **API Integration**: Google Maps, OpenAI, and external booking APIs

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **OpenAI API** - AI trip planning
- **Google Maps API** - Location services

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **React Icons** - Icon library

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-trip-planner
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the `server` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/ai-trip-planner
   MONGODB_URI_PROD=your_mongodb_atlas_uri_here

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d

   # OpenAI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here

   # Google Maps API
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

   # Uber API (Optional)
   UBER_CLIENT_ID=your_uber_client_id_here
   UBER_CLIENT_SECRET=your_uber_client_secret_here

   # External APIs (Flight/Train/Bus booking)
   FLIGHT_API_KEY=your_flight_api_key_here
   TRAIN_API_KEY=your_train_api_key_here
   BUS_API_KEY=your_bus_api_key_here
   ```

4. **API Keys Setup**

   You'll need to obtain the following API keys:
   - **OpenAI API Key**: [Get it here](https://platform.openai.com/api-keys)
   - **Google Maps API Key**: [Get it here](https://developers.google.com/maps/documentation/javascript/get-api-key)
   - **MongoDB Atlas** (optional): [Get it here](https://www.mongodb.com/atlas)

## 🚀 Running the Application

### Development Mode

1. **Start the server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the client** (in a new terminal)
   ```bash
   cd client
   npm start
   ```

3. **Or run both simultaneously** (from root directory)
   ```bash
   npm run dev
   ```

### Production Mode

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Start the server**
   ```bash
   cd server
   npm start
   ```

## 📁 Project Structure

```
ai-trip-planner/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # File uploads
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - User logout

### Hotels
- `GET /api/hotels` - Get all hotels
- `GET /api/hotels/:id` - Get hotel details
- `POST /api/hotels/:id/reviews` - Add review
- `GET /api/hotels/search` - Search hotels
- `GET /api/hotels/nearby` - Get nearby hotels

### Transport
- `GET /api/transport/flights` - Search flights
- `GET /api/transport/trains` - Search trains
- `GET /api/transport/buses` - Search buses
- `POST /api/transport/taxi/estimate` - Get taxi estimate
- `POST /api/transport/taxi/request` - Request taxi

### Maps
- `GET /api/maps/places/nearby` - Get nearby places
- `GET /api/maps/directions` - Get directions
- `GET /api/maps/geocode` - Geocode address
- `POST /api/maps/save-location` - Save location

### AI Trip Planning
- `POST /api/ai/generate-itinerary` - Generate AI itinerary
- `POST /api/ai/optimize-itinerary` - Optimize itinerary
- `POST /api/ai/travel-suggestions` - Get travel suggestions

### Trips & Bookings
- `GET /api/trips` - Get user trips
- `POST /api/trips` - Create trip
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking

## 🎨 UI Components

The application includes a comprehensive set of reusable UI components:

- **Buttons**: Primary, secondary, outline variants
- **Forms**: Input fields, validation, error handling
- **Cards**: Hotel cards, trip cards, booking cards
- **Modals**: Booking modals, confirmation dialogs
- **Maps**: Google Maps integration with markers
- **Loading States**: Spinners, skeletons
- **Notifications**: Toast notifications

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: API rate limiting for security
- **CORS Configuration**: Proper CORS setup
- **Helmet**: Security headers
- **Environment Variables**: Secure configuration management

## 🚀 Deployment

### Backend Deployment (Render/Heroku)

1. **Prepare for deployment**
   ```bash
   cd server
   npm run build
   ```

2. **Set environment variables** in your hosting platform:
   - `MONGODB_URI_PROD`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `NODE_ENV=production`

3. **Deploy to your preferred platform**

### Frontend Deployment (Vercel)

1. **Build the application**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Set environment variables** in Vercel:
   - `REACT_APP_API_URL` - Your backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Google Maps for location services
- MongoDB for database
- React and Node.js communities
- All contributors and users

---

**Happy Traveling! 🌍✈️**
