import React, { useState } from 'react';
import { emailService } from '../../services/emailService';
import './EmailAccountConnection.css';

export const EmailAccountConnection = () => {
  const [loadingProvider, setLoadingProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthConnect = async (provider: 'gmail' | 'outlook') => {
    setLoadingProvider(provider);
    setError(null);

    try {
      const authorizationUrl = await emailService.getAuthorizationUrl(provider);
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start email authorization.');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="email-account-connection">
      <h3>Connect Your Email Account</h3>
      <p className="subtitle">Connect Gmail or Outlook to read and sync your inbox.</p>

      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="oauth-buttons">
        <button
          className="oauth-btn google"
          onClick={() => handleOAuthConnect('gmail')}
          disabled={loadingProvider !== null}
        >
          <span className="icon">📧</span>
          {loadingProvider === 'gmail' ? 'Connecting...' : 'Connect Gmail'}
        </button>
        <button
          className="oauth-btn outlook"
          onClick={() => handleOAuthConnect('outlook')}
          disabled={loadingProvider !== null}
        >
          <span className="icon">📨</span>
          {loadingProvider === 'outlook' ? 'Connecting...' : 'Connect Outlook'}
        </button>
      </div>
    </div>
  );
};
