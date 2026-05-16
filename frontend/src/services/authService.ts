import axios, { AxiosInstance } from 'axios';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';
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
      const response = await this.api.post<AuthResponse>('/auth/login', credentials);
      
      if (response.data.success && response.data.data.token) {
        this.setToken(response.data.data.token);
        // Also store user data for quick access
        localStorage.setItem('shiftsync_user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', data);
      
      if (response.data.success && response.data.data.token) {
        this.setToken(response.data.data.token);
        localStorage.setItem('shiftsync_user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async getProfile(): Promise<User> {
    try {
      const savedUser = localStorage.getItem('shiftsync_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      throw new Error('No user data found');
    } catch (error: any) {
      throw new Error('Failed to get profile');
    }
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