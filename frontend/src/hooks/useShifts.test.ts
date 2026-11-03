import { act, renderHook } from '@testing-library/react';
import { useShifts } from './useShifts';
import { activityService } from '../services/activityService';

describe('useShifts activity tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('shiftsync_user', JSON.stringify({ id: 12 }));
  });

  it('records a shift after it is created', async () => {
    const { result } = renderHook(() => useShifts());

    await act(async () => {
      await result.current.createShift({
        workplaceId: 3,
        title: 'Opening shift',
        startDatetime: '2026-11-03T08:00:00.000Z',
        endDatetime: '2026-11-03T16:00:00.000Z',
        breakDuration: 30,
        isConfirmed: false,
      });
    });

    expect(activityService.getActivities(12)).toEqual([
      expect.objectContaining({
        action: 'created',
        entity: 'shift',
        title: 'Opening shift',
      }),
    ]);
  });
});
