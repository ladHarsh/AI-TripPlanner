import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

// Layout Components
import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import About from './pages/About';
import Contact from './pages/Contact';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Hotels from './pages/Hotels';
import HotelDetail from './pages/HotelDetail';
import Transport from './pages/Transport';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import TripPlanner from './pages/TripPlanner';
import Bookings from './pages/Bookings';
import Maps from './pages/Maps';

// Error Pages
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/hotels" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Hotels />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/hotels/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <HotelDetail />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/transport" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Transport />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/trips" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Trips />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/trips/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TripDetail />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/planner" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TripPlanner />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Bookings />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/maps" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Maps />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
