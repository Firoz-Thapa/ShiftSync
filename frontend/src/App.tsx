import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext'; 
import { ThemeProvider } from './contexts/ThemeContext';
import { Loading } from './components/common';
import { Layout } from './components/layout';
import { ROUTES } from './constants/routes';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Schedule } from './pages/Schedule/Schedule';
import { Workplaces } from './pages/Workplaces/Workplaces';
import { Analytics } from './pages/Analytics/Analytics';
import { Profile } from './pages/Profile/Profile';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Email } from './pages/Email';
import LandingPage from './components/LandingPage/LandingPage';

import './styles/globals.css';
import './styles/theme.css';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen text="Loading ShiftSync..." />;
  }

  return (
    <Routes>
      <Route 
        path={ROUTES.HOME} 
        element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <LandingPage />} 
      />
      <Route 
        path={ROUTES.LOGIN} 
        element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Login />} 
      />
      <Route 
        path={ROUTES.REGISTER} 
        element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Register />} 
      />

      <Route 
        path={ROUTES.DASHBOARD} 
        element={user ? (
          <Layout>
            <Dashboard />
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.SCHEDULE} 
        element={user ? (
          <Layout>
            <Schedule />
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.WORKPLACES} 
        element={user ? (
          <Layout>
            <Workplaces />
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.ANALYTICS} 
        element={user ? (
          <Layout>
            <Analytics />
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.PROFILE} 
        element={user ? (
          <Layout>
            <Profile />
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.EMAIL} 
        element={user ? (
          <Layout>
            <Email />
          </Layout>
        ) : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      
      <Route 
        path="*" 
        element={<Navigate to={user ? ROUTES.DASHBOARD : ROUTES.HOME} replace />} 
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App