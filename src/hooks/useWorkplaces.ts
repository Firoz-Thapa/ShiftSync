import { useState, useEffect } from 'react';
import { Workplace, WorkplaceFormData } from '../types';

// LocalStorage key for persisting workplaces
const STORAGE_KEY = 'shiftsync_workplaces';

// Empty default - no hardcoded workplaces
const DEFAULT_WORKPLACES: Workplace[] = [];

// Helper function to load workplaces from localStorage
const loadWorkplacesFromStorage = (): Workplace[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('📂 Loaded workplaces from localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('❌ Error loading workplaces from localStorage:', error);
  }
  
  // If nothing in storage, return empty array
  console.log('💾 No stored workplaces found, starting fresh with empty array');
  return DEFAULT_WORKPLACES;
};

// Helper function to save workplaces to localStorage
const saveWorkplacesToStorage = (workplaces: Workplace[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workplaces));
    console.log('💾 Saved workplaces to localStorage:', workplaces);
  } catch (error) {
    console.error('❌ Error saving workplaces to localStorage:', error);
  }
};

export const useWorkplaces = () => {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkplaces = async () => {
    try {
      console.log('🔄 fetchWorkplaces called');
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Load from localStorage
      const loadedWorkplaces = loadWorkplacesFromStorage();
      console.log('📦 Setting workplaces state to:', loadedWorkplaces);
      setWorkplaces(loadedWorkplaces);
      
      console.log('✅ Fetched workplaces:', loadedWorkplaces);
    } catch (err: any) {
      console.error('❌ Error fetching workplaces:', err);
      setError(err.message || 'Failed to fetch workplaces');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkplace = async (data: WorkplaceFormData): Promise<Workplace> => {
    try {
      console.log('🏗️ Creating workplace with data:', data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newWorkplace: Workplace = {
        id: Date.now(),
        userId: 1,
        name: data.name,
        color: data.color,
        hourlyRate: data.hourlyRate,
        address: data.address || '',
        contactInfo: data.contactInfo || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Load current workplaces from storage
      const currentWorkplaces = loadWorkplacesFromStorage();
      
      // Add new workplace
      const updatedWorkplaces = [...currentWorkplaces, newWorkplace];
      
      // Save to localStorage
      saveWorkplacesToStorage(updatedWorkplaces);
      
      console.log('✨ New workplace created:', newWorkplace);
      console.log('📊 All workplaces now:', updatedWorkplaces);
      console.log('📊 Length:', updatedWorkplaces.length);
      
      // Update state
      setWorkplaces(updatedWorkplaces);
      
      console.log('✅ Create workplace complete');
      
      return newWorkplace;
    } catch (err: any) {
      console.error('❌ Error creating workplace:', err);
      setError(err.message || 'Failed to create workplace');
      throw err;
    }
  };

  const updateWorkplace = async (id: number, data: Partial<WorkplaceFormData>): Promise<Workplace> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const currentWorkplaces = loadWorkplacesFromStorage();
      const index = currentWorkplaces.findIndex(wp => wp.id === id);
      
      if (index === -1) {
        throw new Error('Workplace not found');
      }
      
      const updatedWorkplace: Workplace = {
        ...currentWorkplaces[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      currentWorkplaces[index] = updatedWorkplace;
      
      // Save to localStorage
      saveWorkplacesToStorage(currentWorkplaces);
      
      // Update state
      setWorkplaces([...currentWorkplaces]);
      
      return updatedWorkplace;
    } catch (err: any) {
      setError(err.message || 'Failed to update workplace');
      throw err;
    }
  };

  const deleteWorkplace = async (id: number): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const currentWorkplaces = loadWorkplacesFromStorage();
      const index = currentWorkplaces.findIndex(wp => wp.id === id);
      
      if (index === -1) {
        throw new Error('Workplace not found');
      }
      
      currentWorkplaces.splice(index, 1);
      
      // Save to localStorage
      saveWorkplacesToStorage(currentWorkplaces);
      
      // Update state
      setWorkplaces([...currentWorkplaces]);
    } catch (err: any) {
      setError(err.message || 'Failed to delete workplace');
      throw err;
    }
  };

  useEffect(() => {
    console.log('🎬 useWorkplaces mounted, calling fetchWorkplaces');
    fetchWorkplaces();
  }, []);

  // Debug log whenever workplaces state changes
  useEffect(() => {
    console.log('🔔 Workplaces state changed:', workplaces);
    console.log('🔔 Workplaces count:', workplaces.length);
  }, [workplaces]);

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