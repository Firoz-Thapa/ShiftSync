import React from 'react';
import { PageHeader } from '../components/layout';
import './ActivityLog.css';

export const ActivityLog = () => (
  <div className="activity-log">
    <PageHeader
      title="Activity Log"
      subtitle="A history of your recent account activity."
    />
    <section className="activity-log__empty" aria-label="Activity log">
      <span className="activity-log__icon" aria-hidden="true">🕘</span>
      <h2>No activity yet</h2>
      <p>Activity will appear here as you use ShiftSync.</p>
    </section>
  </div>
);
