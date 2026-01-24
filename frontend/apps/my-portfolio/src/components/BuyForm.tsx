/**
 * BuyForm component for entering purchase details
 */

import { useState } from 'react';
import { getTodayString } from '../utils/priceCalculator';

interface BuyFormProps {
  stockName?: string;
  onSubmit: (data: { price: number; quantity: number; date: string }) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

function BuyForm({
  stockName,
  onSubmit,
  onCancel,
  submitLabel = '매수 기록',
}: BuyFormProps) {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(getTodayString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('올바른 매수가를 입력하세요.');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('올바른 수량을 입력하세요.');
      return;
    }

    onSubmit({ price: priceNum, quantity: quantityNum, date });
  };

  const totalAmount = (parseFloat(price) || 0) * (parseInt(quantity, 10) || 0);

  return (
    <form className="buy-form" onSubmit={handleSubmit}>
      {stockName && (
        <div className="buy-form-header">
          <span className="buy-form-stock-name">{stockName}</span>
        </div>
      )}

      <div className="buy-form-field">
        <label htmlFor="price">매수가 (원)</label>
        <input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          min="1"
          required
        />
      </div>

      <div className="buy-form-field">
        <label htmlFor="quantity">수량 (주)</label>
        <input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          min="1"
          step="1"
          required
        />
      </div>

      <div className="buy-form-field">
        <label htmlFor="date">매수일</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={getTodayString()}
          required
        />
      </div>

      {totalAmount > 0 && (
        <div className="buy-form-total">
          <span>총 매수금액</span>
          <span className="buy-form-total-amount">
            {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
          </span>
        </div>
      )}

      <div className="buy-form-actions">
        {onCancel && (
          <button type="button" className="buy-form-cancel" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="buy-form-submit">
          {submitLabel}
        </button>
      </div>

      <style>{`
        .buy-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .buy-form-header {
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .buy-form-stock-name {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .buy-form-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .buy-form-field label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .buy-form-field input {
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 1rem;
        }

        .buy-form-field input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .buy-form-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background-color: var(--color-background);
          border-radius: var(--radius-md);
        }

        .buy-form-total-amount {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .buy-form-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .buy-form-cancel {
          flex: 1;
          padding: 0.75rem;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 1rem;
          cursor: pointer;
        }

        .buy-form-submit {
          flex: 1;
          padding: 0.75rem;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
        }

        .buy-form-submit:hover {
          background-color: var(--color-primary-dark);
        }
      `}</style>
    </form>
  );
}

export default BuyForm;
