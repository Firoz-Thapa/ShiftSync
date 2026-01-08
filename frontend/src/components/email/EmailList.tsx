import React from 'react';
import { Email } from '../../services/emailService';
import './EmailList.css';

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onSelectEmail: (emailId: string) => void;
  onLoading?: (loading: boolean) => void;
  isLoading?: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  isLoading = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (isLoading) {
    return (
      <div className="email-list loading">
        <div className="spinner"></div>
        <p>Loading emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="email-list empty">
        <p>No emails found</p>
      </div>
    );
  }

  return (
    <div className="email-list">
      <div className="email-list-header">
        <h3>Inbox ({emails.length})</h3>
      </div>
      <div className="emails">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`email-item ${!email.isRead ? 'unread' : ''} ${
              selectedEmailId === email.id ? 'selected' : ''
            }`}
            onClick={() => onSelectEmail(email.id)}
          >
            <div className="email-item-header">
              <div className="sender-info">
                <span className={`avatar ${email.isRead ? '' : 'unread'}`}>
                  {email.from.charAt(0).toUpperCase()}
                </span>
                <div className="sender-details">
                  <span className="from">{email.from.split('<')[0].trim()}</span>
                  <span className="subject">{truncateText(email.subject)}</span>
                </div>
              </div>
              <div className="email-meta">
                <span className="date">{formatDate(email.date)}</span>
                {email.hasAttachments && <span className="attachment-icon">📎</span>}
                {!email.isRead && <span className="unread-indicator"></span>}
              </div>
            </div>
            <div className="email-item-preview">
              {truncateText(email.body.replace(/<[^>]*>/g, ''), 80)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
