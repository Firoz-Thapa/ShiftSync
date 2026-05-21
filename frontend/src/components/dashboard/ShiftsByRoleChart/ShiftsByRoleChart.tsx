import React, { useMemo } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card } from '../../common';
import { useShifts } from '../../../hooks/useShifts';
import { calculateDuration } from '../../../utils/dateUtils';
import './ShiftsByRoleChart.css';

interface RoleChartData {
  name: string;
  shifts: number;
  hours: number;
  color: string;
}

const CHART_COLORS = [
  '#2563eb',
  '#16a34a',
  '#f97316',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#ca8a04',
  '#db2777',
];

const getThisWeekRange = () => {
  const startDate = new Date();
  const dayOfWeek = startDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + daysToMonday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate,
    endDate,
    apiRange: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
  };
};

const formatWeekRange = (startDate: Date, endDate: Date) =>
  `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

export const ShiftsByRoleChart: React.FC = () => {
  const { startDate, endDate, apiRange } = useMemo(getThisWeekRange, []);
  const { shifts, isLoading } = useShifts(apiRange);

  const chartData = useMemo<RoleChartData[]>(() => {
    const roleMap = new Map<string, { shifts: number; hours: number }>();

    shifts.forEach((shift) => {
      const roleName = shift.title.trim() || 'Untitled Shift';
      const existing = roleMap.get(roleName) ?? { shifts: 0, hours: 0 };

      roleMap.set(roleName, {
        shifts: existing.shifts + 1,
        hours: existing.hours + calculateDuration(shift.startDatetime, shift.endDatetime),
      });
    });

    return Array.from(roleMap.entries())
      .map(([name, value], index) => ({
        name,
        shifts: value.shifts,
        hours: Math.round(value.hours * 10) / 10,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.shifts - a.shifts);
  }, [shifts]);

  const totalShifts = chartData.reduce((total, role) => total + role.shifts, 0);
  const weekRangeText = formatWeekRange(startDate, endDate);

  if (isLoading) {
    return (
      <Card>
        <section className="shifts-by-role">
          <div className="shifts-by-role__header">
            <h2 className="shifts-by-role__title">Shifts by Role</h2>
            <span className="shifts-by-role__range">{weekRangeText}</span>
          </div>
          <div className="shifts-by-role__loading">Loading shift distribution...</div>
        </section>
      </Card>
    );
  }

  return (
    <Card>
      <section className="shifts-by-role" aria-labelledby="shifts-by-role-title">
        <div className="shifts-by-role__header">
          <div>
            <h2 id="shifts-by-role-title" className="shifts-by-role__title">
              Shifts by Role
            </h2>
            <p className="shifts-by-role__subtitle">
              Distribution by shift title for this week
            </p>
          </div>
          <span className="shifts-by-role__range">{weekRangeText}</span>
        </div>

        {chartData.length === 0 ? (
          <div className="shifts-by-role__empty">
            <p>No shifts scheduled this week yet.</p>
            <span>Add shifts to see your role distribution.</span>
          </div>
        ) : (
          <div className="shifts-by-role__content">
            <div className="shifts-by-role__chart" aria-label="Pie chart showing shift distribution by role">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    dataKey="shifts"
                    nameKey="name"
                    paddingAngle={3}
                    stroke="var(--bg-card)"
                    strokeWidth={3}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, props) => {
                      const payload = props.payload as RoleChartData;
                      return [`${value} shift${value === 1 ? '' : 's'} (${payload.hours}h)`, payload.name];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="shifts-by-role__total">
                <strong>{totalShifts}</strong>
                <span>Total shifts</span>
              </div>
            </div>

            <div className="shifts-by-role__list">
              {chartData.map((role) => (
                <div className="shifts-by-role__item" key={role.name}>
                  <span
                    className="shifts-by-role__swatch"
                    style={{ backgroundColor: role.color }}
                    aria-hidden="true"
                  />
                  <div className="shifts-by-role__item-text">
                    <span className="shifts-by-role__name">{role.name}</span>
                    <span className="shifts-by-role__meta">
                      {role.shifts} shift{role.shifts === 1 ? '' : 's'} - {role.hours}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </Card>
  );
};
