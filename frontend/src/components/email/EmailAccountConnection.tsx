import React, { useState } from 'react';
import { emailService, EmailAccount } from '../../services/emailService';
import './EmailAccountConnection.css';

interface EmailAccountConnectionProps {
  onAccountConnected: (account: EmailAccount) => void;
  onLoading?: (loading: boolean) => void;
}

export const EmailAccountConnection: React.FC<EmailAccountConnectionProps> = ({
  onAccountConnected,
  onLoading,
}) => {
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'custom'>('gmail');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    onLoading?.(true);

    try {
      const account = await emailService.connectEmailAccount(provider, {
        email,
        password,
      });
      onAccountConnected(account);
      setEmail('');
      setPassword('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  const handleOAuthConnect = async (oauthProvider: 'gmail' | 'outlook') => {
    setLoading(true);
    setError(null);
    onLoading?.(true);

    try {
      // In a real app, this would redirect to OAuth provider
      const account = await emailService.connectEmailAccount(oauthProvider);
      onAccountConnected(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  return (
    <div className="email-account-connection">
      <h3>Connect Your Email Account</h3>
      <p className="subtitle">Add Gmail, Outlook, or custom email to ShiftSync</p>

      {!showForm ? (
        <div className="oauth-buttons">
          <button
            className="oauth-btn google"
            onClick={() => handleOAuthConnect('gmail')}
            disabled={loading}
          >
            <span className="icon">📧</span>
            Connect Gmail
          </button>
          <button
            className="oauth-btn outlook"
            onClick={() => handleOAuthConnect('outlook')}
            disabled={loading}
          >
            <span className="icon">📨</span>
            Connect Outlook
          </button>
          <button
            className="oauth-btn custom"
            onClick={() => setShowForm(true)}
          >
            <span className="icon">⚙️</span>
            Custom Email
          </button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="email-form">
          <div className="form-group">
            <label>Email Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'gmail' | 'outlook' | 'custom')}
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="custom">Custom Email</option>
            </select>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Connecting...' : 'Connect Account'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
