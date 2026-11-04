import React, { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card } from '../../components/common';
import { ROUTES } from '../../constants/routes';
import '../../pages/Register/Register.css';

export const AcceptInvitation = () => {
  const { hash } = useLocation();
  const token = new URLSearchParams(hash.slice(1)).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { acceptInvitation } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError('This invitation link is invalid or expired.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await acceptInvitation({ token, password });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Invitation could not be accepted.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="register-logo"><h1>Join ShiftSync</h1></div>
          <p className="register-subtitle">Create a password to activate your invited account.</p>
        </div>
        <Card className="register-card">
          <h2 className="register-title">Accept invitation</h2>
          <p className="register-description">Your invitation link expires after 48 hours and can only be used once.</p>
          <form onSubmit={handleSubmit} className="register-form">
            {error && <div className="error-message" role="alert">{error}</div>}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} />
            </div>
            <Button type="submit" fullWidth loading={isLoading} className="register-button">Accept invitation</Button>
          </form>
          <div className="register-footer"><Link to={ROUTES.LOGIN} className="register-link">Back to sign in</Link></div>
        </Card>
      </div>
    </div>
  );
};
