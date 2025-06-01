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