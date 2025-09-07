import { apiService } from './api';
import { Shift, ShiftFormData, PaginatedResponse, PaginationParams } from '../types';

export class ShiftService {
  async getShifts(params?: PaginationParams & { 
    startDate?: string; 
    endDate?: string; 
    workplaceId?: number;
  }): Promise<PaginatedResponse<Shift>> {
    return apiService.get<PaginatedResponse<Shift>>('/shifts', params);
  }

  async getShift(id: number): Promise<Shift> {
    return apiService.get<Shift>(`/shifts/${id}`);
  }

  async createShift(data: ShiftFormData): Promise<Shift> {
    return apiService.post<Shift>('/shifts', data);
  }

  async updateShift(id: number, data: Partial<ShiftFormData>): Promise<Shift> {
    return apiService.put<Shift>(`/shifts/${id}`, data);
  }

  async deleteShift(id: number): Promise<void> {
    return apiService.delete<void>(`/shifts/${id}`);
  }

  async confirmShift(id: number): Promise<Shift> {
    return apiService.put<Shift>(`/shifts/${id}/confirm`, {});
  }

  async clockIn(id: number): Promise<Shift> {
    return apiService.put<Shift>(`/shifts/${id}/clock-in`, {});
  }

  async clockOut(id: number): Promise<Shift> {
    return apiService.put<Shift>(`/shifts/${id}/clock-out`, {});
  }

  async getTodayShifts(): Promise<Shift[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getShifts({ 
      startDate: today, 
      endDate: today,
      limit: 50 
    });
    return response.data;
  }

  async getWeekShifts(startDate: string): Promise<Shift[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const response = await this.getShifts({
      startDate,
      endDate: endDate.toISOString().split('T')[0],
      limit: 100
    });
    return response.data;
  }
}

export const shiftService = new ShiftService();