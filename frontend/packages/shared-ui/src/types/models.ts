/**
 * Trading Wizard Shared Types
 *
 * This file contains shared type definitions between frontend and backend.
 * Synced with contracts/types.ts and shared/types/models.py.
 */

// ============================================================
// Common Types
// ============================================================

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// ============================================================
// Stock Types
// ============================================================

export type Market = 'KOSPI' | 'KOSDAQ';

export interface Stock {
  symbol: string;        // e.g., "005930.KS"
  name: string;          // e.g., "삼성전자"
  market: Market;
  currentPrice: number;
  previousClose?: number;
  changePercent?: number;
  volume?: number;
  updatedAt?: string;    // ISO 8601 datetime
}

export interface StockListResponse {
  stocks: Stock[];
  updatedAt: string;
}

export interface StockSearchResponse {
  results: Stock[];
  total: number;
}

export interface StockPriceResponse {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  updatedAt: string;
}

// ============================================================
// Technical Indicators Types
// ============================================================

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  width: number;         // (upper - lower) / middle * 100
  widthMA: number;       // Moving average of width
  isInSqueeze: boolean;  // width < widthMA * 0.55
  isExpanding: boolean;  // width[today] > width[yesterday]
}

export interface MACDIndicator {
  macd: number;          // EMA(12) - EMA(26)
  signal: number;        // EMA(9) of MACD
  histogram: number;     // macd - signal
}

export interface TechnicalIndicators {
  bollinger: BollingerBands;
  rsi: number;           // 0-100
  macd: MACDIndicator;
  volumeRatio: number;   // Today's volume / 20-day average volume
  isCorrectionTrend: boolean;
  calculatedAt: string;
}

// ============================================================
// Daily Focus Types
// ============================================================

export interface BuyRecommendation {
  symbol: string;
  stock: Stock;
  confidenceScore: number;  // 0-100
  signalReason: string;
  indicators: TechnicalIndicators;
  generatedAt: string;
}

export interface BuyRecommendationListResponse {
  recommendations: BuyRecommendation[];
  totalScanned: number;
  generatedAt: string;
  parameters: {
    bollingerPeriod: number;
    bollingerStdDev: number;
    confidenceThreshold: number;
  };
}

export interface PriceHistoryItem {
  date: string;  // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockDetailResponse {
  stock: Stock;
  indicators: TechnicalIndicators;
  recommendation?: BuyRecommendation;
  priceHistory: PriceHistoryItem[];
}

// ============================================================
// Strategy Settings Types
// ============================================================

export interface DailyFocusSettings {
  // Bollinger Band
  bollingerPeriod: number;      // default: 12
  bollingerStdDev: number;      // default: 1.3

  // Squeeze Detection
  squeezeThresholdPct: number;  // default: 55
  squeezeLookbackDays: number;  // default: 5
  bbWidthMAPeriod: number;      // default: 10

  // Signal Filtering
  confidenceThreshold: number;  // default: 55

  // RSI
  rsiPeriod: number;            // default: 14

  // MACD
  macdFast: number;             // default: 12
  macdSlow: number;             // default: 26
  macdSignal: number;           // default: 9

  // Volume
  volumeAvgPeriod: number;      // default: 20

  // Trend Detection
  trendLookbackDays: number;    // default: 20
  trendBelowMaThreshold: number; // default: 15
  trendMaSlopeLookback: number; // default: 10
}

export interface PortfolioSettings {
  stopLossPct: number;          // default: -4.5
  takeProfitPct: number;        // default: 12.0
  sellOnMiddleBand: boolean;    // default: false
  bollingerPeriod: number;      // default: 12
  bollingerStdDev: number;      // default: 1.3
}

// Default values
export const DEFAULT_DAILY_FOCUS_SETTINGS: DailyFocusSettings = {
  bollingerPeriod: 12,
  bollingerStdDev: 1.3,
  squeezeThresholdPct: 55,
  squeezeLookbackDays: 5,
  bbWidthMAPeriod: 10,
  confidenceThreshold: 55,
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  volumeAvgPeriod: 20,
  trendLookbackDays: 20,
  trendBelowMaThreshold: 15,
  trendMaSlopeLookback: 10,
};

export const DEFAULT_PORTFOLIO_SETTINGS: PortfolioSettings = {
  stopLossPct: -4.5,
  takeProfitPct: 12.0,
  sellOnMiddleBand: false,
  bollingerPeriod: 12,
  bollingerStdDev: 1.3,
};

// ============================================================
// Portfolio Types
// ============================================================

export type PositionStatus = 'holding' | 'sold';

export interface PortfolioPosition {
  id: string;              // UUID
  symbol: string;
  stockName: string;
  avgBuyPrice: number;
  quantity: number;
  totalInvested: number;
  firstBuyDate: string;    // YYYY-MM-DD
  lastBuyDate: string;     // YYYY-MM-DD
  status: PositionStatus;
  soldPrice?: number;
  soldDate?: string;
  soldQuantity?: number;
}

export interface PositionWithPnL extends PortfolioPosition {
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
}

export type SellSignalType = 'stop_loss' | 'take_profit' | 'trend_break';

export interface SellRecommendation {
  positionId: string;
  type: SellSignalType;
  reason: string;
  currentPnlPct: number;
  triggerValue: number;
  generatedAt: string;
}

export interface TradingHistory {
  id: string;
  positionId: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  totalAmount: number;
  tradedAt: string;
  note?: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface PositionInput {
  id: string;
  symbol: string;
  avgBuyPrice: number;
  quantity: number;
}

export interface SellSignalRequest {
  positions: PositionInput[];
  settings?: Partial<PortfolioSettings>;
}

export interface SellSignal {
  positionId: string;
  type: SellSignalType;
  reason: string;
  currentPrice: number;
  pnlPercent: number;
  triggerValue: number;
}

export interface SellSignalListResponse {
  signals: SellSignal[];
  calculatedAt: string;
}

export interface PnLCalculationRequest {
  positions: PositionInput[];
}

export interface PositionPnL {
  id: string;
  symbol: string;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface PnLCalculationResponse {
  positions: PositionPnL[];
  summary: {
    totalInvested: number;
    totalCurrentValue: number;
    totalPnl: number;
    totalPnlPercent: number;
  };
  calculatedAt: string;
}

// ============================================================
// User Data Types (Client-Side)
// ============================================================

export interface DecryptedUserData {
  version: number;
  dailyFocusSettings: DailyFocusSettings;
  portfolioSettings: PortfolioSettings;
  positions: PortfolioPosition[];
  tradingHistory: TradingHistory[];
}

export const INITIAL_USER_DATA: DecryptedUserData = {
  version: 1,
  dailyFocusSettings: DEFAULT_DAILY_FOCUS_SETTINGS,
  portfolioSettings: DEFAULT_PORTFOLIO_SETTINGS,
  positions: [],
  tradingHistory: [],
};

// ============================================================
// User Data Types (Server-Side)
// ============================================================

export interface UserDataResponse {
  userIdHash: string;
  encryptedBlob: string;  // Base64
  updatedAt: string;
}

export interface UserDataSaveRequest {
  encryptedBlob: string;  // Base64
}
