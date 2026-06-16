import { useState, useEffect } from 'react';
import { Notice, CreateNoticeData } from '../types';

const STORAGE_KEY = 'shiftsync_notices';

const loadNoticesFromStorage = (): Notice[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('📂 Loaded notices from localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('❌ Error loading notices from localStorage:', error);
  }
  return [];
};

const saveNoticesToStorage = (notices: Notice[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
    console.log('💾 Saved notices to localStorage:', notices);
  } catch (error) {
    console.error('❌ Error saving notices to localStorage:', error);
  }
};

export const useNotices = (workplaceId: number) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = async () => {
    try {
      console.log('🔄 fetchNotices called for workplace:', workplaceId);
      setIsLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Load from localStorage
      const allNotices = loadNoticesFromStorage();
      const workplaceNotices = allNotices
        .filter(n => n.workplaceId === workplaceId)
        .sort((a, b) => {
          // Sort by pinned first, then by date descending
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      console.log('📦 Setting notices state to:', workplaceNotices);
      setNotices(workplaceNotices);
      console.log('✅ Fetched notices:', workplaceNotices);
    } catch (err: any) {
      console.error('❌ Error fetching notices:', err);
      setError(err.message || 'Failed to fetch notices');
    } finally {
      setIsLoading(false);
    }
  };

  const createNotice = async (data: CreateNoticeData): Promise<Notice> => {
    try {
      console.log('🏗️ Creating notice with data:', data);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const newNotice: Notice = {
        id: Date.now(),
        workplaceId,
        createdByUserId: 1,
        createdByUserName: 'Current User',
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        attachments: [],
        isPinned: data.isPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Load current notices from storage
      const currentNotices = loadNoticesFromStorage();

      // Add new notice
      const updatedNotices = [...currentNotices, newNotice];

      // Save to localStorage
      saveNoticesToStorage(updatedNotices);

      // Update local state
      setNotices(prev => {
        const updated = [...prev, newNotice];
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });

      console.log('✅ Notice created:', newNotice);
      return newNotice;
    } catch (err: any) {
      console.error('❌ Error creating notice:', err);
      throw err;
    }
  };

  const updateNotice = async (
    id: number,
    data: Partial<CreateNoticeData>
  ): Promise<Notice> => {
    try {
      console.log('✏️ Updating notice:', id, data);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load current notices from storage
      const currentNotices = loadNoticesFromStorage();
      const noticeIndex = currentNotices.findIndex(n => n.id === id);

      if (noticeIndex === -1) {
        throw new Error('Notice not found');
      }

      const updatedNotice: Notice = {
        ...currentNotices[noticeIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };

      currentNotices[noticeIndex] = updatedNotice;
      saveNoticesToStorage(currentNotices);

      // Update local state
      setNotices(prev => {
        const updated = prev.map(n => (n.id === id ? updatedNotice : n));
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });

      console.log('✅ Notice updated:', updatedNotice);
      return updatedNotice;
    } catch (err: any) {
      console.error('❌ Error updating notice:', err);
      throw err;
    }
  };

  const deleteNotice = async (id: number) => {
    try {
      console.log('🗑️ Deleting notice:', id);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load current notices from storage
      const currentNotices = loadNoticesFromStorage();
      const filteredNotices = currentNotices.filter(n => n.id !== id);

      // Save to localStorage
      saveNoticesToStorage(filteredNotices);

      // Update local state
      setNotices(prev => prev.filter(n => n.id !== id));

      console.log('✅ Notice deleted');
    } catch (err: any) {
      console.error('❌ Error deleting notice:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [workplaceId]);

  return {
    notices,
    isLoading,
    error,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice
  };
};
