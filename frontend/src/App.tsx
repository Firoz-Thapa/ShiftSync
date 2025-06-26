import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext'; // Use SimpleAuthContext for now
import { Loading } from './components/common';
import { Layout } from './components/layout';
import { ROUTES } from './constants/routes';

// Import your actual page components
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Schedule } from './pages/Schedule/Schedule';
import { Workplaces } from './pages/Workplaces/Workplaces';
import { Analytics } from './pages/Analytics/Analytics';
import { Profile } from './pages/Profile/Profile';
import { Login } from './pages/Login/Login';

import './styles/globals.css';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen text="Loading ShiftSync..." />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path={ROUTES.LOGIN} 
        element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Login />} 
      />
      
      {/* Protected Routes - All wrapped in Layout with centering */}
      <Route 
        path={ROUTES.DASHBOARD} 
        element={user ? (
          <Layout>
            <div className="centered-content">
              <Dashboard />
            </div>
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.SCHEDULE} 
        element={user ? (
          <Layout>
            <div className="centered-content">
              <Schedule />
            </div>
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.WORKPLACES} 
        element={user ? (
          <Layout>
            <div className="centered-content">
              <Workplaces />
            </div>
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.ANALYTICS} 
        element={user ? (
          <Layout>
            <div className="centered-content">
              <Analytics />
            </div>
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.PROFILE} 
        element={user ? (
          <Layout>
            <div className="centered-content">
              <Profile />
            </div>
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      
      {/* Default Routes */}
      <Route 
        path={ROUTES.HOME} 
        element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={user ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />} 
      />
    </Routes>
  );
};

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