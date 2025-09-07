import { useState, useEffect } from 'react';
import { Workplace, WorkplaceFormData } from '../types';

// Mock data for development
const mockWorkplaces: Workplace[] = [
  {
    id: 1,
    userId: 1,
    name: 'Campus Coffee',
    color: '#3498db',
    hourlyRate: 15.50,
    address: '123 University Ave',
    contactInfo: 'manager@campuscoffee.com',
    notes: 'Flexible hours, great team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    name: 'Local Bookstore',
    color: '#2ecc71',
    hourlyRate: 14.00,
    address: '456 Main St',
    contactInfo: '(555) 123-4567',
    notes: 'Quiet environment, perfect for studying',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const useWorkplaces = () => {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkplaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setWorkplaces(mockWorkplaces);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workplaces');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkplace = async (data: WorkplaceFormData): Promise<Workplace> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newWorkplace: Workplace = {
        id: Date.now(),
        userId: 1,
        name: data.name,
        color: data.color,
        hourlyRate: data.hourlyRate,
        address: data.address,
        contactInfo: data.contactInfo,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setWorkplaces(prev => [...prev, newWorkplace]);
      return newWorkplace;
    } catch (err: any) {
      setError(err.message || 'Failed to create workplace');
      throw err;
    }
  };

  const updateWorkplace = async (id: number, data: Partial<WorkplaceFormData>): Promise<Workplace> => {
    throw new Error('Not implemented yet');
  };

  const deleteWorkplace = async (id: number): Promise<void> => {
    throw new Error('Not implemented yet');
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