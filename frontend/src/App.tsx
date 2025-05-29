import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Schedule } from './pages/Schedule/Schedule';
import { Workplaces } from './pages/Workplaces/Workplaces';
import { Analytics } from './pages/Analytics/Analytics';
import { Profile } from './pages/Profile/Profile';
import { Loading } from './components/common';
import { ROUTES } from './constants/routes';
import './styles/globals.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading fullScreen text="Loading ShiftSync..." />;
  }
  
  return user ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading fullScreen text="Loading ShiftSync..." />;
  }
  
  return user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.SCHEDULE}
        element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.WORKPLACES}
        element={
          <ProtectedRoute>
            <Workplaces />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.ANALYTICS}
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      
      {/* 404 fallback */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;