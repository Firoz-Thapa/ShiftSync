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
      localStorage.setItem('shiftsync_user', JSON.stringify(response.data.data));
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get profile');
    }
  }

  private saveAuthResponse(response: AxiosResponse<ApiResponse<AuthResponse>>): AuthResponse {
    const result = response.data.data;
    if (!response.data.success || !result?.token || !result.user) {
      throw new Error(response.data.message || 'Authentication response was invalid');
    }

    this.setToken(result.token);
    localStorage.setItem('shiftsync_user', JSON.stringify(result.user));
    return result;
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
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp > currentTime;
      }

      return true;
    } catch (error) {
      return !!token; // Simple fallback
    }
  }
}

export const authService = new AuthService();