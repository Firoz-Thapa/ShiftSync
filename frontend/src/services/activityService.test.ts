import { activityService } from './activityService';

describe('activityService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records events and only returns events for the requested user', () => {
    localStorage.setItem('shiftsync_user', JSON.stringify({ id: 12 }));
    const firstEvent = activityService.recordActivity('created', 'shift', 'Morning shift');

    localStorage.setItem('shiftsync_user', JSON.stringify({ id: 34 }));
    const secondEvent = activityService.recordActivity('deleted', 'notice', 'Team update');

    expect(activityService.getActivities(12)).toEqual([firstEvent]);
    expect(activityService.getActivities(34)).toEqual([secondEvent]);
  });

  it('notifies the activity page after an event is recorded', () => {
    localStorage.setItem('shiftsync_user', JSON.stringify({ id: 12 }));
    const listener = jest.fn();
    const unsubscribe = activityService.subscribe(listener);

    activityService.recordActivity('completed', 'study_session', 'Biology review');

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('surfaces invalid stored activity data', () => {
    localStorage.setItem('shiftsync_activity_log', JSON.stringify([{ invalid: true }]));

    expect(() => activityService.getActivities(12)).toThrow('Activity log data is invalid');
  });
});
