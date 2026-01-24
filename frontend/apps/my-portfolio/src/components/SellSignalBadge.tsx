/**
 * SellSignalBadge component for displaying sell signal type
 */

import type { SellSignalType } from '@trading-wizard/shared-ui/types';

interface SellSignalBadgeProps {
  type: SellSignalType;
  reason?: string;
  onClick?: () => void;
}

const SIGNAL_CONFIG: Record<SellSignalType, { label: string; className: string }> = {
  stop_loss: { label: '손절매', className: 'badge-stop-loss' },
  take_profit: { label: '익절매', className: 'badge-take-profit' },
  trend_break: { label: '추세이탈', className: 'badge-trend-break' },
};

function SellSignalBadge({ type, reason, onClick }: SellSignalBadgeProps) {
  const config = SIGNAL_CONFIG[type];

  return (
    <>
      <span
        className={`sell-signal-badge ${config.className}`}
        title={reason}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {config.label}
      </span>

      <style>{`
        .sell-signal-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: var(--radius-sm);
          cursor: ${onClick ? 'pointer' : 'default'};
        }

        .badge-stop-loss {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .badge-take-profit {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .badge-trend-break {
          background-color: #fef3c7;
          color: #d97706;
        }

        .sell-signal-badge:hover {
          opacity: ${onClick ? 0.8 : 1};
        }
      `}</style>
    </>
  );
}

export default SellSignalBadge;
