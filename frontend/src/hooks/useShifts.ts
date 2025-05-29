import { useState, useEffect } from 'react';
import { Shift, ShiftFormData } from '../types';
import { shiftService } from '../services/shiftService';

export const useShifts = (dateRange?: { startDate: string; endDate: string }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let data: Shift[];
      if (dateRange) {
        const response = await shiftService.getShifts({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 100
        });
        data = response.data;
      } else {
        data = await shiftService.getTodayShifts();
      }
      
      setShifts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shifts');
    } finally {
      setIsLoading(false);
    }
  };

  const createShift = async (data: ShiftFormData): Promise<Shift> => {
    try {
      const newShift = await shiftService.createShift(data);
      setShifts(prev => [...prev, newShift]);
      return newShift;
    } catch (err: any) {
      setError(err.message || 'Failed to create shift');
      throw err;
    }
  };

  const updateShift = async (id: number, data: Partial<ShiftFormData>): Promise<Shift> => {
    try {
      const updatedShift = await shiftService.updateShift(id, data);
      setShifts(prev => 
        prev.map(shift => 
          shift.id === id ? updatedShift : shift
        )
      );
      return updatedShift;
    } catch (err: any) {
      setError(err.message || 'Failed to update shift');
      throw err;
    }
  };

  const deleteShift = async (id: number): Promise<void> => {
    try {
      await shiftService.deleteShift(id);
      setShifts(prev => prev.filter(shift => shift.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete shift');
      throw err;
    }
  };

  const confirmShift = async (id: number): Promise<void> => {
    try {
      const confirmedShift = await shiftService.confirmShift(id);
      setShifts(prev => 
        prev.map(shift => 
          shift.id === id ? confirmedShift : shift
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to confirm shift');
      throw err;
    }
  };

  const clockIn = async (id: number): Promise<void> => {
    try {
      const updatedShift = await shiftService.clockIn(id);
      setShifts(prev => 
        prev.map(shift => 
          shift.id === id ? updatedShift : shift
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to clock in');
      throw err;
    }
  };

  const clockOut = async (id: number): Promise<void> => {
    try {
      const updatedShift = await shiftService.clockOut(id);
      setShifts(prev => 
        prev.map(shift => 
          shift.id === id ? updatedShift : shift
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to clock out');
      throw err;
    }
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