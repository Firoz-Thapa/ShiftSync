import { useState, useEffect } from 'react';
import { Workplace, WorkplaceFormData } from '../types';
import { workplaceService } from '../services/workplaceService';

export const useWorkplaces = () => {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkplaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await workplaceService.getUserWorkplaces();
      setWorkplaces(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workplaces');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkplace = async (data: WorkplaceFormData): Promise<Workplace> => {
    try {
      const newWorkplace = await workplaceService.createWorkplace(data);
      setWorkplaces(prev => [...prev, newWorkplace]);
      return newWorkplace;
    } catch (err: any) {
      setError(err.message || 'Failed to create workplace');
      throw err;
    }
  };

  const updateWorkplace = async (id: number, data: Partial<WorkplaceFormData>): Promise<Workplace> => {
    try {
      const updatedWorkplace = await workplaceService.updateWorkplace(id, data);
      setWorkplaces(prev => 
        prev.map(workplace => 
          workplace.id === id ? updatedWorkplace : workplace
        )
      );
      return updatedWorkplace;
    } catch (err: any) {
      setError(err.message || 'Failed to update workplace');
      throw err;
    }
  };

  const deleteWorkplace = async (id: number): Promise<void> => {
    try {
      await workplaceService.deleteWorkplace(id);
      setWorkplaces(prev => prev.filter(workplace => workplace.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete workplace');
      throw err;
    }
  };

  useEffect(() => {
    fetchWorkplaces();
  }, []);

  return {
    workplaces,
    isLoading,
    error,
    fetchWorkplaces,
    createWorkplace,
    updateWorkplace,
    deleteWorkplace,
  };
};