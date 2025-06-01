import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple initialization - check localStorage for a token
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('shiftsync_token');
        const savedUser = localStorage.getItem('shiftsync_user');
        
        if (token && savedUser) {
          // If we have a token and user data, set the user
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('shiftsync_token');
        localStorage.removeItem('shiftsync_user');
      } finally {
        setIsLoading(false);
      }
    };

    // Simulate a brief loading period
    setTimeout(initializeAuth, 500);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      // Mock login - in a real app this would call your API
      const mockUser: User = {
        id: 1,
        email: credentials.email,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage (mock token and user)
      localStorage.setItem('shiftsync_token', 'mock-jwt-token');
      localStorage.setItem('shiftsync_user', JSON.stringify(mockUser));
      
      setUser(mockUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      // Mock register
      const mockUser: User = {
        id: 1,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('shiftsync_token', 'mock-jwt-token');
      localStorage.setItem('shiftsync_user', JSON.stringify(mockUser));
      
      setUser(mockUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('shiftsync_token');
    localStorage.removeItem('shiftsync_user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};