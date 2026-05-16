import React from 'react';
import { Card } from '../../common/Card/Card';
import { useShifts } from '../../../hooks/useShifts';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { formatHours, formatCurrency } from '../../../utils/formatters';
import { calculateDuration } from '../../../utils/dateUtils';
import './StatsOverview.css';

export const StatsOverview: React.FC = () => {
  // Get start of current week (Monday)
  const startOfWeek = new Date();
  const dayOfWeek = startOfWeek.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday case
  startOfWeek.setDate(startOfWeek.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const { shifts, isLoading: shiftsLoading } = useShifts({
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
  });

  const { studySessions, isLoading: studyLoading } = useStudySessions({
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
  });

  // Calculate actual stats from data
  const weeklyWorkHours = shifts.reduce((total, shift) => {
    return total + calculateDuration(shift.startDatetime, shift.endDatetime);
  }, 0);

  const weeklyStudyHours = studySessions.reduce((total, session) => {
    return total + calculateDuration(session.startDatetime, session.endDatetime);
  }, 0);

  const weeklyEarnings = shifts.reduce((total, shift) => {
    const hours = calculateDuration(shift.startDatetime, shift.endDatetime);
    const rate = shift.workplace?.hourlyRate || 0;
    return total + (hours * rate);
  }, 0);

  const completedSessions = studySessions.filter(session => session.isCompleted).length;
  const totalSessions = studySessions.length;
  
  // Calculate progress percentage (handle division by zero)
  const progressPercentage = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0;

  // Get week range for display
  const weekRangeText = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  // Show loading state
  if (shiftsLoading || studyLoading) {
    return (
      <Card>
        <div className="stats-overview">
          <h3 className="stats-overview__title">📊 This Week</h3>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
            <div style={{ marginBottom: '0.5rem' }}>⏳</div>
            Loading stats...
          </div>
        </div>
      </Card>
    );
  }

  // Check if there's any data
  const hasData = shifts.length > 0 || studySessions.length > 0;

  return (
    <Card>
      <div className="stats-overview">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="stats-overview__title" style={{ margin: 0 }}>📊 This Week</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{weekRangeText}</span>
        </div>
        
        {!hasData ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem 1rem', 
            color: 'var(--text-tertiary)',
            background: 'var(--bg-secondary)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500, color: 'var(--text-secondary)' }}>
              No activity this week yet
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Add shifts or study sessions to track your progress
            </p>
          </div>
        ) : (
          <>
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
                  <span className="stat-item__value">
                    {totalSessions === 0 ? '-' : `${completedSessions}/${totalSessions}`}
                  </span>
                  <span className="stat-item__label">Study Goals</span>
                </div>
              </div>
            </div>

            {totalSessions > 0 && (
              <div className="productivity-bar">
                <div className="productivity-bar__header">
                  <span>Study Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="productivity-bar__track">
                  <div 
                    className="productivity-bar__fill"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Optional: Show motivational message */}
            {weeklyWorkHours === 0 && weeklyStudyHours === 0 && (shifts.length > 0 || studySessions.length > 0) && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                💪 You have scheduled activities this week. Keep it up!
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};