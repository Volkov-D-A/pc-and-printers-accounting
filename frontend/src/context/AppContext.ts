import { createContext, useContext } from 'react';
import type { DataStore } from '../types';

interface AppContextType {
  data: DataStore | null;
  editMode: boolean;
  reloadData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  data: null,
  editMode: false,
  reloadData: async () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
