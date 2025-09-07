import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/layout';
import { TodaySchedule } from '../../components/dashboard/TodaySchedule';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { StatsOverview } from '../../components/dashboard/StatsOverview';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.firstName}! 🎯`}
        subtitle="Ready to conquer your day? Here's what's coming up..."
      />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <TodaySchedule />
        </div>
        
        <div className="dashboard-sidebar">
          <QuickActions />
          <StatsOverview />
        </div>
      </div>
    </>
  );
};