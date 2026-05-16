import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div 
      className={`toast toast--${type} ${isExiting ? 'toast--exiting' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast__icon" aria-hidden="true">
        {getIcon()}
      </span>
      
      <div className="toast__content">
        <h4 className="toast__title">{title}</h4>
        {message && <p className="toast__message">{message}</p>}
      </div>
      
      <button
        className="toast__close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ×
      </button>

      {duration > 0 && (
        <div className="toast__progress">
          <div 
            className="toast__progress-bar"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>,
    document.body
  );
};

// Hook for using toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>>([]);

  const showToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (title: string, message?: string, duration?: number) =>
      showToast('success', title, message, duration),
    error: (title: string, message?: string, duration?: number) =>
      showToast('error', title, message, duration),
    warning: (title: string, message?: string, duration?: number) =>
      showToast('warning', title, message, duration),
    info: (title: string, message?: string, duration?: number) =>
      showToast('info', title, message, duration),
  };
};