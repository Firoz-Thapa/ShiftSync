import React, { useState, useEffect } from 'react';
import { Modal, Button, Loading } from '../../common';
import { useShifts } from '../../../hooks/useShifts';
import { Shift } from '../../../types';
import { formatTime } from '../../../utils/dateUtils';
import './ClockInModal.css';

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClockInModal: React.FC<ClockInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const { shifts, isLoading, clockIn } = useShifts({ startDate: today, endDate: today });

  useEffect(() => {
    if (isOpen) {
      // Filter shifts that haven't been clocked into yet
      const availableShifts = shifts.filter(shift => !shift.actualStartTime);
      setTodayShifts(availableShifts);
      
      // Auto-select if only one shift
      if (availableShifts.length === 1) {
        setSelectedShiftId(availableShifts[0].id);
      }
    }
  }, [shifts, isOpen]);

  const handleClockIn = async () => {
    if (!selectedShiftId) {
      setError('Please select a shift to clock in');
      return;
    }

    setIsClockingIn(true);
    setError(null);

    try {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      await clockIn(selectedShiftId);
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const shift = todayShifts.find(s => s.id === selectedShiftId);
        new Notification('Clocked In Successfully! 🎉', {
          body: `Started tracking time at ${shift?.workplace?.name || 'your workplace'}`,
          icon: '⏰'
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to clock in');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleCancel = () => {
    setSelectedShiftId(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="🕐 Clock In"
      size="medium"
    >
      <div className="clockin-modal">
        {error && (
          <div className="clockin-modal__error">
            ⚠️ {error}
          </div>
        )}

        {isLoading ? (
          <Loading text="Loading today's shifts..." />
        ) : todayShifts.length === 0 ? (
          <div className="clockin-modal__empty">
            <div className="clockin-modal__empty-icon">📅</div>
            <h3 className="clockin-modal__empty-title">No Shifts Today</h3>
            <p className="clockin-modal__empty-message">
              You don't have any shifts scheduled for today. Add a shift first to clock in!
            </p>
          </div>
        ) : (
          <>
            <p className="clockin-modal__instruction">
              Select the shift you're starting:
            </p>

            <div className="clockin-modal__shifts">
              {todayShifts.map(shift => (
                <button
                  key={shift.id}
                  className={`shift-option ${selectedShiftId === shift.id ? 'shift-option--selected' : ''}`}
                  onClick={() => setSelectedShiftId(shift.id)}
                  type="button"
                >
                  <div 
                    className="shift-option__indicator"
                    style={{ backgroundColor: shift.workplace?.color || '#3498db' }}
                  />
                  
                  <div className="shift-option__content">
                    <h4 className="shift-option__title">{shift.title}</h4>
                    <p className="shift-option__workplace">
                      {shift.workplace?.name || 'Unknown Workplace'}
                    </p>
                    <p className="shift-option__time">
                      {formatTime(shift.startDatetime)} - {formatTime(shift.endDatetime)}
                    </p>
                  </div>

                  <div className="shift-option__check">
                    {selectedShiftId === shift.id && '✓'}
                  </div>
                </button>
              ))}
            </div>

            <div className="clockin-modal__actions">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isClockingIn}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleClockIn}
                loading={isClockingIn}
                disabled={!selectedShiftId || isClockingIn}
              >
                {isClockingIn ? 'Clocking In...' : 'Start Shift'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};