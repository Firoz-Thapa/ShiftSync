import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../common';
import { useShifts } from '../../../hooks/useShifts';
import { ClockInModal } from '../ClockInModal/ClockInModal';
import './ActiveClockIn.css';

interface ActiveClockInData {
  shiftId: number;
  startTime: string;
  workplace?: {
    name: string;
    color: string;
    payType?: 'hourly' | 'monthly';
    hourlyRate: number;
    monthlySalary?: number;
  };
}

export const ActiveClockIn = () => {
  const [activeClockIn, setActiveClockIn] = useState<ActiveClockInData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [isClockInOpen, setIsClockInOpen] = useState(false);
  const { clockOut } = useShifts();

  useEffect(() => {
    // Check for active clock-in on mount
    const checkActiveClockIn = () => {
      const stored = localStorage.getItem('shiftsync_active_clockin');
      setActiveClockIn(stored ? JSON.parse(stored) : null);
    };

    checkActiveClockIn();

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', checkActiveClockIn);
    window.addEventListener('shiftsync:clock-status-changed', checkActiveClockIn);
    return () => {
      window.removeEventListener('storage', checkActiveClockIn);
      window.removeEventListener('shiftsync:clock-status-changed', checkActiveClockIn);
    };
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
      if (activeClockIn.workplace?.payType !== 'monthly' && activeClockIn.workplace?.hourlyRate) {
        setCurrentEarnings(diffHours * activeClockIn.workplace.hourlyRate);
      } else {
        setCurrentEarnings(0);
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
          body: activeClockIn.workplace?.payType === 'monthly'
            ? `You worked ${formatElapsedTime(elapsedTime)} on a monthly salary role`
            : `You worked ${formatElapsedTime(elapsedTime)} and earned €${currentEarnings.toFixed(2)}`,
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
    return (
      <>
        <Card className="active-clockin active-clockin--ready">
          <div className="active-clockin__header">
            <div className="active-clockin__indicator" />
            <h3 className="active-clockin__title">Ready to start work?</h3>
          </div>
          <p className="active-clockin__intro">Start a scheduled shift and keep its actual time in one place.</p>
          <Button variant="success" size="large" fullWidth onClick={() => setIsClockInOpen(true)}>
            Clock in
          </Button>
        </Card>
        <ClockInModal
          isOpen={isClockInOpen}
          onClose={() => setIsClockInOpen(false)}
          onSuccess={() => setIsClockInOpen(false)}
        />
      </>
    );
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
              {activeClockIn.workplace.payType === 'monthly'
                ? `€${(activeClockIn.workplace.monthlySalary || 0).toFixed(2)}/mo`
                : `€${activeClockIn.workplace.hourlyRate.toFixed(2)}/hr`}
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
            <span className="active-clockin__stat-label">
              {activeClockIn.workplace?.payType === 'monthly' ? 'Monthly Salary' : 'Current Earnings'}
            </span>
            <span className="active-clockin__stat-value active-clockin__stat-value--money">
              {activeClockIn.workplace?.payType === 'monthly'
                ? `€${(activeClockIn.workplace.monthlySalary || 0).toFixed(2)}`
                : `€${currentEarnings.toFixed(2)}`}
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
