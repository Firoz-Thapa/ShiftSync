import React from 'react';
import { Notice } from '../../types';
import { Button } from '../common/Button/Button';
import './NoticeCard.css';

interface NoticeCardProps {
  notice: Notice;
  onEdit?: (notice: Notice) => void;
  onDelete?: (id: number) => void;
  onPin?: (id: number, isPinned: boolean) => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  notice,
  onEdit,
  onDelete,
  onPin
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`notice-card ${notice.isPinned ? 'notice-card--pinned' : ''}`}>
      <div className="notice-card__header">
        <div className="notice-card__title-section">
          {notice.isPinned && <span className="notice-card__pin-icon">📌</span>}
          <h3 className="notice-card__title">{notice.title}</h3>
        </div>
        <div className="notice-card__actions">
          {onPin && (
            <button
              className="notice-card__action-btn"
              onClick={() => onPin(notice.id, !notice.isPinned)}
              title={notice.isPinned ? 'Unpin notice' : 'Pin notice'}
            >
              {notice.isPinned ? '📌' : '📍'}
            </button>
          )}
          {onEdit && (
            <button
              className="notice-card__action-btn"
              onClick={() => onEdit(notice)}
              title="Edit notice"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              className="notice-card__action-btn notice-card__action-btn--delete"
              onClick={() => onDelete(notice.id)}
              title="Delete notice"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="notice-card__metadata">
        <span className="notice-card__category">{notice.category}</span>
        <span className="notice-card__author">by {notice.createdByUserName}</span>
        <span className="notice-card__date">{formatDate(notice.createdAt)}</span>
      </div>

      <p className="notice-card__content">{notice.content}</p>

      {notice.tags.length > 0 && (
        <div className="notice-card__tags">
          {notice.tags.map((tag, index) => (
            <span key={index} className="notice-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {notice.attachments.length > 0 && (
        <div className="notice-card__attachments">
          <p className="notice-card__attachments-label">📎 Attachments:</p>
          <ul className="notice-card__attachments-list">
            {notice.attachments.map(attachment => (
              <li key={attachment.id} className="notice-card__attachment-item">
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="notice-card__attachment-link"
                >
                  {attachment.fileName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
