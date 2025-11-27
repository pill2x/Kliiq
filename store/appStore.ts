import { create } from 'zustand';

interface Installation {
  id: string;
  name: string;
  version: string;
  status: 'installed' | 'updating' | 'broken';
  progress: number;
}

interface AppStore {
  installations: Installation[];
  isLoading: boolean;
  error: string | null;
  setInstallations: (installations: Installation[]) => void;
  addInstallation: (installation: Installation) => void;
  updateInstallation: (id: string, updates: Partial<Installation>) => void;
  removeInstallation: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  installations: [],
  isLoading: false,
  error: null,

  setInstallations: (installations) => set({ installations }),

  addInstallation: (installation) =>
    set((state) => ({
      installations: [...state.installations, installation],
    })),

  updateInstallation: (id, updates) =>
    set((state) => ({
      installations: state.installations.map((inst) =>
        inst.id === id ? { ...inst, ...updates } : inst
      ),
    })),

  removeInstallation: (id) =>
    set((state) => ({
      installations: state.installations.filter((inst) => inst.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
