import { create } from 'zustand';

export type ChartType = 'candlestick' | 'line';
export type PriceMode = 'close' | 'adjusted_close';

interface ChartState {
  chartType: ChartType;
  priceMode: PriceMode;
  showVolume: boolean;
  showCrosshair: boolean;
  showGrid: boolean;
  isFullscreen: boolean;

  setChartType: (type: ChartType) => void;
  setPriceMode: (mode: PriceMode) => void;
  setShowVolume: (show: boolean) => void;
  setShowCrosshair: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  toggleVolume: () => void;
  toggleCrosshair: () => void;
  toggleGrid: () => void;
  toggleFullscreen: () => void;
}

export const useChartStore = create<ChartState>((set) => ({
  chartType: 'candlestick',
  priceMode: 'close',
  showVolume: true,
  showCrosshair: true,
  showGrid: true,
  isFullscreen: false,

  setChartType: (chartType) => set({ chartType }),
  setPriceMode: (priceMode) => set({ priceMode }),
  setShowVolume: (showVolume) => set({ showVolume }),
  setShowCrosshair: (showCrosshair) => set({ showCrosshair }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  toggleVolume: () => set((state) => ({ showVolume: !state.showVolume })),
  toggleCrosshair: () => set((state) => ({ showCrosshair: !state.showCrosshair })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
