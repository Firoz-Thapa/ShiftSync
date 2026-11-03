import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginCredentials, RegisterData, AuthResponse, User, ApiResponse } from '../types';
import { APP_CONFIG } from '../constants';

class AuthService {
  private api: AxiosInstance;
  private tokenKey = 'shiftsync_token';

  constructor() {
    this.api = axios.create({
      baseURL: APP_CONFIG.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return this.saveAuthResponse(response);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      return this.saveAuthResponse(response);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/auth/me');
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }

      const normalizedUser = this.normalizeUser(response.data.data);
      localStorage.setItem('shiftsync_user', JSON.stringify(normalizedUser));
      return normalizedUser;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get profile');
    }
  }

  private saveAuthResponse(response: AxiosResponse<ApiResponse<AuthResponse>>): AuthResponse {
    const result = response.data.data;
    if (!response.data.success || !result?.token || !result.user) {
      throw new Error(response.data.message || 'Authentication response was invalid');
    }

    const normalizedUser = this.normalizeUser(result.user);
    const normalizedResult: AuthResponse = {
      ...result,
      user: normalizedUser,
    };

    this.setToken(normalizedResult.token);
    localStorage.setItem('shiftsync_user', JSON.stringify(normalizedResult.user));
    return normalizedResult;
  }

  private normalizeUser(user: any): User {
    if (!user) {
      return user;
    }

    return {
      ...user,
      id: user.id ?? user.Id ?? 0,
      email: user.email ?? user.Email ?? '',
      firstName: user.firstName ?? user.FirstName ?? '',
      lastName: user.lastName ?? user.LastName ?? '',
      role: user.role ?? user.Role ?? 'agent',
      status: user.status ?? user.Status ?? 'active',
      assignedWorkplaceIds: user.assignedWorkplaceIds ?? user.AssignedWorkplaceIds ?? [],
      createdAt: user.createdAt ?? user.CreatedAt ?? new Date().toISOString(),
      updatedAt: user.updatedAt ?? user.UpdatedAt ?? new Date().toISOString(),
    };
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('shiftsync_user');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      if (token.includes('.')) {
        const payload = this.decodeJwtPayload(token);
        if (!payload || typeof payload.exp !== 'number') {
          return !!token;
        }

        const currentTime = Date.now() / 1000;
        return payload.exp > currentTime;
      }

      return true;
    } catch (error) {
      return !!token;
    }
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) {
        return null;
      }

      const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const normalized = atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('');

      return JSON.parse(decodeURIComponent(normalized));
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();