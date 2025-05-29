import { apiService } from './api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.token) {
      localStorage.setItem('shiftsync_token', response.token);
    }
    
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    
    if (response.token) {
      localStorage.setItem('shiftsync_token', response.token);
    }
    
    return response;
  }

  async getProfile(): Promise<User> {
    return apiService.get<User>('/auth/profile');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiService.put<User>('/auth/profile', data);
  }

  logout(): void {
    localStorage.removeItem('shiftsync_token');
  }

  getToken(): string | null {
    return localStorage.getItem('shiftsync_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();

// src/services/workplaceService.ts
import { apiService } from './api';
import { Workplace, WorkplaceFormData, PaginatedResponse, PaginationParams } from '../types';

export class WorkplaceService {
  async getWorkplaces(params?: PaginationParams): Promise<PaginatedResponse<Workplace>> {
    return apiService.get<PaginatedResponse<Workplace>>('/workplaces', params);
  }

  async getWorkplace(id: number): Promise<Workplace> {
    return apiService.get<Workplace>(`/workplaces/${id}`);
  }

  async createWorkplace(data: WorkplaceFormData): Promise<Workplace> {
    return apiService.post<Workplace>('/workplaces', data);
  }

  async updateWorkplace(id: number, data: Partial<WorkplaceFormData>): Promise<Workplace> {
    return apiService.put<Workplace>(`/workplaces/${id}`, data);
  }

  async deleteWorkplace(id: number): Promise<void> {
    return apiService.delete<void>(`/workplaces/${id}`);
  }

  async getUserWorkplaces(): Promise<Workplace[]> {
    const response = await this.getWorkplaces({ limit: 100 });
    return response.data;
  }
}

export const workplaceService = new WorkplaceService();