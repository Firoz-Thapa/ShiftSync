import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { Shift } from '../../types';
import { TeamMember, teamService } from '../../services/teamService';
import './AdminDashboard.css';

const readShifts = (): Shift[] => {
  try { return JSON.parse(localStorage.getItem('shiftsync_shifts') ?? '[]') as Shift[]; }
  catch { return []; }
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (user) setMembers(teamService.getMembers(user));
    setShifts(readShifts());
  }, [user]);

  const now = new Date();
  const activeAgents = members.filter(member => member.role === 'agent' && member.status === 'active');
  const workingNow = shifts.filter(shift => shift.actualStartTime && !shift.actualEndTime).length;
  const upcoming = shifts.filter(shift => new Date(shift.startDatetime) > now && new Date(shift.startDatetime).getTime() - now.getTime() < 7 * 86400000).length;
  const unconfirmed = shifts.filter(shift => !shift.isConfirmed && new Date(shift.startDatetime) > now).length;

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard__hero">
        <div>
          <span className="admin-dashboard__eyebrow">Operations overview</span>
          <h1>Keep the team in sync</h1>
          <p>See staffing status, upcoming work, and actions that need attention.</p>
        </div>
        <Link className="admin-dashboard__cta" to={ROUTES.USER_MANAGEMENT}>Manage team</Link>
      </section>

      <section className="admin-dashboard__metrics" aria-label="Team metrics">
        <article><span>Active agents</span><strong>{activeAgents.length}</strong><small>{members.filter(m => m.status === 'invited').length} invitation(s) pending</small></article>
        <article><span>Working now</span><strong>{workingNow}</strong><small>Clocked-in team members</small></article>
        <article><span>Next 7 days</span><strong>{upcoming}</strong><small>Scheduled shifts</small></article>
        <article><span>Needs confirmation</span><strong>{unconfirmed}</strong><small>Future shifts to review</small></article>
      </section>

      <section className="admin-dashboard__panel">
        <div className="admin-dashboard__panel-header">
          <div><h2>Team roster</h2><p>Active agents and their access status.</p></div>
          <Link to={ROUTES.USER_MANAGEMENT}>View all users</Link>
        </div>
        {activeAgents.length ? (
          <ul className="admin-dashboard__roster">
            {activeAgents.slice(0, 5).map(member => <li key={member.id}><span className="admin-dashboard__avatar">{member.firstName.charAt(0)}{member.lastName.charAt(0)}</span><div><strong>{member.firstName} {member.lastName}</strong><span>{member.email}</span></div><em>Active</em></li>)}
          </ul>
        ) : <p className="admin-dashboard__empty">No active agents yet. Invite your first agent to get started.</p>}
      </section>
    </div>
  );
};
