import React, { useState, useEffect, useCallback } from 'react';
import './BreakTimer.css';

interface BreakTimerProps {
  breakDuration: number; // in minutes
  onBreakEnd?: () => void;
  shiftTitle?: string;
}

export const BreakTimer: React.FC<BreakTimerProps> = ({ 
  breakDuration, 
  onBreakEnd,
  shiftTitle = 'Break'
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            // Play notification sound or show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Break Time Over!', {
                body: `Your ${breakDuration} minute break for ${shiftTitle} has ended.`,
                icon: '☕'
              });
            }
            onBreakEnd?.();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft, onBreakEnd, breakDuration, shiftTitle]);

  const startBreak = useCallback(() => {
    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    setTimeLeft(breakDuration * 60);
    setIsActive(true);
    setIsPaused(false);
  }, [breakDuration]);

  const pauseBreak = () => {
    setIsPaused(!isPaused);
  };

  const resetBreak = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (breakDuration === 0) return 0;
    return ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;
  };

  const getTimeStatus = () => {
    const percentage = getProgressPercentage();
    if (percentage < 50) return 'fresh';
    if (percentage < 80) return 'halfway';
    return 'ending';
  };

  if (breakDuration === 0) {
    return (
      <div className="break-timer break-timer--disabled">
        <span className="break-timer__no-break">No break scheduled</span>
      </div>
    );
  }

  return (
    <div className={`break-timer ${isActive ? 'break-timer--active' : ''}`}>
      {!isActive ? (
        <button 
          className="break-timer__start"
          onClick={startBreak}
          type="button"
        >
          <span className="break-timer__start-icon">☕</span>
          <span className="break-timer__start-text">
            Start {breakDuration} min break
          </span>
        </button>
      ) : (
        <div className="break-timer__active-container">
          <div className="break-timer__header">
            <span className="break-timer__label">Break Time</span>
            <span className={`break-timer__status break-timer__status--${getTimeStatus()}`}>
              {isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
          
          <div className="break-timer__display">
            <span className="break-timer__icon">☕</span>
            <span className={`break-timer__time break-timer__time--${getTimeStatus()}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="break-timer__progress">
            <div 
              className={`break-timer__progress-bar break-timer__progress-bar--${getTimeStatus()}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          <div className="break-timer__controls">
            <button 
              className="break-timer__btn break-timer__btn--pause"
              onClick={pauseBreak}
              type="button"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button 
              className="break-timer__btn break-timer__btn--stop"
              onClick={resetBreak}
              type="button"
              aria-label="Stop"
            >
              ⏹️ End
            </button>
          </div>

          {timeLeft < 60 && timeLeft > 0 && (
            <div className="break-timer__warning">
              Less than a minute remaining!
            </div>
          )}
        </div>
      )}
    </div>
  );
};