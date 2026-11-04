import { User, UserRole } from '../types';
import { apiService } from './api';

export interface InviteUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  assignedWorkplaceIds: number[];
}

export interface UserUpdates {
  role?: UserRole;
  status?: User['status'];
  assignedWorkplaceIds?: number[];
}

class UsersService {
  getAll(): Promise<User[]> {
    return apiService.get<User[]>('/users');
  }

  invite(data: InviteUserData): Promise<User> {
    return apiService.post<User>('/users/invite', data);
  }

  resendInvitation(id: number): Promise<User> {
    return apiService.post<User>(`/users/${id}/resend-invitation`);
  }

  update(id: number, updates: UserUpdates): Promise<User> {
    return apiService.put<User>(`/users/${id}`, updates);
  }
}

export const usersService = new UsersService();
