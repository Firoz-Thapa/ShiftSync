import { User, UserRole, UserStatus } from '../types';

export interface TeamMember extends User {
  assignedWorkplaceIds: number[];
  invitedAt?: string;
}

export interface InviteAgentData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  assignedWorkplaceIds: number[];
}

const TEAM_STORAGE_KEY = 'shiftsync_team_members';

const readMembers = (): TeamMember[] => {
  try {
    return JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY) ?? '[]') as TeamMember[];
  } catch {
    return [];
  }
};

const saveMembers = (members: TeamMember[]) => {
  localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
};

const asMember = (user: User): TeamMember => ({
  ...user,
  role: user.role ?? 'agent',
  status: user.status ?? 'active',
  assignedWorkplaceIds: user.assignedWorkplaceIds ?? [],
});

class TeamService {
  getMembers(currentUser: User): TeamMember[] {
    const members = readMembers();
    const currentMember = asMember(currentUser);
    const currentIndex = members.findIndex(member => member.id === currentUser.id);

    if (currentIndex === -1) {
      members.unshift(currentMember);
      saveMembers(members);
    } else {
      members[currentIndex] = { ...members[currentIndex], ...currentMember };
      saveMembers(members);
    }

    return members;
  }

  invite(data: InviteAgentData): TeamMember {
    const members = readMembers();
    if (members.some(member => member.email.toLowerCase() === data.email.trim().toLowerCase())) {
      throw new Error('A user with this email already exists.');
    }

    const timestamp = new Date().toISOString();
    const member: TeamMember = {
      id: Date.now(),
      email: data.email.trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: data.role,
      status: 'invited',
      assignedWorkplaceIds: data.assignedWorkplaceIds,
      createdAt: timestamp,
      updatedAt: timestamp,
      invitedAt: timestamp,
    };
    saveMembers([...members, member]);
    return member;
  }

  updateMember(id: number, updates: Partial<Pick<TeamMember, 'role' | 'status' | 'assignedWorkplaceIds'>>): TeamMember {
    const members = readMembers();
    const index = members.findIndex(member => member.id === id);
    if (index === -1) throw new Error('User not found.');
    members[index] = { ...members[index], ...updates, updatedAt: new Date().toISOString() };
    saveMembers(members);
    return members[index];
  }
}

export const teamService = new TeamService();
