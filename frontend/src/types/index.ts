export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workplace {
  id: number;
  userId: number;
  name: string;
  color: string;
  hourlyRate: number;
  address?: string;
  contactInfo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: number;
  userId: number;
  workplaceId: number;
  workplace?: Workplace;
  title: string;
  startDatetime: string;
  endDatetime: string;
  breakDuration: number;
  notes?: string;
  isConfirmed: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: number;
  userId: number;
  title: string;
  subject?: string;
  startDatetime: string;
  endDatetime: string;
  location?: string;
  sessionType: SessionType;
  priority: Priority;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SessionType = 'lecture' | 'exam' | 'assignment' | 'study_group' | 'lab' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimeLog {
  id: number;
  userId: number;
  shiftId?: number;
  studySessionId?: number;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  earnings?: number;
  productivityRating?: number;
  notes?: string;
  createdAt: string;
}

// src/types/auth.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Form types
export interface ShiftFormData {
  workplaceId: number;
  title: string;
  startDatetime: string;
  endDatetime: string;
  breakDuration: number;
  notes?: string;
  isConfirmed: boolean;
}

export interface WorkplaceFormData {
  name: string;
  color: string;
  hourlyRate: number;
  address?: string;
  contactInfo?: string;
  notes?: string;
}

export interface StudySessionFormData {
  title: string;
  subject?: string;
  startDatetime: string;
  endDatetime: string;
  location?: string;
  sessionType: SessionType;
  priority: Priority;
  notes?: string;
}