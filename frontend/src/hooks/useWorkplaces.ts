import { useState, useEffect } from 'react';
import { Workplace, WorkplaceFormData } from '../types';

// Move mock data OUTSIDE and make it truly persistent using a module-level variable
let persistentWorkplaces: Workplace[] = [
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
      console.log('🔄 fetchWorkplaces called'); // Debug log
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create a new array reference to trigger React update
      const newWorkplaces = [...persistentWorkplaces];
      console.log('📦 Setting workplaces state to:', newWorkplaces); // Debug log
      setWorkplaces(newWorkplaces);
      
      console.log('✅ Fetched workplaces:', persistentWorkplaces); // Debug log
    } catch (err: any) {
      console.error('❌ Error fetching workplaces:', err);
      setError(err.message || 'Failed to fetch workplaces');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkplace = async (data: WorkplaceFormData): Promise<Workplace> => {
    try {
      console.log('🏗️ Creating workplace with data:', data); // Debug log
      
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
      
      // Add to persistent array
      persistentWorkplaces.push(newWorkplace);
      
      console.log('✨ New workplace created:', newWorkplace); // Debug log
      console.log('📊 All workplaces now:', persistentWorkplaces); // Debug log
      console.log('📊 Length:', persistentWorkplaces.length); // Debug log
      
      // Update state with new array reference - CRITICAL for React to detect change
      const updatedWorkplaces = [...persistentWorkplaces];
      console.log('🔄 Setting workplaces state after create:', updatedWorkplaces); // Debug log
      setWorkplaces(updatedWorkplaces);
      
      // Double-check state was set
      console.log('✅ Create workplace complete'); // Debug log
      
      return newWorkplace;
    } catch (err: any) {
      console.error('❌ Error creating workplace:', err); // Debug log
      setError(err.message || 'Failed to create workplace');
      throw err;
    }
  };

  const updateWorkplace = async (id: number, data: Partial<WorkplaceFormData>): Promise<Workplace> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = persistentWorkplaces.findIndex(wp => wp.id === id);
      if (index === -1) {
        throw new Error('Workplace not found');
      }
      
      const updatedWorkplace: Workplace = {
        ...persistentWorkplaces[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      persistentWorkplaces[index] = updatedWorkplace;
      setWorkplaces([...persistentWorkplaces]);
      
      return updatedWorkplace;
    } catch (err: any) {
      setError(err.message || 'Failed to update workplace');
      throw err;
    }
  };

  const deleteWorkplace = async (id: number): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = persistentWorkplaces.findIndex(wp => wp.id === id);
      if (index === -1) {
        throw new Error('Workplace not found');
      }
      
      persistentWorkplaces.splice(index, 1);
      setWorkplaces([...persistentWorkplaces]);
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