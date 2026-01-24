/**
 * PositionList component displaying all portfolio positions
 */

import type { PortfolioPosition, PositionPnL, SellSignal } from '@trading-wizard/shared-ui/types';
import PositionCard from './PositionCard';
import EmptyState from './EmptyState';

interface PositionListProps {
  positions: PortfolioPosition[];
  pnlMap: Map<string, PositionPnL>;
  sellSignals: SellSignal[];
  onSell: (position: PortfolioPosition) => void;
  onAddBuy: (position: PortfolioPosition) => void;
  onAddPosition: () => void;
  showSold?: boolean;
}

function PositionList({
  positions,
  pnlMap,
  sellSignals,
  onSell,
  onAddBuy,
  onAddPosition,
  showSold = false,
}: PositionListProps) {
  // Filter positions by status
  const holdingPositions = positions.filter((p) => p.status === 'holding');
  const soldPositions = positions.filter((p) => p.status === 'sold');

  // Group sell signals by position ID
  const signalsByPosition = sellSignals.reduce<Record<string, SellSignal[]>>(
    (acc, signal) => {
      if (!acc[signal.positionId]) {
        acc[signal.positionId] = [];
      }
      acc[signal.positionId].push(signal);
      return acc;
    },
    {}
  );

  if (holdingPositions.length === 0 && !showSold) {
    return <EmptyState onAction={onAddPosition} />;
  }

  return (
    <div className="position-list">
      {holdingPositions.length > 0 && (
        <section className="position-section">
          <h2 className="section-title">보유 종목 ({holdingPositions.length})</h2>
          <div className="position-grid">
            {holdingPositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                pnl={pnlMap.get(position.id)}
                sellSignals={signalsByPosition[position.id]}
                onSell={onSell}
                onAddBuy={onAddBuy}
              />
            ))}
          </div>
        </section>
      )}

      {showSold && soldPositions.length > 0 && (
        <section className="position-section sold-section">
          <h2 className="section-title">매도 완료 ({soldPositions.length})</h2>
          <div className="position-grid">
            {soldPositions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        </section>
      )}

      <style>{`
        .position-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .position-section {
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--color-text-primary);
        }

        .position-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .sold-section {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

export default PositionList;
