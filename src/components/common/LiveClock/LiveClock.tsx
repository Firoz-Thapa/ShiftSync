import React, { useState, useEffect } from 'react';
import './LiveClock.css';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    if (hour < 20) return '🌆 Good Evening';
    return '🌙 Good Night';
  };

  return (
    <div className="live-clock">
      <div className="clock-greeting">
        {getGreeting()}
      </div>
      <div className="clock-time">
        {formatTime(time)}
      </div>
      <div className="clock-date">
        {formatDate(time)}
      </div>
    </div>
  );
};