/**
 * StockCard component.
 *
 * Displays stock information in a card format.
 */

import React from 'react';
import type { Stock } from '../types/models';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export interface StockCardProps {
  /** Stock data to display */
  stock: Stock;
  /** Optional confidence score (0-100) */
  confidenceScore?: number;
  /** Optional click handler */
  onClick?: () => void;
  /** Show detailed view */
  detailed?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  confidenceScore,
  onClick,
  detailed = false,
  className = '',
}) => {
  const isPositive = (stock.changePercent ?? 0) >= 0;
  const changeColor = isPositive ? colors.bullish : colors.bearish;

  const containerStyle: React.CSSProperties = {
    backgroundColor: colors.background.paper,
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    boxShadow: shadows.sm,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  };

  const symbolStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  };

  const priceStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'right',
  };

  const changeStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: changeColor,
    textAlign: 'right',
    marginTop: spacing[1],
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: `${spacing[1]} ${spacing[2]}`,
    backgroundColor: colors.primary.main + '20',
    color: colors.primary.dark,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  };

  const confidenceStyle: React.CSSProperties = {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTop: `1px solid ${colors.border.light}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatChange = (percent: number): string => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  return (
    <div
      style={containerStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = shadows.md;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.sm;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div style={headerStyle}>
        <div>
          <div style={symbolStyle}>{stock.symbol.split('.')[0]}</div>
          <div style={nameStyle}>{stock.name}</div>
        </div>
        <div>
          <div style={priceStyle}>₩{formatPrice(stock.currentPrice)}</div>
          {stock.changePercent !== undefined && (
            <div style={changeStyle}>{formatChange(stock.changePercent)}</div>
          )}
        </div>
      </div>

      <div>
        <span style={badgeStyle}>{stock.market}</span>
      </div>

      {detailed && stock.volume !== undefined && (
        <div style={{ marginTop: spacing[2], color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
          거래량: {new Intl.NumberFormat('ko-KR').format(stock.volume)}
        </div>
      )}

      {confidenceScore !== undefined && (
        <div style={confidenceStyle}>
          <span style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            신뢰도 점수
          </span>
          <span style={{
            fontWeight: typography.fontWeight.bold,
            color: confidenceScore >= 70 ? colors.success.main :
                   confidenceScore >= 55 ? colors.warning.main : colors.text.secondary
          }}>
            {confidenceScore.toFixed(1)}점
          </span>
        </div>
      )}
    </div>
  );
};

export default StockCard;
