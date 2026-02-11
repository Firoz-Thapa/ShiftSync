import { useState, useEffect } from 'react';
import { StudySession, StudySessionFormData } from '../types';

export const useStudySessions = (dateRange?: { startDate: string; endDate: string }) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudySessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load study sessions from localStorage
      const storedSessions = localStorage.getItem('shiftsync_study_sessions');
      let allSessions: StudySession[] = storedSessions ? JSON.parse(storedSessions) : [];
      
      // Filter by date range if provided
      if (dateRange) {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        
        allSessions = allSessions.filter(session => {
          const sessionDate = new Date(session.startDatetime);
          return sessionDate >= startDate && sessionDate <= endDate;
        });
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStudySessions(allSessions);
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
        isRecurring: data.isRecurring || false,
        recurrencePattern: data.recurrencePattern,
        recurrenceEndDate: data.recurrenceEndDate,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Load existing sessions
      const storedSessions = localStorage.getItem('shiftsync_study_sessions');
      const existingSessions = storedSessions ? JSON.parse(storedSessions) : [];
      
      // Add new session
      const updatedSessions = [...existingSessions, newSession];
      
      // Save to localStorage
      localStorage.setItem('shiftsync_study_sessions', JSON.stringify(updatedSessions));
      
      // Update state
      setStudySessions(prev => [...prev, newSession]);
      
      return newSession;
    } catch (err: any) {
      setError(err.message || 'Failed to create study session');
      throw err;
    }
  };

  const updateStudySession = async (id: number, data: Partial<StudySessionFormData>): Promise<StudySession> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const storedSessions = localStorage.getItem('shiftsync_study_sessions');
      const existingSessions = storedSessions ? JSON.parse(storedSessions) : [];
      
      const index = existingSessions.findIndex((s: StudySession) => s.id === id);
      if (index === -1) {
        throw new Error('Study session not found');
      }
      
      const updatedSession: StudySession = {
        ...existingSessions[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      existingSessions[index] = updatedSession;
      localStorage.setItem('shiftsync_study_sessions', JSON.stringify(existingSessions));
      
      setStudySessions(prev => prev.map(s => s.id === id ? updatedSession : s));
      
      return updatedSession;
    } catch (err: any) {
      setError(err.message || 'Failed to update study session');
      throw err;
    }
  };

  const deleteStudySession = async (id: number): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const storedSessions = localStorage.getItem('shiftsync_study_sessions');
      const existingSessions = storedSessions ? JSON.parse(storedSessions) : [];
      
      const filteredSessions = existingSessions.filter((s: StudySession) => s.id !== id);
      localStorage.setItem('shiftsync_study_sessions', JSON.stringify(filteredSessions));
      
      setStudySessions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete study session');
      throw err;
    }
  };

  const markAsCompleted = async (id: number): Promise<void> => {
    await updateStudySession(id, { isCompleted: true } as any);
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