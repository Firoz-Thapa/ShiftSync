import React from 'react';
import { PageHeader } from '../../components/layout';
import { Card } from '../../components/common';

export const Analytics: React.FC = () => {
  return (
    <>
      <PageHeader
        title="📊 Analytics"
        subtitle="Track your productivity, earnings, and study progress"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">📈 Earnings Analytics</h3>
            <p className="text-gray-600">
              Beautiful charts showing your income trends, hours worked, and productivity metrics.
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">🎯 Study Analytics</h3>
            <p className="text-gray-600">
              Track your study goals, completion rates, and academic progress over time.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};