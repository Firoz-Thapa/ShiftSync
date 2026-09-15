import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Workplace } from '../../types';
import { InviteAgentData, TeamMember, teamService } from '../../services/teamService';
import './UserManagement.css';

const getWorkplaces = (): Workplace[] => {
  try { return JSON.parse(localStorage.getItem('shiftsync_workplaces') ?? '[]') as Workplace[]; }
  catch { return []; }
};

const initialInvite: InviteAgentData = { firstName: '', lastName: '', email: '', role: 'agent', assignedWorkplaceIds: [] };

export const UserManagement = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [invite, setInvite] = useState<InviteAgentData>(initialInvite);
  const [message, setMessage] = useState<string | null>(null);
  const activeAdminCount = useMemo(() => members.filter(member => member.role === 'admin' && member.status === 'active').length, [members]);

  const refresh = () => { if (user) setMembers(teamService.getMembers(user)); };
  useEffect(() => { refresh(); setWorkplaces(getWorkplaces()); }, [user]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const updateMember = (id: number, updates: Partial<Pick<TeamMember, 'role' | 'status' | 'assignedWorkplaceIds'>>) => {
    const member = members.find(item => item.id === id);
    if (!member) return;
    if (member.role === 'admin' && member.status === 'active' && activeAdminCount === 1 && (updates.role === 'agent' || updates.status === 'deactivated')) {
      setMessage('Keep at least one active admin on the team.');
      return;
    }
    teamService.updateMember(id, updates);
    refresh();
    setMessage('User updated.');
  };

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    try {
      teamService.invite(invite);
      setInvite(initialInvite);
      refresh();
      setMessage('Invitation created. It will be sent when the API is connected.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create invitation.'); }
  };

  const toggleWorkplace = (id: number) => setInvite(current => ({ ...current, assignedWorkplaceIds: current.assignedWorkplaceIds.includes(id) ? current.assignedWorkplaceIds.filter(workplaceId => workplaceId !== id) : [...current.assignedWorkplaceIds, id] }));

  return <div className="user-management">
    <header className="user-management__header"><div><span>Administration</span><h1>Team members</h1><p>Invite people, control access, and assign workplaces.</p></div></header>
    {message && <div className="user-management__message" role="status">{message}</div>}
    <div className="user-management__layout">
      <section className="user-management__table-card"><div className="user-management__card-heading"><h2>Users</h2><span>{members.length} total</span></div>
        <div className="user-management__table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Workplaces</th><th>Status</th><th>Access</th></tr></thead><tbody>
          {members.map(member => {
            const isCurrentUser = member.id === user.id;
            return <tr key={member.id}><td><strong>{member.firstName} {member.lastName}{isCurrentUser ? ' (you)' : ''}</strong><small>{member.email}</small></td><td><select disabled={isCurrentUser} aria-label={`Role for ${member.email}`} value={member.role} onChange={event => updateMember(member.id, { role: event.target.value as TeamMember['role'] })}><option value="agent">Agent</option><option value="admin">Admin</option></select></td><td>{member.assignedWorkplaceIds.length ? `${member.assignedWorkplaceIds.length} assigned` : '—'}</td><td><span className={`user-management__status user-management__status--${member.status}`}>{member.status}</span></td><td>{isCurrentUser ? <span>Current user</span> : member.status === 'deactivated' ? <button onClick={() => updateMember(member.id, { status: 'active' })}>Reactivate</button> : <button className="user-management__danger" onClick={() => updateMember(member.id, { status: 'deactivated' })}>Deactivate</button>}</td></tr>;
          })}
          {!members.length && <tr><td colSpan={5}>No team members have been added.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="user-management__invite-card"><div className="user-management__card-heading"><h2>Invite a team member</h2><span>Access begins after acceptance</span></div><form onSubmit={submitInvite}>
        <label>First name<input required value={invite.firstName} onChange={event => setInvite({ ...invite, firstName: event.target.value })} /></label><label>Last name<input required value={invite.lastName} onChange={event => setInvite({ ...invite, lastName: event.target.value })} /></label><label>Email<input required type="email" value={invite.email} onChange={event => setInvite({ ...invite, email: event.target.value })} /></label><label>Role<select value={invite.role} onChange={event => setInvite({ ...invite, role: event.target.value as InviteAgentData['role'] })}><option value="agent">Agent</option><option value="admin">Admin</option></select></label>
        <fieldset><legend>Workplace access</legend>{workplaces.length ? workplaces.map(workplace => <label className="user-management__check" key={workplace.id}><input type="checkbox" checked={invite.assignedWorkplaceIds.includes(workplace.id)} onChange={() => toggleWorkplace(workplace.id)} />{workplace.name}</label>) : <p>Create workplaces first, then assign them here.</p>}</fieldset>
        <button className="user-management__invite-button" type="submit">Create invitation</button>
      </form></section>
    </div>
  </div>;
};
