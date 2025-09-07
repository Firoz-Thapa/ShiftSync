import { useState, useEffect } from 'react';
import { StudySession, StudySessionFormData } from '../types';

// Mock data for development
const mockStudySessions: StudySession[] = [
  {
    id: 1,
    userId: 1,
    title: 'Database Systems Review',
    subject: 'Computer Science',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T14:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T16:00:00'),
    location: 'Library Room 201',
    sessionType: 'study_group',
    priority: 'high',
    isCompleted: false,
    notes: 'Prepare for midterm exam',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    title: 'Math Assignment',
    subject: 'Mathematics',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T19:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T21:00:00'),
    location: 'Home',
    sessionType: 'assignment',
    priority: 'medium',
    isCompleted: true,
    notes: 'Calculus homework due tomorrow',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const useStudySessions = (dateRange?: { startDate: string; endDate: string }) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudySessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setStudySessions(mockStudySessions);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch study sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const createStudySession = async (data: StudySessionFormData): Promise<StudySession> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newSession: StudySession = {
        id: Date.now(),
        userId: 1,
        title: data.title,
        subject: data.subject,
        startDatetime: data.startDatetime,
        endDatetime: data.endDatetime,
        location: data.location,
        sessionType: data.sessionType || 'other',
        priority: data.priority || 'medium',
        isCompleted: false,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setStudySessions(prev => [...prev, newSession]);
      return newSession;
    } catch (err: any) {
      setError(err.message || 'Failed to create study session');
      throw err;
    }
  };

  const updateStudySession = async (id: number, data: Partial<StudySessionFormData>): Promise<StudySession> => {
    throw new Error('Not implemented yet');
  };

  const deleteStudySession = async (id: number): Promise<void> => {
    throw new Error('Not implemented yet');
  };

  const markAsCompleted = async (id: number): Promise<void> => {
    throw new Error('Not implemented yet');
  };

  useEffect(() => {
    fetchStudySessions();
  }, [dateRange?.startDate, dateRange?.endDate]);

  return {
    studySessions,
    isLoading,
    error,
    fetchStudySessions,
    createStudySession,
    updateStudySession,
    deleteStudySession,
    markAsCompleted,
  };
};