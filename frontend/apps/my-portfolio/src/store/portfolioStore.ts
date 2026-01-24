/**
 * Portfolio Zustand Store
 *
 * Manages portfolio positions, trading history, and UI state
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  PortfolioPosition,
  TradingHistory,
  SellSignal,
  PositionPnL,
} from '@trading-wizard/shared-ui/types';

interface PortfolioState {
  // Data
  positions: PortfolioPosition[];
  tradingHistory: TradingHistory[];
  sellSignals: SellSignal[];
  positionPnLs: Map<string, PositionPnL>;

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  setPositions: (positions: PortfolioPosition[]) => void;
  addPosition: (position: Omit<PortfolioPosition, 'id' | 'totalInvested' | 'status'>) => PortfolioPosition;
  updatePosition: (id: string, updates: Partial<PortfolioPosition>) => void;
  removePosition: (id: string) => void;

  addBuy: (
    positionId: string,
    price: number,
    quantity: number,
    date: string,
    note?: string
  ) => void;

  sellPosition: (
    positionId: string,
    price: number,
    quantity: number,
    date: string,
    note?: string
  ) => void;

  setTradingHistory: (history: TradingHistory[]) => void;
  setSellSignals: (signals: SellSignal[]) => void;
  setPositionPnLs: (pnls: PositionPnL[]) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Calculate average buy price after additional purchase
 */
function calculateNewAvgPrice(
  currentAvgPrice: number,
  currentQuantity: number,
  newPrice: number,
  newQuantity: number
): number {
  const totalQuantity = currentQuantity + newQuantity;
  if (totalQuantity === 0) return 0;
  return (currentAvgPrice * currentQuantity + newPrice * newQuantity) / totalQuantity;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  // Initial state
  positions: [],
  tradingHistory: [],
  sellSignals: [],
  positionPnLs: new Map(),
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Position actions
  setPositions: (positions) => set({ positions, lastUpdated: new Date() }),

  addPosition: (positionData) => {
    const newPosition: PortfolioPosition = {
      ...positionData,
      id: uuidv4(),
      totalInvested: positionData.avgBuyPrice * positionData.quantity,
      status: 'holding',
    };

    const history: TradingHistory = {
      id: uuidv4(),
      positionId: newPosition.id,
      symbol: newPosition.symbol,
      type: 'buy',
      price: newPosition.avgBuyPrice,
      quantity: newPosition.quantity,
      totalAmount: newPosition.totalInvested,
      tradedAt: newPosition.firstBuyDate,
    };

    set((state) => ({
      positions: [...state.positions, newPosition],
      tradingHistory: [...state.tradingHistory, history],
      lastUpdated: new Date(),
    }));

    return newPosition;
  },

  updatePosition: (id, updates) => {
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      lastUpdated: new Date(),
    }));
  },

  removePosition: (id) => {
    set((state) => ({
      positions: state.positions.filter((p) => p.id !== id),
      lastUpdated: new Date(),
    }));
  },

  addBuy: (positionId, price, quantity, date, note) => {
    const state = get();
    const position = state.positions.find((p) => p.id === positionId);

    if (!position) return;

    // Calculate new average price
    const newAvgPrice = calculateNewAvgPrice(
      position.avgBuyPrice,
      position.quantity,
      price,
      quantity
    );
    const newQuantity = position.quantity + quantity;
    const newTotalInvested = newAvgPrice * newQuantity;

    // Update position
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === positionId
          ? {
              ...p,
              avgBuyPrice: newAvgPrice,
              quantity: newQuantity,
              totalInvested: newTotalInvested,
              lastBuyDate: date,
            }
          : p
      ),
      tradingHistory: [
        ...state.tradingHistory,
        {
          id: uuidv4(),
          positionId,
          symbol: position.symbol,
          type: 'buy',
          price,
          quantity,
          totalAmount: price * quantity,
          tradedAt: date,
          note,
        },
      ],
      lastUpdated: new Date(),
    }));
  },

  sellPosition: (positionId, price, quantity, date, note) => {
    const state = get();
    const position = state.positions.find((p) => p.id === positionId);

    if (!position) return;

    const remainingQuantity = position.quantity - quantity;
    const isFulySold = remainingQuantity <= 0;

    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === positionId
          ? {
              ...p,
              quantity: Math.max(0, remainingQuantity),
              status: isFulySold ? 'sold' : 'holding',
              soldPrice: price,
              soldDate: date,
              soldQuantity: (p.soldQuantity || 0) + quantity,
            }
          : p
      ),
      tradingHistory: [
        ...state.tradingHistory,
        {
          id: uuidv4(),
          positionId,
          symbol: position.symbol,
          type: 'sell',
          price,
          quantity,
          totalAmount: price * quantity,
          tradedAt: date,
          note,
        },
      ],
      lastUpdated: new Date(),
    }));
  },

  // History and signals
  setTradingHistory: (history) => set({ tradingHistory: history }),
  setSellSignals: (signals) => set({ sellSignals: signals }),
  setPositionPnLs: (pnls) => {
    const pnlMap = new Map(pnls.map((p) => [p.id, p]));
    set({ positionPnLs: pnlMap, lastUpdated: new Date() });
  },

  // UI state
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
