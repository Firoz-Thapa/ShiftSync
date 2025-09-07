import { apiService } from './api';
import { StudySession, StudySessionFormData, PaginatedResponse, PaginationParams } from '../types';

export class StudyService {
  async getStudySessions(params?: PaginationParams & {
    startDate?: string;
    endDate?: string;
    subject?: string;
    sessionType?: string;
    priority?: string;
  }): Promise<PaginatedResponse<StudySession>> {
    return apiService.get<PaginatedResponse<StudySession>>('/study-sessions', params);
  }

  async getStudySession(id: number): Promise<StudySession> {
    return apiService.get<StudySession>(`/study-sessions/${id}`);
  }

  async createStudySession(data: StudySessionFormData): Promise<StudySession> {
    return apiService.post<StudySession>('/study-sessions', data);
  }

  async updateStudySession(id: number, data: Partial<StudySessionFormData>): Promise<StudySession> {
    return apiService.put<StudySession>(`/study-sessions/${id}`, data);
  }

  async deleteStudySession(id: number): Promise<void> {
    return apiService.delete<void>(`/study-sessions/${id}`);
  }

  async markAsCompleted(id: number): Promise<StudySession> {
    return apiService.put<StudySession>(`/study-sessions/${id}/complete`, {});
  }

  async getTodayStudySessions(): Promise<StudySession[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getStudySessions({
      startDate: today,
      endDate: today,
      limit: 50
    });
    return response.data;
  }

  async getUpcomingDeadlines(days: number = 7): Promise<StudySession[]> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    const response = await this.getStudySessions({
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      sessionType: 'exam',
      limit: 20
    });
    return response.data;
  }
}

export const studyService = new StudyService();