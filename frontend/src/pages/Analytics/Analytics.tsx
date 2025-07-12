import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/common';
import { useShifts } from '../../hooks/useShifts';
import { useStudySessions } from '../../hooks/useStudySessions';
import { useWorkplaces } from '../../hooks/useWorkplaces';
import { calculateDuration } from '../../utils/dateUtils';

// Define proper interfaces
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
  }>;
  label?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color = 'blue' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <Card className="hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]} text-white text-2xl mr-4`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last period
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

const ChartCard: React.FC<ChartCardProps> = ({ title, children, actions }) => (
  <Card>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    <div className="h-80">
      {children}
    </div>
  </Card>
);

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('earnings') || entry.name.includes('$') ? `$${entry.value}` : `${entry.value}h`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6weeks');
  const [selectedMetric, setSelectedMetric] = useState('earnings');

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '1week':
        start.setDate(start.getDate() - 7);
        break;
      case '4weeks':
        start.setDate(start.getDate() - 28);
        break;
      case '6weeks':
        start.setDate(start.getDate() - 42);
        break;
      case '12weeks':
        start.setDate(start.getDate() - 84);
        break;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [timeRange]);

  // Fetch data using your existing hooks
  const { shifts, isLoading: shiftsLoading } = useShifts(dateRange);
  const { studySessions, isLoading: studyLoading } = useStudySessions(dateRange);
  const { workplaces } = useWorkplaces();

  // Process the real data into chart format
  const processedData = useMemo(() => {
    if (shiftsLoading || studyLoading) return null;

    // Group by weeks for the chart
    const weeks = [];
    const weeksCount = timeRange === '1week' ? 1 : timeRange === '4weeks' ? 4 : timeRange === '6weeks' ? 6 : 12;
    
    for (let i = weeksCount - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.startDatetime);
        return shiftDate >= weekStart && shiftDate <= weekEnd;
      });
      
      const weekStudy = studySessions.filter(session => {
        const sessionDate = new Date(session.startDatetime);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      
      const weekEarnings = weekShifts.reduce((total, shift) => {
        const hours = calculateDuration(shift.startDatetime, shift.endDatetime);
        return total + (hours * (shift.workplace?.hourlyRate || 0));
      }, 0);
      
      const weekHours = weekShifts.reduce((total, shift) => {
        return total + calculateDuration(shift.startDatetime, shift.endDatetime);
      }, 0);
      
      const weekStudyHours = weekStudy.reduce((total, session) => {
        return total + calculateDuration(session.startDatetime, session.endDatetime);
      }, 0);
      
      weeks.push({
        week: `Week ${weeksCount - i}`,
        earnings: Math.round(weekEarnings),
        hours: Math.round(weekHours * 10) / 10,
        studyHours: Math.round(weekStudyHours * 10) / 10
      });
    }

    // Process workplace data
    const workplaceMap = new Map<string, { name: string; earnings: number; hours: number; color: string }>();
    shifts.forEach(shift => {
      if (!shift.workplace) return;
      const hours = calculateDuration(shift.startDatetime, shift.endDatetime);
      const earnings = hours * shift.workplace.hourlyRate;
      
      if (workplaceMap.has(shift.workplace.name)) {
        const existing = workplaceMap.get(shift.workplace.name)!;
        existing.earnings += earnings;
        existing.hours += hours;
      } else {
        workplaceMap.set(shift.workplace.name, {
          name: shift.workplace.name,
          earnings: earnings,
          hours: hours,
          color: shift.workplace.color
        });
      }
    });

    // Process study data
    const studyMap = new Map<string, { subject: string; hours: number; sessions: number }>();
    studySessions.forEach(session => {
      const subject = session.subject || 'Other';
      const hours = calculateDuration(session.startDatetime, session.endDatetime);
      
      if (studyMap.has(subject)) {
        const existing = studyMap.get(subject)!;
        existing.hours += hours;
        existing.sessions += 1;
      } else {
        studyMap.set(subject, {
          subject: subject,
          hours: hours,
          sessions: 1
        });
      }
    });

    return {
      earningsData: weeks,
      workplaceData: Array.from(workplaceMap.values()).map(wp => ({
        ...wp,
        earnings: Math.round(wp.earnings),
        hours: Math.round(wp.hours * 10) / 10
      })),
      studyData: Array.from(studyMap.values()).map(st => ({
        ...st,
        hours: Math.round(st.hours * 10) / 10
      })).sort((a, b) => b.hours - a.hours)
    };
  }, [shifts, studySessions, timeRange, shiftsLoading, studyLoading]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!processedData) return null;

    const totalEarnings = processedData.earningsData.reduce((sum, week) => sum + week.earnings, 0);
    const totalWorkHours = processedData.earningsData.reduce((sum, week) => sum + week.hours, 0);
    const totalStudyHours = processedData.earningsData.reduce((sum, week) => sum + week.studyHours, 0);
    const avgHourlyRate = totalWorkHours > 0 ? totalEarnings / totalWorkHours : 0;
    const productivityScore = totalWorkHours + totalStudyHours > 0 ? 
      Math.round((totalStudyHours / (totalWorkHours + totalStudyHours)) * 100) : 0;

    return {
      totalEarnings,
      totalWorkHours,
      totalStudyHours,
      avgHourlyRate,
      productivityScore
    };
  }, [processedData]);

  if (shiftsLoading || studyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!processedData || !totals) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-4">No data available</h3>
        <p className="text-gray-600">Start adding shifts and study sessions to see analytics!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="📊 Analytics Dashboard"
        subtitle="Track your productivity, earnings, and study progress"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              title="Select time range"
            >
              <option value="1week">Last Week</option>
              <option value="4weeks">Last Month</option>
              <option value="6weeks">Last 6 Weeks</option>
              <option value="12weeks">Last 3 Months</option>
            </select>
            <Button variant="secondary" size="small">
              📤 Export
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value={`$${totals.totalEarnings.toLocaleString()}`}
          icon="💰"
          color="green"
        />
        <StatCard
          title="Work Hours"
          value={`${totals.totalWorkHours}h`}
          icon="⏰"
          color="blue"
        />
        <StatCard
          title="Study Hours"
          value={`${totals.totalStudyHours}h`}
          icon="📚"
          color="purple"
        />
        <StatCard
          title="Avg Hourly Rate"
          value={`$${totals.avgHourlyRate.toFixed(2)}`}
          icon="📈"
          color="orange"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings & Hours Trend */}
        <ChartCard 
          title="Earnings & Hours Trend"
          actions={
            <>
              <button 
                className={`px-3 py-1 rounded text-sm ${selectedMetric === 'earnings' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setSelectedMetric('earnings')}
              >
                Earnings
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${selectedMetric === 'hours' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setSelectedMetric('hours')}
              >
                Hours
              </button>
            </>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData.earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#3498db" 
                strokeWidth={3}
                dot={{ fill: '#3498db', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Earnings ($)"
              />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="#2ecc71" 
                strokeWidth={3}
                dot={{ fill: '#2ecc71', strokeWidth: 2, r: 4 }}
                name="Work Hours"
              />
              <Line 
                type="monotone" 
                dataKey="studyHours" 
                stroke="#9b59b6" 
                strokeWidth={3}
                dot={{ fill: '#9b59b6', strokeWidth: 2, r: 4 }}
                name="Study Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Work-Life Balance */}
        <ChartCard title="Work-Life Balance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData.earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="hours" stackId="a" fill="#3498db" name="Work Hours" />
              <Bar dataKey="studyHours" stackId="a" fill="#9b59b6" name="Study Hours" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Secondary Charts Row */}
      {processedData.workplaceData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workplace Distribution */}
          <ChartCard title="Earnings by Workplace">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.workplaceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="earnings"
                >
                  {processedData.workplaceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value}`, 'Earnings']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Study Distribution */}
          {processedData.studyData.length > 0 && (
            <ChartCard title="Study Time by Subject">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData.studyData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#666" />
                  <YAxis dataKey="subject" type="category" stroke="#666" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="#9b59b6" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Productivity Insights */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Productivity Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
              {totals.productivityScore}%
            </div>
            <p className="font-medium text-gray-800">Study-Work Balance</p>
            <p className="text-sm text-gray-600">Study time percentage</p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">📈 Current Stats</h4>
            <div className="text-sm text-gray-600">
              <p>• Total work sessions: {shifts.length}</p>
              <p>• Total study sessions: {studySessions.length}</p>
              <p>• Active workplaces: {workplaces.length}</p>
              <p>• Average session length: {totals.totalWorkHours > 0 ? (totals.totalWorkHours / shifts.length).toFixed(1) : 0}h</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">💡 Recommendations</h4>
            <div className="text-sm text-gray-600">
              {totals.productivityScore < 30 && <p>• Consider scheduling more study sessions</p>}
              {totals.productivityScore > 70 && <p>• Great study focus! Consider more work hours for income</p>}
              {totals.totalEarnings === 0 && <p>• Add your first workplace and shifts</p>}
              {processedData.studyData.length === 0 && <p>• Start tracking your study sessions</p>}
              <p>• {totals.productivityScore >= 30 && totals.productivityScore <= 70 ? 'Excellent work-study balance!' : 'Keep up the great work!'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};