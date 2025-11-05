import { useState, useEffect } from 'react';
import { Shift, ShiftFormData } from '../types';

export const useShifts = (dateRange?: { startDate: string; endDate: string }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load shifts from localStorage
      const storedShifts = localStorage.getItem('shiftsync_shifts');
      let allShifts: Shift[] = storedShifts ? JSON.parse(storedShifts) : [];
      
      // Filter by date range if provided
      if (dateRange) {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        
        allShifts = allShifts.filter(shift => {
          const shiftDate = new Date(shift.startDatetime);
          return shiftDate >= startDate && shiftDate <= endDate;
        });
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setShifts(allShifts);
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
      
      // Load workplaces from localStorage to get workplace details
      const storedWorkplaces = localStorage.getItem('shiftsync_workplaces');
      const workplaces = storedWorkplaces ? JSON.parse(storedWorkplaces) : [];
      const workplace = workplaces.find((w: any) => w.id === data.workplaceId);
      
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
      
      // Load existing shifts
      const storedShifts = localStorage.getItem('shiftsync_shifts');
      const existingShifts = storedShifts ? JSON.parse(storedShifts) : [];
      
      // Add new shift
      const updatedShifts = [...existingShifts, newShift];
      
      // Save to localStorage
      localStorage.setItem('shiftsync_shifts', JSON.stringify(updatedShifts));
      
      // Update state
      setShifts(prev => [...prev, newShift]);
      
      return newShift;
    } catch (err: any) {
      setError(err.message || 'Failed to create shift');
      throw err;
    }
  };

  const updateShift = async (id: number, data: Partial<ShiftFormData>): Promise<Shift> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const storedShifts = localStorage.getItem('shiftsync_shifts');
      const existingShifts = storedShifts ? JSON.parse(storedShifts) : [];
      
      const index = existingShifts.findIndex((s: Shift) => s.id === id);
      if (index === -1) {
        throw new Error('Shift not found');
      }
      
      const updatedShift: Shift = {
        ...existingShifts[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      existingShifts[index] = updatedShift;
      localStorage.setItem('shiftsync_shifts', JSON.stringify(existingShifts));
      
      setShifts(prev => prev.map(s => s.id === id ? updatedShift : s));
      
      return updatedShift;
    } catch (err: any) {
      setError(err.message || 'Failed to update shift');
      throw err;
    }
  };

  const deleteShift = async (id: number): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const storedShifts = localStorage.getItem('shiftsync_shifts');
      const existingShifts = storedShifts ? JSON.parse(storedShifts) : [];
      
      const filteredShifts = existingShifts.filter((s: Shift) => s.id !== id);
      localStorage.setItem('shiftsync_shifts', JSON.stringify(filteredShifts));
      
      setShifts(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete shift');
      throw err;
    }
  };

  const confirmShift = async (id: number): Promise<void> => {
    await updateShift(id, { isConfirmed: true });
  };

  const clockIn = async (id: number): Promise<void> => {
    // Implementation for clock in functionality
    throw new Error('Not implemented yet');
  };

  const clockOut = async (id: number): Promise<void> => {
    // Implementation for clock out functionality
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