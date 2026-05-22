import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import Login from './pages/Login';
import { DeviceStatusProvider } from './services/DeviceStatusContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  // Listen for storage changes (for login/logout across tabs if needed)
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    };
    window.addEventListener('storage', checkAuth);
    // Periodically check local storage status to synchronize within the same tab
    const interval = setInterval(checkAuth, 500);
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  return (
    <DeviceStatusProvider>
      <Router>
        <Routes>
          {/* LOGIN ROUTE */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to={localStorage.getItem('userRole') === 'SUPER_ADMIN' ? "/super-admin" : "/dashboard"} replace />} 
          />

          {/* PROTECTED ROUTES */}
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <MainLayout>
                  <AppRoutes />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </DeviceStatusProvider>
  );
}

export default App;
