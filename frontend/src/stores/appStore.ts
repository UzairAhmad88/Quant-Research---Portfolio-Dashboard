import { create } from "zustand";

type AppState = {
  selectedSymbols: string[];
  setSelectedSymbols: (symbols: string[]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedSymbols: [],
  setSelectedSymbols: (selectedSymbols) => set({ selectedSymbols }),
}));
