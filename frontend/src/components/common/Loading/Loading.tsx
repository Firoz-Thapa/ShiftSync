import React from 'react';
import './Loading.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export const Loading = ({
  size = 'medium',
  text,
  fullScreen = false,
}: LoadingProps) => {
  const containerClass = fullScreen ? 'loading-container--fullscreen' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner loading-spinner--${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};