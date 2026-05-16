import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card } from '../../components/common';
import { ROUTES } from '../../constants/routes';
import { validateEmail } from '../../utils/validators';
import './Login.css';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData);
      navigate(ROUTES.DASHBOARD);
    } catch (error: any) {
      setErrors({ general: error.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-icon">⚡</span>
            <h1>ShiftSync</h1>
          </div>
          <p className="login-subtitle">
            Your personal time wizard - juggling study sessions and three jobs has never been this smooth!
          </p>
        </div>

        <Card className="login-card">
          <h2 className="login-title">Welcome Back!</h2>
          <p className="login-description">Sign in to manage your schedule</p>

          <form onSubmit={handleSubmit} className="login-form">
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="your.email@example.com"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="login-button"
            >
              Sign In
            </Button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="login-link">
                Sign up here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};