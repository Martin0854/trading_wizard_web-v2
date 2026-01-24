/**
 * PortfolioAllocation component showing position weights
 */

import type { PortfolioPosition, PositionPnL } from '@trading-wizard/shared-ui/types';
import { formatPercent } from '../utils/priceCalculator';

interface PortfolioAllocationProps {
  positions: PortfolioPosition[];
  pnlMap: Map<string, PositionPnL>;
}

// Colors for the bar segments
const COLORS = [
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#ea580c', // orange
  '#16a34a', // green
  '#0891b2', // cyan
  '#4f46e5', // indigo
  '#c026d3', // fuchsia
];

function PortfolioAllocation({ positions, pnlMap }: PortfolioAllocationProps) {
  // Calculate total value
  const holdingPositions = positions.filter((p) => p.status === 'holding');

  if (holdingPositions.length === 0) {
    return null;
  }

  const positionsWithValue = holdingPositions.map((p) => {
    const pnl = pnlMap.get(p.id);
    const currentValue = pnl?.currentValue ?? p.totalInvested;
    return {
      ...p,
      currentValue,
    };
  });

  const totalValue = positionsWithValue.reduce((sum, p) => sum + p.currentValue, 0);

  // Sort by value descending
  const sortedPositions = [...positionsWithValue].sort(
    (a, b) => b.currentValue - a.currentValue
  );

  return (
    <div className="portfolio-allocation">
      <h3 className="allocation-title">종목별 비중</h3>

      <div className="allocation-bar">
        {sortedPositions.map((position, index) => {
          const percentage = totalValue > 0 ? (position.currentValue / totalValue) * 100 : 0;
          return (
            <div
              key={position.id}
              className="allocation-segment"
              style={{
                width: `${percentage}%`,
                backgroundColor: COLORS[index % COLORS.length],
              }}
              title={`${position.stockName}: ${percentage.toFixed(1)}%`}
            />
          );
        })}
      </div>

      <div className="allocation-legend">
        {sortedPositions.map((position, index) => {
          const percentage = totalValue > 0 ? (position.currentValue / totalValue) * 100 : 0;
          return (
            <div key={position.id} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="legend-name">{position.stockName}</span>
              <span className="legend-percent">{formatPercent(percentage, 1).replace('+', '')}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .portfolio-allocation {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .allocation-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .allocation-bar {
          display: flex;
          height: 24px;
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .allocation-segment {
          transition: opacity 0.2s;
          cursor: pointer;
        }

        .allocation-segment:hover {
          opacity: 0.8;
        }

        .allocation-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.5rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .legend-name {
          color: var(--color-text-secondary);
        }

        .legend-percent {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default PortfolioAllocation;
