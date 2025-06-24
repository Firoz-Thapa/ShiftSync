import React from 'react';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/common';

export const Schedule: React.FC = () => {
  return (
    <>
      <PageHeader
        title="📅 Schedule"
        subtitle="View and manage your shifts and study sessions"
        actions={
          <Button variant="primary">
            Add Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">Calendar View Coming Soon! 🗓️</h3>
            <p className="text-gray-600 mb-6">
              We're building an awesome calendar interface to visualize your schedule.
            </p>
            <Button variant="primary">
              View Today's Schedule
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};