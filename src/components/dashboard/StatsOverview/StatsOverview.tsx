import React from 'react';
import { Card } from '../../common/Card/Card';
import { useShifts } from '../../../hooks/useShifts';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { formatHours, formatCurrency } from '../../../utils/formatters';
import { calculateDuration } from '../../../utils/dateUtils';
import './StatsOverview.css';

export const StatsOverview: React.FC = () => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const { shifts } = useShifts({
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
  });

  const { studySessions } = useStudySessions({
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
  });

  // Calculate stats
  const weeklyWorkHours = shifts.reduce((total, shift) => {
    return total + calculateDuration(shift.startDatetime, shift.endDatetime);
  }, 0);

  const weeklyStudyHours = studySessions.reduce((total, session) => {
    return total + calculateDuration(session.startDatetime, session.endDatetime);
  }, 0);

  const weeklyEarnings = shifts.reduce((total, shift) => {
    const hours = calculateDuration(shift.startDatetime, shift.endDatetime);
    return total + (hours * (shift.workplace?.hourlyRate || 0));
  }, 0);

  const completedSessions = studySessions.filter(session => session.isCompleted).length;
  const totalSessions = studySessions.length;

  return (
    <Card>
      <div className="stats-overview">
        <h3 className="stats-overview__title">📊 This Week</h3>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-item__icon">💼</div>
            <div className="stat-item__content">
              <span className="stat-item__value">{formatHours(weeklyWorkHours)}</span>
              <span className="stat-item__label">Work Hours</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-item__icon">📚</div>
            <div className="stat-item__content">
              <span className="stat-item__value">{formatHours(weeklyStudyHours)}</span>
              <span className="stat-item__label">Study Hours</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-item__icon">💰</div>
            <div className="stat-item__content">
              <span className="stat-item__value">{formatCurrency(weeklyEarnings)}</span>
              <span className="stat-item__label">Earnings</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-item__icon">✅</div>
            <div className="stat-item__content">
              <span className="stat-item__value">{completedSessions}/{totalSessions}</span>
              <span className="stat-item__label">Study Goals</span>
            </div>
          </div>
        </div>

        <div className="productivity-bar">
          <div className="productivity-bar__header">
            <span>Weekly Progress</span>
            <span>{Math.round((completedSessions / Math.max(totalSessions, 1)) * 100)}%</span>
          </div>
          <div className="productivity-bar__track">
            <div 
              className="productivity-bar__fill"
              style={{ width: `${(completedSessions / Math.max(totalSessions, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
