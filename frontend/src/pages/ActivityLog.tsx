import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import {
  ActivityAction,
  ActivityEntity,
  ActivityEvent,
  activityService,
} from '../services/activityService';
import './ActivityLog.css';

type DateFilter = 'all' | '7' | '30';

const actionLabels: Record<ActivityAction, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  confirmed: 'Confirmed',
  clocked_in: 'Clocked in for',
  clocked_out: 'Clocked out of',
  completed: 'Completed',
  invited: 'Invited',
  connected: 'Connected',
  disconnected: 'Disconnected',
  synced: 'Synced',
  password_changed: 'Changed password',
};

const entityLabels: Record<ActivityEntity, string> = {
  shift: 'shift',
  study_session: 'study session',
  workplace: 'workplace',
  notice: 'notice',
  team_member: 'team member',
  account: 'account',
  email: 'email',
};

const entityOptions: Array<{ value: ActivityEntity | 'all'; label: string }> = [
  { value: 'all', label: 'All activity' },
  { value: 'shift', label: 'Shifts' },
  { value: 'study_session', label: 'Study sessions' },
  { value: 'workplace', label: 'Workplaces' },
  { value: 'notice', label: 'Notices' },
  { value: 'team_member', label: 'Team' },
  { value: 'account', label: 'Account' },
  { value: 'email', label: 'Email' },
];

const isEntityFilter = (value: string): value is ActivityEntity | 'all' =>
  entityOptions.some(option => option.value === value);

const isDateFilter = (value: string): value is DateFilter =>
  value === 'all' || value === '7' || value === '30';

const getDayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const formatDay = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (getDayKey(date) === getDayKey(today)) return 'Today';
  if (getDayKey(date) === getDayKey(yesterday)) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(date);
};

const formatTime = (date: Date): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

const getActivityIcon = (event: ActivityEvent): string => {
  if (event.action === 'deleted') return '×';
  if (event.action === 'clocked_in') return '↗';
  if (event.action === 'clocked_out') return '↙';
  if (event.action === 'completed') return '✓';
  if (event.entity === 'shift') return '▣';
  if (event.entity === 'study_session') return '▤';
  if (event.entity === 'workplace') return '⌂';
  if (event.entity === 'notice') return '▱';
  if (event.entity === 'team_member') return '♙';
  if (event.entity === 'email') return '✉';
  return '●';
};

export const ActivityLog = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<ActivityEntity | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(() => {
    if (userId === undefined) return;
    try {
      setActivities(activityService.getActivities(userId));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load activity.');
    }
  }, [userId]);

  useEffect(() => {
    loadActivities();
    return activityService.subscribe(loadActivities);
  }, [loadActivities]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const cutoff = dateFilter === 'all'
      ? null
      : Date.now() - Number(dateFilter) * 24 * 60 * 60 * 1000;

    return activities.filter(event => {
      const eventDate = Date.parse(event.createdAt);
      if (entityFilter !== 'all' && event.entity !== entityFilter) return false;
      if (cutoff !== null && eventDate < cutoff) return false;
      if (!query) return true;
      return `${event.title} ${actionLabels[event.action]} ${entityLabels[event.entity]}`
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [activities, dateFilter, entityFilter, search]);

  const groupedActivities = useMemo(() => {
    const groups = new Map<string, { date: Date; events: ActivityEvent[] }>();
    filteredActivities.forEach(event => {
      const date = new Date(event.createdAt);
      const key = getDayKey(date);
      const group = groups.get(key);
      if (group) {
        group.events.push(event);
      } else {
        groups.set(key, { date, events: [event] });
      }
    });
    return Array.from(groups.values());
  }, [filteredActivities]);

  const todayCount = filteredActivities.filter(
    event => getDayKey(new Date(event.createdAt)) === getDayKey(new Date())
  ).length;

  const clearFilters = () => {
    setSearch('');
    setEntityFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="activity-log">
      <PageHeader
        title="Activity log"
        subtitle="A timeline of the changes and actions across your workspace."
      />

      {error && <div className="activity-log__error" role="alert">{error}</div>}

      <section className="activity-log__summary" aria-label="Activity summary">
        <div className="activity-log__stat">
          <span className="activity-log__stat-icon" aria-hidden="true">◷</span>
          <div>
            <span className="activity-log__stat-label">Activity shown</span>
            <strong>{filteredActivities.length}</strong>
          </div>
        </div>
        <div className="activity-log__stat">
          <span className="activity-log__stat-icon activity-log__stat-icon--today" aria-hidden="true">✓</span>
          <div>
            <span className="activity-log__stat-label">Today</span>
            <strong>{todayCount}</strong>
          </div>
        </div>
        <div className="activity-log__summary-note">
          <span className="activity-log__live-dot" aria-hidden="true" />
          Your activity is saved on this device
        </div>
      </section>

      <section className="activity-log__panel" aria-label="Activity history">
        <div className="activity-log__toolbar">
          <div className="activity-log__toolbar-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Changes are recorded as they happen.</p>
            </div>
          </div>
          <div className="activity-log__filters">
            <label className="activity-log__search">
              <span className="activity-log__sr-only">Search activity</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search activity"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </label>
            <label>
              <span className="activity-log__sr-only">Filter by activity type</span>
              <select
                value={entityFilter}
                onChange={event => {
                  if (isEntityFilter(event.target.value)) {
                    setEntityFilter(event.target.value);
                  }
                }}
              >
                {entityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="activity-log__sr-only">Filter by date</span>
              <select
                value={dateFilter}
                onChange={event => {
                  if (isDateFilter(event.target.value)) {
                    setDateFilter(event.target.value);
                  }
                }}
              >
                <option value="all">Any time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </label>
          </div>
        </div>

        {groupedActivities.length ? (
          <div className="activity-log__timeline">
            {groupedActivities.map(group => (
              <section className="activity-log__day" key={getDayKey(group.date)}>
                <h3>{formatDay(group.date)}</h3>
                <ol>
                  {group.events.map(event => (
                    <li className="activity-log__event" key={event.id}>
                      <span
                        className={`activity-log__event-icon activity-log__event-icon--${event.action}`}
                        aria-hidden="true"
                      >
                        {getActivityIcon(event)}
                      </span>
                      <div className="activity-log__event-content">
                        <p>
                          <strong>{actionLabels[event.action]}</strong>{' '}
                          {event.action !== 'password_changed' &&
                            event.action !== 'clocked_in' &&
                            event.action !== 'clocked_out' &&
                            event.entity !== 'email' &&
                            entityLabels[event.entity]}
                          {event.title ? <span className="activity-log__event-title"> {event.title}</span> : null}
                        </p>
                        <time dateTime={event.createdAt}>{formatTime(new Date(event.createdAt))}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <div className="activity-log__empty">
            <span className="activity-log__empty-icon" aria-hidden="true">◷</span>
            <h3>{activities.length ? 'No matching activity' : 'No activity yet'}</h3>
            <p>
              {activities.length
                ? 'Try adjusting your search or filters.'
                : 'Create or update a shift, study session, workplace, or notice to see it here.'}
            </p>
            {(search || entityFilter !== 'all' || dateFilter !== 'all') && (
              <button type="button" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
