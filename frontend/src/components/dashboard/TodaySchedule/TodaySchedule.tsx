import React from 'react';
import { Card } from '../../common';
import { useShifts } from '../../../hooks/useShifts';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { formatTime, getRelativeDateLabel } from '../../../utils/dateUtils';
import './TodaySchedule.css';

export const TodaySchedule: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { shifts, isLoading: shiftsLoading } = useShifts({ startDate: today, endDate: today });
  const { studySessions, isLoading: studyLoading } = useStudySessions({ startDate: today, endDate: today });

  const allItems = [
    ...shifts.map(shift => ({
      id: `shift-${shift.id}`,
      type: 'work' as const,
      title: shift.title,
      subtitle: shift.workplace?.name || 'Work',
      startTime: shift.startDatetime,
      endTime: shift.endDatetime,
      color: shift.workplace?.color || '#3498db',
      isConfirmed: shift.isConfirmed,
    })),
    ...studySessions.map(session => ({
      id: `study-${session.id}`,
      type: 'study' as const,
      title: session.title,
      subtitle: session.subject || 'Study',
      startTime: session.startDatetime,
      endTime: session.endDatetime,
      color: '#2ecc71',
      priority: session.priority,
    })),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (shiftsLoading || studyLoading) {
    return (
      <Card>
        <div className="today-schedule__loading">
          Loading today's schedule...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="today-schedule">
        <h2 className="today-schedule__title">
          📅 Today's Schedule
          <span className="today-schedule__date">
            {getRelativeDateLabel(today)}
          </span>
        </h2>

        {allItems.length === 0 ? (
          <div className="today-schedule__empty">
            <p>🎉 No scheduled items for today!</p>
            <p>Time for some spontaneous productivity?</p>
          </div>
        ) : (
          <div className="today-schedule__items">
            {allItems.map((item) => (
              <div key={item.id} className="schedule-item">
                <div 
                  className="schedule-item__indicator"
                  style={{ backgroundColor: item.color }}
                />
                
                <div className="schedule-item__content">
                  <div className="schedule-item__header">
                    <h3 className="schedule-item__title">{item.title}</h3>
                    <span className="schedule-item__time">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </span>
                  </div>
                  
                  <div className="schedule-item__details">
                    <span className="schedule-item__subtitle">{item.subtitle}</span>
                    <div className="schedule-item__badges">
                      <span className={`schedule-badge schedule-badge--${item.type}`}>
                        {item.type === 'work' ? '💼' : '📚'} {item.type}
                      </span>
                      
                      {item.type === 'work' && !item.isConfirmed && (
                        <span className="schedule-badge schedule-badge--pending">
                          ⏳ Pending
                        </span>
                      )}
                      
                      {item.type === 'study' && item.priority === 'urgent' && (
                        <span className="schedule-badge schedule-badge--urgent">
                          🔥 Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};