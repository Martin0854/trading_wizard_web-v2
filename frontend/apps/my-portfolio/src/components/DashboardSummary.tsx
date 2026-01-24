/**
 * DashboardSummary component showing portfolio totals
 */

import { formatCurrency, formatPercent } from '../utils/priceCalculator';

interface DashboardSummaryProps {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positionCount: number;
}

function DashboardSummary({
  totalInvested,
  totalCurrentValue,
  totalPnl,
  totalPnlPercent,
  positionCount,
}: DashboardSummaryProps) {
  const isProfitable = totalPnl >= 0;

  return (
    <div className="dashboard-summary">
      <div className="summary-card main">
        <div className="summary-label">총 평가금액</div>
        <div className="summary-value large">{formatCurrency(totalCurrentValue)}</div>
        <div className={`summary-change ${isProfitable ? 'positive' : 'negative'}`}>
          {formatPercent(totalPnlPercent)} ({isProfitable ? '+' : ''}{formatCurrency(totalPnl)})
        </div>
      </div>

      <div className="summary-cards-row">
        <div className="summary-card">
          <div className="summary-label">총 투자금액</div>
          <div className="summary-value">{formatCurrency(totalInvested)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">총 수익금</div>
          <div className={`summary-value ${isProfitable ? 'positive' : 'negative'}`}>
            {isProfitable ? '+' : ''}{formatCurrency(totalPnl)}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">보유 종목</div>
          <div className="summary-value">{positionCount}개</div>
        </div>
      </div>

      <style>{`
        .dashboard-summary {
          margin-bottom: 2rem;
        }

        .summary-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
        }

        .summary-card.main {
          margin-bottom: 1rem;
          padding: 1.5rem;
          text-align: center;
        }

        .summary-cards-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .summary-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
        }

        .summary-value {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .summary-value.large {
          font-size: 2rem;
        }

        .summary-value.positive {
          color: var(--color-success);
        }

        .summary-value.negative {
          color: var(--color-error);
        }

        .summary-change {
          font-size: 1rem;
          margin-top: 0.5rem;
        }

        .summary-change.positive {
          color: var(--color-success);
        }

        .summary-change.negative {
          color: var(--color-error);
        }

        @media (max-width: 640px) {
          .summary-cards-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default DashboardSummary;
