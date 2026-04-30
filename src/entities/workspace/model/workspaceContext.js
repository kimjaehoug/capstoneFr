import { createContext, useContext } from 'react';

export const WorkspaceContext = createContext(null);

export function useWorkspaceContext() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  }
  return value;
}
