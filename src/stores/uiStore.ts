import { create } from 'zustand';

interface UIState {
  isDistractionFreeMode: boolean;
  setDistractionFreeMode: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isDistractionFreeMode: false,
  setDistractionFreeMode: (enabled: boolean) => set({ isDistractionFreeMode: enabled }),
}));
