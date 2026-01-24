/**
 * Price calculation utilities for portfolio management
 */

/**
 * Calculate average buy price after additional purchase
 *
 * Formula: newAvgPrice = (oldAvgPrice * oldQty + newPrice * newQty) / (oldQty + newQty)
 */
export function calculateAverageBuyPrice(
  currentAvgPrice: number,
  currentQuantity: number,
  newPrice: number,
  newQuantity: number
): number {
  const totalQuantity = currentQuantity + newQuantity;
  if (totalQuantity <= 0) return 0;

  return (currentAvgPrice * currentQuantity + newPrice * newQuantity) / totalQuantity;
}

/**
 * Calculate PnL (Profit and Loss)
 */
export function calculatePnL(
  currentPrice: number,
  avgBuyPrice: number,
  quantity: number
): { pnl: number; pnlPercent: number; currentValue: number } {
  const currentValue = currentPrice * quantity;
  const invested = avgBuyPrice * quantity;
  const pnl = currentValue - invested;
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

  return { pnl, pnlPercent, currentValue };
}

/**
 * Format currency (Korean Won)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Calculate holding days from first buy date
 */
export function calculateHoldingDays(firstBuyDate: string): number {
  const buyDate = new Date(firstBuyDate);
  const today = new Date();
  const diffTime = today.getTime() - buyDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse stock symbol to extract code and market
 */
export function parseSymbol(symbol: string): { code: string; market: 'KOSPI' | 'KOSDAQ' } {
  const code = symbol.split('.')[0];
  const suffix = symbol.split('.')[1] || '';
  const market = suffix === 'KQ' ? 'KOSDAQ' : 'KOSPI';
  return { code, market };
}
