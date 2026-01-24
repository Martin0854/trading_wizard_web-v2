/**
 * SellSignalDetailModal component showing detailed sell signal information
 */

import { useEffect } from 'react';
import type { SellSignal } from '@trading-wizard/shared-ui/types';
import SellSignalBadge from './SellSignalBadge';
import { formatCurrency, formatPercent } from '../utils/priceCalculator';

interface SellSignalDetailModalProps {
  signal: SellSignal;
  positionName: string;
  onClose: () => void;
}

const SIGNAL_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  stop_loss: {
    title: '손절매 추천',
    description:
      '현재 손실률이 손절매 기준을 초과했습니다. 추가 손실을 방지하기 위해 매도를 고려하세요.',
  },
  take_profit: {
    title: '익절매 추천',
    description:
      '목표 수익률에 도달했습니다. 이익을 실현하기 위해 매도를 고려하세요.',
  },
  trend_break: {
    title: '추세 이탈 신호',
    description:
      '현재가가 볼린저 밴드 중심선을 하향 돌파했습니다. 상승 추세가 약화될 수 있습니다.',
  },
};

function SellSignalDetailModal({
  signal,
  positionName,
  onClose,
}: SellSignalDetailModalProps) {
  const config = SIGNAL_DESCRIPTIONS[signal.type];

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="signal-modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="signal-modal-title">{config.title}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="signal-header">
            <span className="stock-name">{positionName}</span>
            <SellSignalBadge type={signal.type} />
          </div>

          <p className="signal-description">{config.description}</p>

          <div className="signal-details">
            <div className="detail-row">
              <span className="detail-label">현재가</span>
              <span className="detail-value">
                {formatCurrency(signal.currentPrice)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">현재 수익률</span>
              <span
                className={`detail-value ${
                  signal.pnlPercent >= 0 ? 'positive' : 'negative'
                }`}
              >
                {formatPercent(signal.pnlPercent)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">기준값</span>
              <span className="detail-value">
                {signal.type === 'trend_break'
                  ? formatCurrency(signal.triggerValue)
                  : `${signal.triggerValue}%`}
              </span>
            </div>
          </div>

          <div className="signal-reason">
            <h4>신호 발생 사유</h4>
            <p>{signal.reason}</p>
          </div>

          <div className="disclaimer">
            <strong>주의:</strong> 이 신호는 참고용이며 투자 결정은 본인의 판단으로 하시기 바랍니다.
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background-color: var(--color-surface);
            border-radius: var(--radius-lg);
            width: 100%;
            max-width: 440px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--color-border);
          }

          .modal-header h2 {
            font-size: 1.25rem;
            margin: 0;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--color-text-secondary);
          }

          .modal-body {
            padding: 1.5rem;
          }

          .signal-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }

          .stock-name {
            font-size: 1.25rem;
            font-weight: 600;
          }

          .signal-description {
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }

          .signal-details {
            background-color: var(--color-background);
            border-radius: var(--radius-md);
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
          }

          .detail-row:not(:last-child) {
            border-bottom: 1px solid var(--color-border);
          }

          .detail-label {
            color: var(--color-text-secondary);
          }

          .detail-value {
            font-weight: 500;
          }

          .detail-value.positive {
            color: var(--color-success);
          }

          .detail-value.negative {
            color: var(--color-error);
          }

          .signal-reason {
            margin-bottom: 1.5rem;
          }

          .signal-reason h4 {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
            margin-bottom: 0.5rem;
          }

          .signal-reason p {
            margin: 0;
            line-height: 1.6;
          }

          .disclaimer {
            padding: 0.75rem;
            background-color: #fef3c7;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            color: #92400e;
          }

          .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--color-border);
          }

          .close-btn {
            width: 100%;
            padding: 0.75rem;
            background-color: var(--color-primary);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
          }

          .close-btn:hover {
            background-color: var(--color-primary-dark);
          }
        `}</style>
      </div>
    </div>
  );
}

export default SellSignalDetailModal;
