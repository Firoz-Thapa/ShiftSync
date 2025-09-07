import { useAuth as useAuthContext } from '../contexts/SimpleAuthContext';

export const useAuth = () => {
  return useAuthContext();
};