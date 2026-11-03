import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { activityService } from '../services/activityService';
import { ActivityLog } from './ActivityLog';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 12 } }),
}));

describe('ActivityLog', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('shiftsync_user', JSON.stringify({ id: 12 }));
  });

  it('shows recorded events and filters them by search', () => {
    activityService.recordActivity('created', 'shift', 'Morning shift');
    activityService.recordActivity('completed', 'study_session', 'Biology review');

    render(<ActivityLog />);

    expect(screen.getByText('Morning shift')).toBeInTheDocument();
    expect(screen.getByText('Biology review')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search activity' }), {
      target: { value: 'biology' },
    });

    expect(screen.getByText('Biology review')).toBeInTheDocument();
    expect(screen.queryByText('Morning shift')).not.toBeInTheDocument();
  });

  it('shows an empty state when no activities have been recorded', () => {
    render(<ActivityLog />);

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });
});
