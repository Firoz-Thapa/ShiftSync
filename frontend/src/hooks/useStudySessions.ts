import { useState, useEffect } from 'react';
import { StudySession, StudySessionFormData } from '../types';
import { studyService } from '../services/studyService';

export const useStudySessions = (dateRange?: { startDate: string; endDate: string }) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudySessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let data: StudySession[];
      if (dateRange) {
        const response = await studyService.getStudySessions({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 100
        });
        data = response.data;
      } else {
        data = await studyService.getTodayStudySessions();
      }
      
      setStudySessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch study sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const createStudySession = async (data: StudySessionFormData): Promise<StudySession> => {
    try {
      const newSession = await studyService.createStudySession(data);
      setStudySessions(prev => [...prev, newSession]);
      return newSession;
    } catch (err: any) {
      setError(err.message || 'Failed to create study session');
      throw err;
    }
  };

  const updateStudySession = async (id: number, data: Partial<StudySessionFormData>): Promise<StudySession> => {
    try {
      const updatedSession = await studyService.updateStudySession(id, data);
      setStudySessions(prev => 
        prev.map(session => 
          session.id === id ? updatedSession : session
        )
      );
      return updatedSession;
    } catch (err: any) {
      setError(err.message || 'Failed to update study session');
      throw err;
    }
  };

  const deleteStudySession = async (id: number): Promise<void> => {
    try {
      await studyService.deleteStudySession(id);
      setStudySessions(prev => prev.filter(session => session.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete study session');
      throw err;
    }
  };

  const markAsCompleted = async (id: number): Promise<void> => {
    try {
      const completedSession = await studyService.markAsCompleted(id);
      setStudySessions(prev => 
        prev.map(session => 
          session.id === id ? completedSession : session
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to mark as completed');
      throw err;
    }
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