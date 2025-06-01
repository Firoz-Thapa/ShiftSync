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