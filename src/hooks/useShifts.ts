import { useState, useEffect } from 'react';
import { Shift, ShiftFormData } from '../types';

// Mock data for development
const mockWorkplaces: any[] = [
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

const mockShifts: Shift[] = [
  {
    id: 1,
    userId: 1,
    workplaceId: 1,
    workplace: mockWorkplaces[0],
    title: 'Morning Shift',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T09:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T17:00:00'),
    breakDuration: 30,
    notes: 'Regular morning shift',
    isConfirmed: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    workplaceId: 2,
    workplace: mockWorkplaces[1],
    title: 'Evening Shift',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T18:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T22:00:00'),
    breakDuration: 15,
    notes: 'Evening shift at bookstore',
    isConfirmed: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const useShifts = (dateRange?: { startDate: string; endDate: string }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setShifts(mockShifts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shifts');
    } finally {
      setIsLoading(false);
    }
  };

  const createShift = async (data: ShiftFormData): Promise<Shift> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const workplace = mockWorkplaces.find(w => w.id === data.workplaceId);
      
      const newShift: Shift = {
        id: Date.now(),
        userId: 1,
        workplaceId: data.workplaceId,
        workplace: workplace,
        title: data.title,
        startDatetime: data.startDatetime,
        endDatetime: data.endDatetime,
        breakDuration: data.breakDuration || 0,
        notes: data.notes,
        isConfirmed: data.isConfirmed || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setShifts(prev => [...prev, newShift]);
      return newShift;
    } catch (err: any) {
      setError(err.message || 'Failed to create shift');
      throw err;
    }
  };

  const updateShift = async (id: number, data: Partial<ShiftFormData>): Promise<Shift> => {
    throw new Error('Not implemented yet');
  };

  const deleteShift = async (id: number): Promise<void> => {
    throw new Error('Not implemented yet');
  };

  const confirmShift = async (id: number): Promise<void> => {
    throw new Error('Not implemented yet');
  };

  const clockIn = async (id: number): Promise<void> => {
    throw new Error('Not implemented yet');
  };

  const clockOut = async (id: number): Promise<void> => {
    throw new Error('Not implemented yet');
  };

  useEffect(() => {
    fetchShifts();
  }, [dateRange?.startDate, dateRange?.endDate]);

  return {
    shifts,
    isLoading,
    error,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    confirmShift,
    clockIn,
    clockOut,
  };
};