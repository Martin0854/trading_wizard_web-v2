/**
 * PositionCard component displaying a single portfolio position
 */

import type { PortfolioPosition, PositionPnL, SellSignal } from '@trading-wizard/shared-ui/types';
import { formatCurrency, formatPercent, calculateHoldingDays } from '../utils/priceCalculator';

interface PositionCardProps {
  position: PortfolioPosition;
  pnl?: PositionPnL;
  sellSignals?: SellSignal[];
  onSell?: (position: PortfolioPosition) => void;
  onAddBuy?: (position: PortfolioPosition) => void;
}

function PositionCard({
  position,
  pnl,
  sellSignals = [],
  onSell,
  onAddBuy,
}: PositionCardProps) {
  const holdingDays = calculateHoldingDays(position.firstBuyDate);
  const currentPrice = pnl?.currentPrice ?? 0;
  const currentValue = pnl?.currentValue ?? position.totalInvested;
  const pnlAmount = pnl?.pnl ?? 0;
  const pnlPercent = pnl?.pnlPercent ?? 0;
  const isProfitable = pnlAmount >= 0;

  return (
    <div className="position-card">
      <div className="position-header">
        <div className="position-info">
          <h3 className="position-name">{position.stockName}</h3>
          <span className="position-symbol">{position.symbol.split('.')[0]}</span>
        </div>
        {sellSignals.length > 0 && (
          <div className="sell-signals">
            {sellSignals.map((signal) => (
              <span
                key={`${signal.positionId}-${signal.type}`}
                className={`sell-signal-badge ${signal.type}`}
                title={signal.reason}
              >
                {signal.type === 'stop_loss' && '손절매'}
                {signal.type === 'take_profit' && '익절매'}
                {signal.type === 'trend_break' && '추세이탈'}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="position-body">
        <div className="position-row">
          <span className="label">현재가</span>
          <span className="value">{currentPrice > 0 ? formatCurrency(currentPrice) : '-'}</span>
        </div>
        <div className="position-row">
          <span className="label">평균 매수가</span>
          <span className="value">{formatCurrency(position.avgBuyPrice)}</span>
        </div>
        <div className="position-row">
          <span className="label">보유 수량</span>
          <span className="value">{position.quantity.toLocaleString()}주</span>
        </div>
        <div className="position-row">
          <span className="label">평가금액</span>
          <span className="value">{formatCurrency(currentValue)}</span>
        </div>
        <div className="position-row">
          <span className="label">투자금액</span>
          <span className="value">{formatCurrency(position.totalInvested)}</span>
        </div>
        <div className={`position-row pnl ${isProfitable ? 'positive' : 'negative'}`}>
          <span className="label">수익률</span>
          <span className="value">
            {formatPercent(pnlPercent)} ({isProfitable ? '+' : ''}{formatCurrency(pnlAmount)})
          </span>
        </div>
        <div className="position-row">
          <span className="label">보유 기간</span>
          <span className="value">{holdingDays}일</span>
        </div>
      </div>

      <div className="position-actions">
        {onAddBuy && (
          <button className="action-btn buy" onClick={() => onAddBuy(position)}>
            추가 매수
          </button>
        )}
        {onSell && (
          <button className="action-btn sell" onClick={() => onSell(position)}>
            매도 기록
          </button>
        )}
      </div>

      <style>{`
        .position-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .position-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .position-info {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .position-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .position-symbol {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .sell-signals {
          display: flex;
          gap: 0.25rem;
        }

        .sell-signal-badge {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: var(--radius-sm);
          cursor: help;
        }

        .sell-signal-badge.stop_loss {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .sell-signal-badge.take_profit {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .sell-signal-badge.trend_break {
          background-color: #fef3c7;
          color: #d97706;
        }

        .position-body {
          padding: 1rem;
        }

        .position-row {
          display: flex;
          justify-content: space-between;
          padding: 0.375rem 0;
        }

        .position-row .label {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .position-row .value {
          font-weight: 500;
        }

        .position-row.pnl {
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-border);
        }

        .position-row.pnl.positive .value {
          color: var(--color-success);
        }

        .position-row.pnl.negative .value {
          color: var(--color-error);
        }

        .position-actions {
          display: flex;
          border-top: 1px solid var(--color-border);
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .action-btn.buy {
          background-color: var(--color-background);
          color: var(--color-primary);
        }

        .action-btn.buy:hover {
          background-color: #e0e7ff;
        }

        .action-btn.sell {
          background-color: var(--color-background);
          color: var(--color-error);
          border-left: 1px solid var(--color-border);
        }

        .action-btn.sell:hover {
          background-color: #fee2e2;
        }
      `}</style>
    </div>
  );
}

export default PositionCard;
