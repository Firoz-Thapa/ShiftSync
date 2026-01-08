import React, { useState, useEffect } from 'react';
import { EmailAccountConnection, EmailAccountList, EmailList, EmailViewer } from '../../components/email';
import { emailService, Email, EmailAccount } from '../../services/emailService';
import './Email.css';

export const Email: React.FC = () => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load connected accounts on component mount
  useEffect(() => {
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
      console.error('Failed to load accounts:', error);
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
      console.error('Failed to load emails:', error);
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
      console.error('Failed to load email:', error);
    }
  };

  const handleAccountConnected = async (account: EmailAccount) => {
    setAccounts([...accounts, account]);
    setSelectedAccountId(account.id);
    await loadEmails(account.id);
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
      console.error('Failed to disconnect account:', error);
    }
  };

  const handleSync = async () => {
    if (!selectedAccountId) return;
    try {
      setEmailsLoading(true);
      const data = await emailService.syncEmails(selectedAccountId);
      setEmails(data);
    } catch (error) {
      console.error('Failed to sync emails:', error);
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
      console.error('Failed to search emails:', error);
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
      <div className="email-container">
        {/* Left Panel: Email Connection & Accounts */}
        <div className="email-sidebar">
          <div className="sidebar-content">
            {accounts.length === 0 ? (
              <EmailAccountConnection
                onAccountConnected={handleAccountConnected}
                onLoading={setLoading}
              />
            ) : (
              <>
                <EmailAccountList
                  accounts={accounts}
                  selectedAccountId={selectedAccountId || undefined}
                  onSelectAccount={setSelectedAccountId}
                  onDisconnect={handleDisconnect}
                  onLoading={setLoading}
                />
                <button className="btn-add-account" onClick={() => {}}>
                  + Add Another Account
                </button>
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
