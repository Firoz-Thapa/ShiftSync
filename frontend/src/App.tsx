import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext';
import { Loading, Button, Card } from './components/common';
import { ROUTES } from './constants/routes';
import './styles/globals.css';

const HomePage = () => {
  const { user, logout } = useAuth();
  
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card>
        <div style={{ textAlign: 'center' }}>
          <h1>🚀 Welcome to ShiftSync</h1>
          <p>Welcome back, {user?.firstName} {user?.lastName}!</p>
          <p>Email: {user?.email}</p>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => alert('Dashboard coming soon!')}>
              📊 Dashboard
            </Button>
            <Button variant="secondary" onClick={() => alert('Schedule coming soon!')}>
              📅 Schedule
            </Button>
            <Button variant="success" onClick={() => alert('Workplaces coming soon!')}>
              🏢 Workplaces
            </Button>
            <Button variant="error" onClick={logout}>
              🚪 Logout
            </Button>
          </div>
        </div>
      </Card>
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
      window.location.href = '/';
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
      <Card padding="large">
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
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
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
            >
              Sign In to ShiftSync
            </Button>
          </form>
        </div>
      </Card>
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
      <Route path={ROUTES.LOGIN} element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={user ? <HomePage /> : <Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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