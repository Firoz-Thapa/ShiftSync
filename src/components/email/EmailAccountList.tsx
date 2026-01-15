import React from 'react';
import { EmailAccount } from '../../services/emailService';
import './EmailAccountList.css';

interface EmailAccountListProps {
  accounts: EmailAccount[];
  selectedAccountId?: string;
  onSelectAccount: (accountId: string) => void;
  onDisconnect: (accountId: string) => void;
  onLoading?: (loading: boolean) => void;
}

export const EmailAccountList: React.FC<EmailAccountListProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onDisconnect,
  onLoading,
}) => {
  const handleDisconnect = async (accountId: string) => {
    if (window.confirm('Are you sure you want to disconnect this account?')) {
      onLoading?.(true);
      try {
        onDisconnect(accountId);
      } finally {
        onLoading?.(false);
      }
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="email-account-list">
      <h3>Connected Accounts ({accounts.length})</h3>
      <div className="accounts">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`account-card ${
              selectedAccountId === account.id ? 'active' : ''
            }`}
            onClick={() => onSelectAccount(account.id)}
          >
            <div className="account-header">
              <div className="account-info">
                <span className="provider-badge">{account.provider.toUpperCase()}</span>
                <span className="email">{account.email}</span>
              </div>
              <button
                className="btn-disconnect"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisconnect(account.id);
                }}
                title="Disconnect this account"
              >
                ✕
              </button>
            </div>
            <div className="account-meta">
              <span className="status">
                {account.isConnected ? '✓ Connected' : '⚠ Disconnected'}
              </span>
              {account.lastSync && (
                <span className="last-sync">
                  Last sync: {new Date(account.lastSync).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
