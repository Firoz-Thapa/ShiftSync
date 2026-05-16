import React from 'react';
import { EmailMessage } from '../../services/emailService';
import './EmailViewer.css';

interface EmailViewerProps {
  email: EmailMessage | null;
  isLoading?: boolean;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="email-viewer loading">
        <div className="spinner"></div>
        <p>Loading email...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="email-viewer empty">
        <div className="empty-state">
          <span className="icon">📧</span>
          <p>Select an email to read</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="email-viewer">
      <div className="email-header">
        <div className="email-subject">
          <h2>{email.subject}</h2>
        </div>
        <div className="email-from">
          <span className="avatar">{email.from.charAt(0).toUpperCase()}</span>
          <div className="from-details">
            <span className="from-email">{email.from}</span>
            <span className="date">{formatDate(email.date)}</span>
          </div>
        </div>
      </div>

      <div className="email-body">
        <div
          className="body-content"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>

      {email.hasAttachments && (
        <div className="email-attachments">
          <div className="attachments-header">
            <span className="icon">📎</span>
            <span className="label">This email has attachments</span>
          </div>
        </div>
      )}
    </div>
  );
};
