/**
 * Portfolio Zustand Store
 *
 * Manages portfolio positions, trading history, and UI state
 * Persists data to backend via encrypted user data API
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  PortfolioPosition,
  TradingHistory,
  SellSignal,
  PositionPnL,
  DecryptedUserData,
} from '@trading-wizard/shared-ui/types';
import { INITIAL_USER_DATA } from '@trading-wizard/shared-ui/types';
import { loadSession } from '@trading-wizard/shared-ui/services';
import { encrypt, decrypt } from '@trading-wizard/shared-ui/crypto';
import { getUserData, saveUserData } from '../services/api';

interface PortfolioState {
  // Data
  positions: PortfolioPosition[];
  tradingHistory: TradingHistory[];
  sellSignals: SellSignal[];
  positionPnLs: Map<string, PositionPnL>;

  // UI state
  isLoading: boolean;
  isSyncing: boolean;
  isInitialized: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  loadFromServer: () => Promise<void>;
  saveToServer: () => Promise<void>;

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

/**
 * Get password from session's encrypted credentials
 * The encryptedCredentials field stores the password directly for password auth
 */
function getSessionPassword(): string | null {
  const session = loadSession();
  if (!session) return null;

  // For password auth, encryptedCredentials contains the password
  // (stored in sessionStorage during login)
  return session.encryptedCredentials ?? null;
}

/**
 * Debounced save to prevent too many API calls
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 1000;

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  // Initial state
  positions: [],
  tradingHistory: [],
  sellSignals: [],
  positionPnLs: new Map(),
  isLoading: false,
  isSyncing: false,
  isInitialized: false,
  error: null,
  lastUpdated: null,

  // Load data from server
  loadFromServer: async () => {
    const session = loadSession();
    const password = getSessionPassword();

    if (!session || !password) {
      set({ isInitialized: true });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await getUserData(session.userIdHash);
      const decrypted = await decrypt(response.encryptedBlob, password);
      const userData: DecryptedUserData = JSON.parse(decrypted);

      set({
        positions: userData.positions,
        tradingHistory: userData.tradingHistory,
        isLoading: false,
        isInitialized: true,
        lastUpdated: new Date(),
      });
    } catch (error) {
      // 404 means new user, use initial data
      if ((error as { response?: { status?: number } }).response?.status === 404) {
        set({
          positions: INITIAL_USER_DATA.positions,
          tradingHistory: INITIAL_USER_DATA.tradingHistory,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          error: '데이터를 불러오는데 실패했습니다.',
          isLoading: false,
          isInitialized: true,
        });
      }
    }
  },

  // Save data to server (debounced)
  saveToServer: async () => {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Debounce save
    saveTimeout = setTimeout(async () => {
      const session = loadSession();
      const password = getSessionPassword();

      if (!session || !password) {
        return;
      }

      const state = get();
      set({ isSyncing: true });

      try {
        const userData: DecryptedUserData = {
          ...INITIAL_USER_DATA,
          positions: state.positions,
          tradingHistory: state.tradingHistory,
        };

        const encrypted = await encrypt(JSON.stringify(userData), password);
        await saveUserData(session.userIdHash, { encryptedBlob: encrypted });

        set({ isSyncing: false, lastUpdated: new Date() });
      } catch (error) {
        console.error('Failed to save portfolio data:', error);
        set({ isSyncing: false });
      }
    }, SAVE_DEBOUNCE_MS);
  },

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

    // Auto-save to server
    get().saveToServer();

    return newPosition;
  },

  updatePosition: (id, updates) => {
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      lastUpdated: new Date(),
    }));
    get().saveToServer();
  },

  removePosition: (id) => {
    set((state) => ({
      positions: state.positions.filter((p) => p.id !== id),
      lastUpdated: new Date(),
    }));
    get().saveToServer();
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
          type: 'buy' as const,
          price,
          quantity,
          totalAmount: price * quantity,
          tradedAt: date,
          ...(note ? { note } : {}),
        },
      ],
      lastUpdated: new Date(),
    }));
    get().saveToServer();
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
              status: isFulySold ? ('sold' as const) : ('holding' as const),
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
          type: 'sell' as const,
          price,
          quantity,
          totalAmount: price * quantity,
          tradedAt: date,
          ...(note ? { note } : {}),
        },
      ],
      lastUpdated: new Date(),
    }));
    get().saveToServer();
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
