import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStockDetail } from '../services/api';
import { LoadingSpinner, ErrorMessage } from '@trading-wizard/shared-ui';
import ScoreBreakdown from './ScoreBreakdown';
import './StockDetailModal.css';

interface StockDetailModalProps {
  symbol: string;
  onClose: () => void;
}

function StockDetailModal({ symbol, onClose }: StockDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockDetail', symbol],
    queryFn: () => fetchStockDetail(symbol),
  });

  // Focus trap and keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" ref={modalRef}>
        <button
          ref={closeButtonRef}
          className="modal-close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        {isLoading && (
          <div className="modal-loading">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <ErrorMessage
            message="종목 정보를 불러올 수 없습니다."
            onRetry={() => refetch()}
          />
        )}

        {data && (
          <>
            <div className="modal-header">
              <div className="stock-title">
                <h2 id="modal-title">{data.stock.name}</h2>
                <span className="symbol">{data.stock.symbol}</span>
              </div>
              <div className="price-info">
                <span className="current-price">
                  ₩{data.stock.currentPrice.toLocaleString()}
                </span>
                <span
                  className={`change ${(data.stock.changePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}
                >
                  {formatPercent(data.stock.changePercent ?? 0)}
                </span>
              </div>
            </div>

            {data.recommendation && (
              <div className="recommendation-badge">
                <span className="badge-label">신뢰도 점수</span>
                <span className="badge-score">
                  {data.recommendation.confidenceScore.toFixed(0)}점
                </span>
              </div>
            )}

            {data.recommendation && (
              <ScoreBreakdown
                indicators={data.indicators}
              />
            )}

            <div className="indicators-section">
              <h3>기술적 지표</h3>

              <div className="indicator-group">
                <h4>볼린저 밴드</h4>
                <div className="indicator-grid">
                  <div className="indicator-item">
                    <span className="label">상단 밴드</span>
                    <span className="value">
                      ₩{data.indicators.bollinger.upper.toLocaleString()}
                    </span>
                  </div>
                  <div className="indicator-item">
                    <span className="label">중심선</span>
                    <span className="value">
                      ₩{data.indicators.bollinger.middle.toLocaleString()}
                    </span>
                  </div>
                  <div className="indicator-item">
                    <span className="label">하단 밴드</span>
                    <span className="value">
                      ₩{data.indicators.bollinger.lower.toLocaleString()}
                    </span>
                  </div>
                  <div className="indicator-item">
                    <span className="label">밴드폭</span>
                    <span className="value">
                      {data.indicators.bollinger.width.toFixed(2)}%
                    </span>
                  </div>
                  <div className="indicator-item">
                    <span className="label">상태</span>
                    <span
                      className={`value status ${data.indicators.bollinger.isExpanding
                        ? 'expanding'
                        : 'squeezing'
                        }`}
                    >
                      {data.indicators.bollinger.isInSqueeze
                        ? '스퀴즈'
                        : data.indicators.bollinger.isExpanding
                          ? '확장 중'
                          : '일반'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="indicator-group">
                <h4>RSI (14일)</h4>
                <div className="rsi-bar">
                  <div
                    className="rsi-marker"
                    style={{ left: `${data.indicators.rsi}%` }}
                  />
                  <div className="rsi-zones">
                    <span className="zone oversold">과매도</span>
                    <span className="zone neutral">중립</span>
                    <span className="zone overbought">과매수</span>
                  </div>
                </div>
                <div className="rsi-value">{data.indicators.rsi.toFixed(1)}</div>
              </div>

              <div className="indicator-group">
                <h4>MACD</h4>
                <div className="indicator-grid">
                  <div className="indicator-item">
                    <span className="label">MACD</span>
                    <span className="value">
                      {data.indicators.macd.macd.toFixed(2)}
                    </span>
                  </div>
                  <div className="indicator-item">
                    <span className="label">시그널</span>
                    <span className="value">
                      {data.indicators.macd.signal.toFixed(2)}
                    </span>
                  </div>
                  <div className="indicator-item">
                    <span className="label">히스토그램</span>
                    <span
                      className={`value ${data.indicators.macd.histogram > 0
                        ? 'positive'
                        : 'negative'
                        }`}
                    >
                      {data.indicators.macd.histogram.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="indicator-group">
                <h4>거래량</h4>
                <div className="indicator-grid">
                  <div className="indicator-item">
                    <span className="label">거래량 비율</span>
                    <span
                      className={`value ${data.indicators.volumeRatio >= 1.5 ? 'highlight' : ''
                        }`}
                    >
                      {data.indicators.volumeRatio.toFixed(2)}x
                    </span>
                  </div>
                  <div className="indicator-item">
                    <span className="label">당일 거래량</span>
                    <span className="value">
                      {(data.stock.volume ?? 0).toLocaleString()}주
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {data.recommendation && (
              <div className="signal-section">
                <h3>신호 분석</h3>
                <p className="signal-reason">{data.recommendation.signalReason}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StockDetailModal;
