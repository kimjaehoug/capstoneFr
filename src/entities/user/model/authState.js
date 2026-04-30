import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuthContext() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return value;
}
