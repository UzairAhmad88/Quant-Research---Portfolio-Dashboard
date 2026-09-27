import { create } from 'zustand';

export interface ResearchContextState {
  selectedSymbol: string | null;
  selectedInstrumentId: string | null;
  selectedPortfolioId: string | null;
  selectedStrategyId: string | null;
  selectedBacktestId: string | null;

  // Actions
  setSelectedSymbol: (symbol: string | null) => void;
  setSelectedInstrumentId: (id: string | null) => void;
  setSelectedPortfolioId: (id: string | null) => void;
  setSelectedStrategyId: (id: string | null) => void;
  setSelectedBacktestId: (id: string | null) => void;
  setResearchContext: (params: {
    symbol?: string | null;
    instrumentId?: string | null;
    portfolioId?: string | null;
    strategyId?: string | null;
    backtestId?: string | null;
  }) => void;
}

export const useResearchContextStore = create<ResearchContextState>((set) => ({
  selectedSymbol: null,
  selectedInstrumentId: null,
  selectedPortfolioId: null,
  selectedStrategyId: null,
  selectedBacktestId: null,

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setSelectedInstrumentId: (id) => set({ selectedInstrumentId: id }),
  setSelectedPortfolioId: (id) => set({ selectedPortfolioId: id }),
  setSelectedStrategyId: (id) => set({ selectedStrategyId: id }),
  setSelectedBacktestId: (id) => set({ selectedBacktestId: id }),
  setResearchContext: (params) =>
    set((state) => ({
      selectedSymbol: params.symbol !== undefined ? params.symbol : state.selectedSymbol,
      selectedInstrumentId: params.instrumentId !== undefined ? params.instrumentId : state.selectedInstrumentId,
      selectedPortfolioId: params.portfolioId !== undefined ? params.portfolioId : state.selectedPortfolioId,
      selectedStrategyId: params.strategyId !== undefined ? params.strategyId : state.selectedStrategyId,
      selectedBacktestId: params.backtestId !== undefined ? params.backtestId : state.selectedBacktestId,
    })),
}));
