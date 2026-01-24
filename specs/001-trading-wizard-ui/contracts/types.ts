/**
 * Trading Wizard Shared Types
 *
 * 이 파일은 프론트엔드와 백엔드 간 공유되는 타입 정의입니다.
 * contracts/openapi.yaml과 동기화되어야 합니다.
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
  symbol: string;        // 예: "005930.KS"
  name: string;          // 예: "삼성전자"
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
  widthMA: number;       // width의 이동평균
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
  volumeRatio: number;   // 당일 거래량 / 20일 평균 거래량
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

// ============================================================
// Validation Helpers
// ============================================================

export function isValidSymbol(symbol: string): boolean {
  return /^[0-9]{6}\.(KS|KQ)$/.test(symbol);
}

export function isValidUserIdHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

export function validateDailyFocusSettings(settings: Partial<DailyFocusSettings>): string[] {
  const errors: string[] = [];

  if (settings.bollingerPeriod !== undefined) {
    if (settings.bollingerPeriod < 5 || settings.bollingerPeriod > 50) {
      errors.push('볼린저 기간은 5-50 범위여야 합니다.');
    }
  }

  if (settings.bollingerStdDev !== undefined) {
    if (settings.bollingerStdDev < 0.5 || settings.bollingerStdDev > 3.0) {
      errors.push('표준편차 배수는 0.5-3.0 범위여야 합니다.');
    }
  }

  if (settings.confidenceThreshold !== undefined) {
    if (settings.confidenceThreshold < 0 || settings.confidenceThreshold > 100) {
      errors.push('신뢰도 임계값은 0-100 범위여야 합니다.');
    }
  }

  return errors;
}

export function validatePortfolioSettings(settings: Partial<PortfolioSettings>): string[] {
  const errors: string[] = [];

  if (settings.stopLossPct !== undefined) {
    if (settings.stopLossPct < -20 || settings.stopLossPct > 0) {
      errors.push('손절매 기준은 -20% ~ 0% 범위여야 합니다.');
    }
  }

  if (settings.takeProfitPct !== undefined) {
    if (settings.takeProfitPct < 0 || settings.takeProfitPct > 100) {
      errors.push('익절매 기준은 0% ~ 100% 범위여야 합니다.');
    }
  }

  return errors;
}
