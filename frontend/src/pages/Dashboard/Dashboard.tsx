import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TodaySchedule } from '../../components/dashboard/TodaySchedule';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { StatsOverview } from '../../components/dashboard/StatsOverview';
import { ShiftsByRoleChart } from '../../components/dashboard/ShiftsByRoleChart';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const firstName = user?.firstName || 'there';

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">Today at a glance</span>
          <h1 id="dashboard-title" className="dashboard-hero__title">
            Welcome back, {firstName}
          </h1>
          <p className="dashboard-hero__subtitle">
            Your shifts, study sessions, and weekly progress are ready when you are.
          </p>
        </div>
        <div className="dashboard-hero__status" aria-label="Dashboard status">
          <span className="dashboard-hero__status-label">Focus mode</span>
          <strong>On track</strong>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <TodaySchedule />
          <ShiftsByRoleChart />
        </div>

        <div className="dashboard-sidebar">
          <QuickActions />
          <StatsOverview />
        </div>
      </div>
    </div>
  );
};
