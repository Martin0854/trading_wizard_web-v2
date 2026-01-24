/**
 * SellSignalList component displaying all active sell signals
 */

import { useState } from 'react';
import type { SellSignal, PortfolioPosition } from '@trading-wizard/shared-ui/types';
import SellSignalBadge from './SellSignalBadge';
import SellSignalDetailModal from './SellSignalDetailModal';
import { formatCurrency, formatPercent } from '../utils/priceCalculator';

interface SellSignalListProps {
  signals: SellSignal[];
  positions: PortfolioPosition[];
}

function SellSignalList({ signals, positions }: SellSignalListProps) {
  const [selectedSignal, setSelectedSignal] = useState<SellSignal | null>(null);

  if (signals.length === 0) {
    return null;
  }

  // Get position name for a signal
  const getPositionName = (positionId: string): string => {
    const position = positions.find((p) => p.id === positionId);
    return position?.stockName || '알 수 없음';
  };

  return (
    <>
      <div className="sell-signal-list">
        <h3 className="signal-list-title">
          매도 신호 <span className="signal-count">({signals.length})</span>
        </h3>
        <div className="signal-items">
          {signals.map((signal) => (
            <div
              key={`${signal.positionId}-${signal.type}`}
              className="signal-item"
              onClick={() => setSelectedSignal(signal)}
            >
              <div className="signal-info">
                <span className="signal-stock">{getPositionName(signal.positionId)}</span>
                <SellSignalBadge type={signal.type} />
              </div>
              <div className="signal-details">
                <span className="signal-price">
                  현재가: {formatCurrency(signal.currentPrice)}
                </span>
                <span
                  className={`signal-pnl ${signal.pnlPercent >= 0 ? 'positive' : 'negative'}`}
                >
                  {formatPercent(signal.pnlPercent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSignal && (
        <SellSignalDetailModal
          signal={selectedSignal}
          positionName={getPositionName(selectedSignal.positionId)}
          onClose={() => setSelectedSignal(null)}
        />
      )}

      <style>{`
        .sell-signal-list {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .signal-list-title {
          padding: 1rem;
          margin: 0;
          font-size: 1rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .signal-count {
          color: var(--color-error);
          font-size: 0.875rem;
        }

        .signal-items {
          max-height: 300px;
          overflow-y: auto;
        }

        .signal-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .signal-item:last-child {
          border-bottom: none;
        }

        .signal-item:hover {
          background-color: var(--color-background);
        }

        .signal-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .signal-stock {
          font-weight: 500;
        }

        .signal-details {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .signal-price {
          color: var(--color-text-secondary);
        }

        .signal-pnl {
          font-weight: 500;
        }

        .signal-pnl.positive {
          color: var(--color-success);
        }

        .signal-pnl.negative {
          color: var(--color-error);
        }
      `}</style>
    </>
  );
}

export default SellSignalList;
