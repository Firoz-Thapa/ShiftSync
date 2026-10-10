import React, { useState, useEffect } from 'react';
import { EmailAccountConnection, EmailAccountList, EmailList, EmailViewer } from '../../components/email';
import { emailService, EmailMessage, EmailAccount } from '../../services/emailService';
import './Email.css';

export const EmailPage = () => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountConnection, setShowAccountConnection] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Load connected accounts on component mount
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const error = query.get('emailError');
    if (error) {
      setEmailError(error);
      query.delete('emailError');
      const remainingQuery = query.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ''}`
      );
    }
    loadAccounts();
  }, []);

  // Load emails when account is selected
  useEffect(() => {
    if (selectedAccountId) {
      loadEmails(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Load selected email details
  useEffect(() => {
    if (selectedEmailId && selectedAccountId) {
      loadEmailDetails(selectedAccountId, selectedEmailId);
    } else {
      setSelectedEmail(null);
    }
  }, [selectedEmailId, selectedAccountId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await emailService.getConnectedAccounts();
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to load email accounts.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmails = async (accountId: string) => {
    try {
      setEmailsLoading(true);
      const data = await emailService.getEmails(accountId);
      setEmails(data);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to load emails.');
    } finally {
      setEmailsLoading(false);
    }
  };

  const loadEmailDetails = async (accountId: string, emailId: string) => {
    try {
      const email = await emailService.getEmail(accountId, emailId);
      setSelectedEmail(email);
      if (!email.isRead) {
        await emailService.markAsRead(accountId, emailId);
        // Update email in list
        setEmails(
          emails.map((e) => (e.id === emailId ? { ...e, isRead: true } : e))
        );
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to load email.');
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await emailService.disconnectAccount(accountId);
      setAccounts(accounts.filter((a) => a.id !== accountId));
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
        setEmails([]);
        setSelectedEmail(null);
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to disconnect email account.');
    }
  };

  const handleSync = async () => {
    if (!selectedAccountId) return;
    try {
      setEmailsLoading(true);
      const data = await emailService.syncEmails(selectedAccountId);
      setEmails(data);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to sync emails.');
    } finally {
      setEmailsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccountId || !searchQuery.trim()) return;

    try {
      setEmailsLoading(true);
      const data = await emailService.searchEmails(selectedAccountId, searchQuery);
      setEmails(data);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to search emails.');
    } finally {
      setEmailsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (selectedAccountId) {
      loadEmails(selectedAccountId);
    }
  };

  return (
    <div className="email-page">
      {emailError && (
        <div className="error-message" role="alert">
          {emailError}
          <button type="button" onClick={() => setEmailError(null)} aria-label="Dismiss error">×</button>
        </div>
      )}
      <div className="email-container">
        {/* Left Panel: Email Connection & Accounts */}
        <div className="email-sidebar">
          <div className="sidebar-content">
            {accounts.length === 0 ? (
              <EmailAccountConnection />
            ) : (
              <>
                <EmailAccountList
                  accounts={accounts}
                  selectedAccountId={selectedAccountId || undefined}
                  onSelectAccount={setSelectedAccountId}
                  onDisconnect={handleDisconnect}
                />
                {showAccountConnection ? (
                  <>
                    <EmailAccountConnection />
                    <button className="btn-add-account" onClick={() => setShowAccountConnection(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="btn-add-account" onClick={() => setShowAccountConnection(true)}>
                    + Add Another Account
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Middle Panel: Email List */}
        <div className="email-main">
          {selectedAccountId ? (
            <>
              <div className="email-controls">
                <form className="search-form" onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <button type="submit" className="btn-search">
                    🔍
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="btn-clear"
                    >
                      ✕
                    </button>
                  )}
                </form>
                <button className="btn-sync" onClick={handleSync} disabled={emailsLoading}>
                  {emailsLoading ? '⟳ Syncing...' : '⟳ Sync'}
                </button>
              </div>
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmailId || undefined}
                onSelectEmail={setSelectedEmailId}
                isLoading={emailsLoading}
              />
            </>
          ) : (
            <div className="no-account-selected">
              <p>Select or connect an email account to view emails</p>
            </div>
          )}
        </div>

        {/* Right Panel: Email Viewer */}
        <div className="email-detail">
          <EmailViewer email={selectedEmail} />
        </div>
      </div>
    </div>
  );
};
