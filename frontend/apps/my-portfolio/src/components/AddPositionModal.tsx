/**
 * AddPositionModal component for adding a new position
 */

import { useState, useEffect } from 'react';
import type { Stock } from '@trading-wizard/shared-ui/types';
import StockSearchInput from './StockSearchInput';
import BuyForm from './BuyForm';

interface AddPositionModalProps {
  onSubmit: (data: {
    stock: Stock;
    price: number;
    quantity: number;
    date: string;
  }) => void;
  onClose: () => void;
}

function AddPositionModal({ onSubmit, onClose }: AddPositionModalProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

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

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleBuySubmit = (data: {
    price: number;
    quantity: number;
    date: string;
  }) => {
    if (!selectedStock) return;
    onSubmit({
      stock: selectedStock,
      ...data,
    });
  };

  const handleBack = () => {
    setSelectedStock(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title">{selectedStock ? '매수 정보 입력' : '종목 추가'}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {!selectedStock ? (
            <div className="stock-search-section">
              <p className="search-instruction">
                추가할 종목을 검색하세요
              </p>
              <StockSearchInput onSelect={handleStockSelect} />
            </div>
          ) : (
            <div className="buy-section">
              <button className="back-btn" onClick={handleBack}>
                &larr; 다른 종목 선택
              </button>
              <BuyForm
                stockName={selectedStock.name}
                onSubmit={handleBuySubmit}
                onCancel={onClose}
              />
            </div>
          )}
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

          .modal-body {
            padding: 1.5rem;
          }

          .stock-search-section {
            min-height: 200px;
          }

          .search-instruction {
            margin-bottom: 1rem;
            color: var(--color-text-secondary);
          }

          .back-btn {
            background: none;
            border: none;
            color: var(--color-primary);
            cursor: pointer;
            padding: 0;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .back-btn:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    </div>
  );
}

export default AddPositionModal;
