import React from 'react';
import { Card } from '../../common/Card/Card';
import { useShifts } from '../../../hooks/useShifts';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { formatHours, formatCurrency } from '../../../utils/formatters';
import { calculateDuration } from '../../../utils/dateUtils';
import './StatsOverview.css';

export const StatsOverview: React.FC = () => {
  const startOfWeek = new Date();
  const dayOfWeek = startOfWeek.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

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

  const weeklyWorkHours = shifts.reduce((total, shift) => {
    return total + calculateDuration(shift.startDatetime, shift.endDatetime);
  }, 0);

  const weeklyStudyHours = studySessions.reduce((total, session) => {
    return total + calculateDuration(session.startDatetime, session.endDatetime);
  }, 0);

  const weeklyEarnings = shifts.reduce((total, shift) => {
    const hours = calculateDuration(shift.startDatetime, shift.endDatetime);
    if (shift.workplace?.payType === 'monthly') {
      return total;
    }
    const rate = shift.workplace?.hourlyRate || 0;
    return total + (hours * rate);
  }, 0);

  const completedSessions = studySessions.filter(session => session.isCompleted).length;
  const totalSessions = studySessions.length;
  const progressPercentage = totalSessions > 0
    ? Math.round((completedSessions / totalSessions) * 100)
    : 0;

  const weekRangeText = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const hasData = shifts.length > 0 || studySessions.length > 0;

  const statItems = [
    { label: 'Work hours', value: formatHours(weeklyWorkHours), icon: 'W' },
    { label: 'Study hours', value: formatHours(weeklyStudyHours), icon: 'S' },
    { label: 'Hourly earnings', value: formatCurrency(weeklyEarnings), icon: '$' },
    {
      label: 'Study goals',
      value: totalSessions === 0 ? '-' : `${completedSessions}/${totalSessions}`,
      icon: 'G',
    },
  ];

  if (shiftsLoading || studyLoading) {
    return (
      <Card>
        <section className="stats-overview" aria-labelledby="stats-overview-title">
          <h3 id="stats-overview-title" className="stats-overview__title">This week</h3>
          <div className="stats-overview__state">Loading stats...</div>
        </section>
      </Card>
    );
  }

  return (
    <Card>
      <section className="stats-overview" aria-labelledby="stats-overview-title">
        <div className="stats-overview__header">
          <div>
            <span className="stats-overview__eyebrow">Progress</span>
            <h3 id="stats-overview-title" className="stats-overview__title">This week</h3>
          </div>
          <span className="stats-overview__range">{weekRangeText}</span>
        </div>

        {!hasData ? (
          <div className="stats-overview__state">
            <strong>No activity this week yet</strong>
            <p>Add shifts or study sessions to track your progress.</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              {statItems.map((item) => (
                <div className="stat-item" key={item.label}>
                  <span className="stat-item__icon" aria-hidden="true">{item.icon}</span>
                  <span className="stat-item__content">
                    <span className="stat-item__value">{item.value}</span>
                    <span className="stat-item__label">{item.label}</span>
                  </span>
                </div>
              ))}
            </div>

            {totalSessions > 0 && (
              <div className="productivity-bar">
                <div className="productivity-bar__header">
                  <span>Study progress</span>
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

            {weeklyWorkHours === 0 && weeklyStudyHours === 0 && hasData && (
              <div className="stats-overview__note">
                You have scheduled activities this week. Keep it up.
              </div>
            )}
          </>
        )}
      </section>
    </Card>
  );
};
