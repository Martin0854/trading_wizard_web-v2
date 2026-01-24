/**
 * SellModal component for recording a sale
 */

import { useState, useEffect } from 'react';
import type { PortfolioPosition } from '@trading-wizard/shared-ui/types';
import { formatCurrency, getTodayString } from '../utils/priceCalculator';

interface SellModalProps {
  position: PortfolioPosition;
  currentPrice?: number;
  onSubmit: (data: { price: number; quantity: number; date: string }) => void;
  onClose: () => void;
}

function SellModal({ position, currentPrice, onSubmit, onClose }: SellModalProps) {
  const [price, setPrice] = useState(currentPrice?.toString() || '');
  const [quantity, setQuantity] = useState(position.quantity.toString());
  const [date, setDate] = useState(getTodayString());

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('올바른 매도가를 입력하세요.');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('올바른 수량을 입력하세요.');
      return;
    }

    if (quantityNum > position.quantity) {
      alert('보유 수량보다 많이 매도할 수 없습니다.');
      return;
    }

    onSubmit({ price: priceNum, quantity: quantityNum, date });
  };

  const sellAmount = (parseFloat(price) || 0) * (parseInt(quantity, 10) || 0);
  const investedAmount = position.avgBuyPrice * (parseInt(quantity, 10) || 0);
  const pnl = sellAmount - investedAmount;
  const pnlPercent = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="sell-modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="sell-modal-title">매도 기록</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="position-info">
          <div className="position-info-name">{position.stockName}</div>
          <div className="position-info-details">
            <span>보유 수량: {position.quantity}주</span>
            <span>평균 매수가: {formatCurrency(position.avgBuyPrice)}</span>
          </div>
        </div>

        <form className="sell-form" onSubmit={handleSubmit}>
          <div className="sell-form-field">
            <label htmlFor="sellPrice">매도가 (원)</label>
            <input
              id="sellPrice"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="1"
              required
            />
          </div>

          <div className="sell-form-field">
            <label htmlFor="sellQuantity">매도 수량 (주)</label>
            <input
              id="sellQuantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min="1"
              max={position.quantity}
              step="1"
              required
            />
            <button
              type="button"
              className="sell-all-btn"
              onClick={() => setQuantity(position.quantity.toString())}
            >
              전량 매도
            </button>
          </div>

          <div className="sell-form-field">
            <label htmlFor="sellDate">매도일</label>
            <input
              id="sellDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayString()}
              required
            />
          </div>

          {sellAmount > 0 && (
            <div className="sell-summary">
              <div className="sell-summary-row">
                <span>매도 금액</span>
                <span>{formatCurrency(sellAmount)}</span>
              </div>
              <div className="sell-summary-row">
                <span>투자 원금</span>
                <span>{formatCurrency(investedAmount)}</span>
              </div>
              <div
                className={`sell-summary-row sell-pnl ${
                  pnl >= 0 ? 'positive' : 'negative'
                }`}
              >
                <span>예상 손익</span>
                <span>
                  {pnl >= 0 ? '+' : ''}
                  {formatCurrency(pnl)} ({pnlPercent >= 0 ? '+' : ''}
                  {pnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          <div className="sell-form-actions">
            <button type="button" className="sell-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="sell-submit">
              매도 기록
            </button>
          </div>
        </form>

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
            max-width: 400px;
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

          .position-info {
            padding: 1rem 1.5rem;
            background-color: var(--color-background);
          }

          .position-info-name {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
          }

          .position-info-details {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            color: var(--color-text-secondary);
          }

          .sell-form {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .sell-form-field {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .sell-form-field label {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
          }

          .sell-form-field input {
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 1rem;
          }

          .sell-form-field input:focus {
            outline: none;
            border-color: var(--color-primary);
          }

          .sell-all-btn {
            align-self: flex-start;
            margin-top: 0.25rem;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            background-color: var(--color-background);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            cursor: pointer;
          }

          .sell-summary {
            padding: 1rem;
            background-color: var(--color-background);
            border-radius: var(--radius-md);
          }

          .sell-summary-row {
            display: flex;
            justify-content: space-between;
            padding: 0.25rem 0;
          }

          .sell-pnl {
            font-weight: 600;
            padding-top: 0.5rem;
            margin-top: 0.5rem;
            border-top: 1px solid var(--color-border);
          }

          .sell-pnl.positive {
            color: var(--color-success);
          }

          .sell-pnl.negative {
            color: var(--color-error);
          }

          .sell-form-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }

          .sell-cancel {
            flex: 1;
            padding: 0.75rem;
            background-color: var(--color-background);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 1rem;
            cursor: pointer;
          }

          .sell-submit {
            flex: 1;
            padding: 0.75rem;
            background-color: var(--color-error);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
          }

          .sell-submit:hover {
            opacity: 0.9;
          }
        `}</style>
      </div>
    </div>
  );
}

export default SellModal;
