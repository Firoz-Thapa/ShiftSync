import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext';
import { Loading } from './components/common';
import { ROUTES } from './constants/routes';
import { Dashboard } from './pages/Dashboard/Dashboard';
import './styles/globals.css';

// Temporary simplified components for other pages
const Schedule = () => {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1>📅 Schedule</h1>
        <p>Schedule management coming soon...</p>
      </div>
    </div>
  );
};

const Workplaces = () => {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1>🏢 Workplaces</h1>
        <p>Workplace management coming soon...</p>
      </div>
    </div>
  );
};

const Analytics = () => {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1>📊 Analytics</h1>
        <p>Analytics dashboard coming soon...</p>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1>👤 Profile</h1>
        <p>Name: {user?.firstName} {user?.lastName}</p>
        <p>Email: {user?.email}</p>
        <button 
          onClick={logout}
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      // Navigation will be handled by the routing logic
    } catch (error) {
      alert('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <span style={{ fontSize: '3rem' }}>⚡</span>
          <h1 style={{ margin: '10px 0', color: '#2d3748' }}>ShiftSync</h1>
          <p style={{ color: '#718096' }}>Your personal time wizard</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="your.email@example.com"
            />
          </div>
          <div style={{ marginBottom: '30px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In to ShiftSync'}
          </button>
        </form>
      </div>
    </div>
  );
};

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
        element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <LoginPage />} 
      />
      
      {/* Protected Routes */}
      <Route 
        path={ROUTES.DASHBOARD} 
        element={user ? <Dashboard /> : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.SCHEDULE} 
        element={user ? <Schedule /> : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.WORKPLACES} 
        element={user ? <Workplaces /> : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.ANALYTICS} 
        element={user ? <Analytics /> : <Navigate to={ROUTES.LOGIN} replace />} 
      />
      <Route 
        path={ROUTES.PROFILE} 
        element={user ? <Profile /> : <Navigate to={ROUTES.LOGIN} replace />} 
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