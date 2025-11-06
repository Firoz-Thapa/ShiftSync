import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../common';
import { useShifts } from '../../../hooks/useShifts';
import './ActiveClockIn.css';

interface ActiveClockInData {
  shiftId: number;
  startTime: string;
  workplace?: {
    name: string;
    color: string;
    hourlyRate: number;
  };
}

export const ActiveClockIn: React.FC = () => {
  const [activeClockIn, setActiveClockIn] = useState<ActiveClockInData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const { clockOut } = useShifts();

  useEffect(() => {
    // Check for active clock-in on mount
    const checkActiveClockIn = () => {
      const stored = localStorage.getItem('shiftsync_active_clockin');
      if (stored) {
        setActiveClockIn(JSON.parse(stored));
      }
    };

    checkActiveClockIn();

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', checkActiveClockIn);
    return () => window.removeEventListener('storage', checkActiveClockIn);
  }, []);

  useEffect(() => {
    if (!activeClockIn) return;

    // Update elapsed time every second
    const interval = setInterval(() => {
      const startTime = new Date(activeClockIn.startTime);
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      setElapsedTime(diffHours);
      
      // Calculate current earnings
      if (activeClockIn.workplace?.hourlyRate) {
        setCurrentEarnings(diffHours * activeClockIn.workplace.hourlyRate);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeClockIn]);

  const handleClockOut = async () => {
    if (!activeClockIn) return;

    try {
      await clockOut(activeClockIn.shiftId);
      setActiveClockIn(null);
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Clocked Out Successfully! 🎉', {
          body: `You worked ${formatElapsedTime(elapsedTime)} and earned $${currentEarnings.toFixed(2)}`,
          icon: '💼'
        });
      }
    } catch (error: any) {
      alert(`Failed to clock out: ${error.message}`);
    }
  };

  const formatElapsedTime = (hours: number): string => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = Math.floor((hours * 3600) % 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!activeClockIn) {
    return null; // Don't show anything if not clocked in
  }

  return (
    <Card className="active-clockin">
      <div className="active-clockin__header">
        <div 
          className="active-clockin__indicator"
          style={{ backgroundColor: activeClockIn.workplace?.color || '#48bb78' }}
        />
        <h3 className="active-clockin__title">🕐 Currently Clocked In</h3>
        <span className="active-clockin__pulse">●</span>
      </div>

      <div className="active-clockin__content">
        {activeClockIn.workplace && (
          <div className="active-clockin__workplace">
            <span className="active-clockin__workplace-name">
              {activeClockIn.workplace.name}
            </span>
            <span className="active-clockin__rate">
              ${activeClockIn.workplace.hourlyRate.toFixed(2)}/hr
            </span>
          </div>
        )}

        <div className="active-clockin__stats">
          <div className="active-clockin__stat">
            <span className="active-clockin__stat-label">Time Worked</span>
            <span className="active-clockin__stat-value active-clockin__stat-value--time">
              {formatElapsedTime(elapsedTime)}
            </span>
          </div>

          <div className="active-clockin__stat">
            <span className="active-clockin__stat-label">Current Earnings</span>
            <span className="active-clockin__stat-value active-clockin__stat-value--money">
              ${currentEarnings.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="active-clockin__details">
          <span className="active-clockin__started">
            Started at {new Date(activeClockIn.startTime).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>
      </div>

      <Button 
        variant="error" 
        fullWidth 
        onClick={handleClockOut}
        className="active-clockin__button"
      >
        ⏹️ Clock Out
      </Button>
    </Card>
  );
};