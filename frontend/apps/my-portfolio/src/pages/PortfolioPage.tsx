/**
 * PortfolioPage - Main portfolio management page
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortfolioStore } from '../store/portfolioStore';
import { fetchSellSignals, calculatePnL, getErrorMessage } from '../services/api';
import type { Stock, PortfolioPosition, PortfolioSettings } from '@trading-wizard/shared-ui/types';
import PositionList from '../components/PositionList';
import AddPositionModal from '../components/AddPositionModal';
import SellModal from '../components/SellModal';
import DashboardSummary from '../components/DashboardSummary';
import PortfolioAllocation from '../components/PortfolioAllocation';
import SellSignalList from '../components/SellSignalList';

// Default portfolio settings
const DEFAULT_SETTINGS: PortfolioSettings = {
  stopLossPct: -4.5,
  takeProfitPct: 12.0,
  sellOnMiddleBand: false,
  bollingerPeriod: 12,
  bollingerStdDev: 1.3,
};

function PortfolioPage() {
  const {
    positions,
    positionPnLs,
    sellSignals,
    isLoading,
    error,
    addPosition,
    addBuy,
    sellPosition,
    setSellSignals,
    setPositionPnLs,
    setLoading,
    setError,
  } = usePortfolioStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [sellModalPosition, setSellModalPosition] = useState<PortfolioPosition | null>(null);
  const [addBuyPosition, setAddBuyPosition] = useState<PortfolioPosition | null>(null);

  // Handle Escape key to close add buy modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && addBuyPosition) {
        setAddBuyPosition(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addBuyPosition]);

  // Filter holding positions for API calls
  const holdingPositions = positions.filter((p) => p.status === 'holding');

  // Fetch PnL for positions
  const pnlQuery = useQuery({
    queryKey: ['portfolioPnL', holdingPositions.map((p) => p.id).join(',')],
    queryFn: async () => {
      if (holdingPositions.length === 0) return null;
      return calculatePnL({
        positions: holdingPositions.map((p) => ({
          id: p.id,
          symbol: p.symbol,
          avgBuyPrice: p.avgBuyPrice,
          quantity: p.quantity,
        })),
      });
    },
    enabled: holdingPositions.length > 0,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Fetch sell signals
  const signalsQuery = useQuery({
    queryKey: ['sellSignals', holdingPositions.map((p) => p.id).join(',')],
    queryFn: async () => {
      if (holdingPositions.length === 0) return null;
      return fetchSellSignals({
        positions: holdingPositions.map((p) => ({
          id: p.id,
          symbol: p.symbol,
          avgBuyPrice: p.avgBuyPrice,
          quantity: p.quantity,
        })),
        settings: DEFAULT_SETTINGS,
      });
    },
    enabled: holdingPositions.length > 0,
    refetchInterval: 1000 * 60 * 5,
  });

  // Update store when PnL data arrives
  useEffect(() => {
    if (pnlQuery.data) {
      setPositionPnLs(pnlQuery.data.positions);
    }
  }, [pnlQuery.data, setPositionPnLs]);

  // Update store when signals data arrives
  useEffect(() => {
    if (signalsQuery.data) {
      setSellSignals(signalsQuery.data.signals);
    }
  }, [signalsQuery.data, setSellSignals]);

  // Handle loading state
  useEffect(() => {
    setLoading(pnlQuery.isLoading || signalsQuery.isLoading);
  }, [pnlQuery.isLoading, signalsQuery.isLoading, setLoading]);

  // Handle errors
  useEffect(() => {
    const err = pnlQuery.error || signalsQuery.error;
    if (err) {
      setError(getErrorMessage(err));
    }
  }, [pnlQuery.error, signalsQuery.error, setError]);

  // Handlers
  const handleAddPosition = useCallback(
    (data: { stock: Stock; price: number; quantity: number; date: string }) => {
      addPosition({
        symbol: data.stock.symbol,
        stockName: data.stock.name,
        avgBuyPrice: data.price,
        quantity: data.quantity,
        firstBuyDate: data.date,
        lastBuyDate: data.date,
      });
      setShowAddModal(false);
    },
    [addPosition]
  );

  const handleSell = useCallback(
    (data: { price: number; quantity: number; date: string }) => {
      if (!sellModalPosition) return;
      sellPosition(sellModalPosition.id, data.price, data.quantity, data.date);
      setSellModalPosition(null);
    },
    [sellModalPosition, sellPosition]
  );

  const handleAddBuy = useCallback(
    (data: { price: number; quantity: number; date: string }) => {
      if (!addBuyPosition) return;
      addBuy(addBuyPosition.id, data.price, data.quantity, data.date);
      setAddBuyPosition(null);
    },
    [addBuyPosition, addBuy]
  );

  return (
    <div className="portfolio-page">
      <div className="page-toolbar">
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          + 종목 추가
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">데이터를 불러오는 중...</div>
      )}

      <main className="page-content">
        {holdingPositions.length > 0 && pnlQuery.data && (
          <DashboardSummary
            totalInvested={pnlQuery.data.summary.totalInvested}
            totalCurrentValue={pnlQuery.data.summary.totalCurrentValue}
            totalPnl={pnlQuery.data.summary.totalPnl}
            totalPnlPercent={pnlQuery.data.summary.totalPnlPercent}
            positionCount={holdingPositions.length}
          />
        )}

        {holdingPositions.length > 0 && (
          <PortfolioAllocation positions={positions} pnlMap={positionPnLs} />
        )}

        {sellSignals.length > 0 && (
          <SellSignalList signals={sellSignals} positions={positions} />
        )}

        <PositionList
          positions={positions}
          pnlMap={positionPnLs}
          sellSignals={sellSignals}
          onSell={(position) => setSellModalPosition(position)}
          onAddBuy={(position) => setAddBuyPosition(position)}
          onAddPosition={() => setShowAddModal(true)}
        />
      </main>

      {showAddModal && (
        <AddPositionModal
          onSubmit={handleAddPosition}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {sellModalPosition && (
        <SellModal
          position={sellModalPosition}
          currentPrice={positionPnLs.get(sellModalPosition.id)?.currentPrice}
          onSubmit={handleSell}
          onClose={() => setSellModalPosition(null)}
        />
      )}

      {addBuyPosition && (
        <div className="modal-overlay" onClick={() => setAddBuyPosition(null)} role="dialog" aria-modal="true" aria-labelledby="add-buy-modal-title">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="add-buy-modal-title">추가 매수</h2>
              <button
                className="modal-close"
                onClick={() => setAddBuyPosition(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem', fontWeight: 600 }}>
                  {addBuyPosition.stockName}
                </div>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  현재 평균 매수가: {addBuyPosition.avgBuyPrice.toLocaleString()}원 / {addBuyPosition.quantity}주
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAddBuy({
                      price: parseFloat(formData.get('price') as string),
                      quantity: parseInt(formData.get('quantity') as string, 10),
                      date: formData.get('date') as string,
                    });
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                        매수가 (원)
                      </label>
                      <input
                        name="price"
                        type="number"
                        min="1"
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                        수량 (주)
                      </label>
                      <input
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                        매수일
                      </label>
                      <input
                        name="date"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        max={new Date().toISOString().split('T')[0]}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setAddBuyPosition(null)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        매수 기록
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .portfolio-page {
          background-color: var(--color-background);
        }

        .page-toolbar {
          display: flex;
          justify-content: flex-end;
          padding: 1rem 2rem;
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }

        .add-btn {
          padding: 0.75rem 1.5rem;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .add-btn:hover {
          background-color: var(--color-primary-dark);
        }

        .error-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 2rem;
          background-color: #fee2e2;
          color: #dc2626;
        }

        .error-banner button {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: inherit;
        }

        .loading-indicator {
          padding: 1rem 2rem;
          text-align: center;
          color: var(--color-text-secondary);
        }

        .page-content {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

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
      `}</style>
    </div>
  );
}

export default PortfolioPage;
