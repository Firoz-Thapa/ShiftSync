export type ActivityEntity =
  | 'shift'
  | 'study_session'
  | 'workplace'
  | 'notice'
  | 'team_member'
  | 'account'
  | 'email';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'confirmed'
  | 'clocked_in'
  | 'clocked_out'
  | 'completed'
  | 'invited'
  | 'connected'
  | 'disconnected'
  | 'synced'
  | 'password_changed';

export interface ActivityEvent {
  id: string;
  userId: number;
  action: ActivityAction;
  entity: ActivityEntity;
  title: string;
  createdAt: string;
}

const STORAGE_KEY = 'shiftsync_activity_log';
const MAX_ACTIVITY_EVENTS = 500;
const ACTIVITY_UPDATED_EVENT = 'shiftsync:activity-updated';

const activityActions: string[] = [
  'created',
  'updated',
  'deleted',
  'confirmed',
  'clocked_in',
  'clocked_out',
  'completed',
  'invited',
  'connected',
  'disconnected',
  'synced',
  'password_changed',
];

const activityEntities: string[] = [
  'shift',
  'study_session',
  'workplace',
  'notice',
  'team_member',
  'account',
  'email',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isActivityEvent = (value: unknown): value is ActivityEvent => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.userId === 'number' &&
    Number.isFinite(value.userId) &&
    typeof value.action === 'string' &&
    activityActions.includes(value.action) &&
    typeof value.entity === 'string' &&
    activityEntities.includes(value.entity) &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'string' &&
    !Number.isNaN(Date.parse(value.createdAt))
  );
};

const readEvents = (): ActivityEvent[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isActivityEvent)) {
    throw new Error('Activity log data is invalid. Clear the corrupted browser activity data to continue.');
  }
  return parsed;
};

export const activityService = {
  getActivities(userId: number): ActivityEvent[] {
    return readEvents()
      .filter(event => event.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  recordActivity(
    action: ActivityAction,
    entity: ActivityEntity,
    title: string
  ): ActivityEvent {
    const storedUser = localStorage.getItem('shiftsync_user');
    if (!storedUser) {
      throw new Error('Cannot record activity without a signed-in user.');
    }

    const user: unknown = JSON.parse(storedUser);
    if (
      typeof user !== 'object' ||
      user === null ||
      !('id' in user) ||
      typeof user.id !== 'number' ||
      !Number.isFinite(user.id)
    ) {
      throw new Error('Cannot record activity because the signed-in user data is invalid.');
    }

    const event: ActivityEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId: user.id,
      action,
      entity,
      title,
      createdAt: new Date().toISOString(),
    };

    const events = readEvents();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([event, ...events].slice(0, MAX_ACTIVITY_EVENTS))
    );
    window.dispatchEvent(new Event(ACTIVITY_UPDATED_EVENT));
    return event;
  },

  subscribe(listener: () => void): () => void {
    window.addEventListener(ACTIVITY_UPDATED_EVENT, listener);
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener(ACTIVITY_UPDATED_EVENT, listener);
      window.removeEventListener('storage', listener);
    };
  },
};
