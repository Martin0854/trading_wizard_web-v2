/**
 * TrendBreakSettings form component
 */

interface TrendBreakSettingsProps {
  enabled: boolean;
  bollingerPeriod: number;
  bollingerStdDev: number;
  onEnabledChange: (enabled: boolean) => void;
  onPeriodChange: (period: number) => void;
  onStdDevChange: (stdDev: number) => void;
}

function TrendBreakSettings({
  enabled,
  bollingerPeriod,
  bollingerStdDev,
  onEnabledChange,
  onPeriodChange,
  onStdDevChange,
}: TrendBreakSettingsProps) {
  return (
    <div className="settings-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">추세 이탈 설정</h3>
          <p className="section-description">
            현재가가 볼린저 밴드 중심선을 하향 돌파하면 추세 이탈 신호가 발생합니다.
          </p>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className={`bollinger-settings ${!enabled ? 'disabled' : ''}`}>
        <div className="setting-row">
          <label htmlFor="bollingerPeriod">볼린저 밴드 기간 (일)</label>
          <input
            id="bollingerPeriod"
            type="number"
            min="5"
            max="50"
            value={bollingerPeriod}
            onChange={(e) => onPeriodChange(parseInt(e.target.value, 10))}
            disabled={!enabled}
          />
        </div>

        <div className="setting-row">
          <label htmlFor="bollingerStdDev">표준편차 배수 (σ)</label>
          <input
            id="bollingerStdDev"
            type="number"
            min="0.5"
            max="3.0"
            step="0.1"
            value={bollingerStdDev}
            onChange={(e) => onStdDevChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
        </div>

        <p className="settings-note">
          기본값: 기간 12일, 표준편차 1.3σ (TRADING_STRATEGY_ALGORITHM.md 참조)
        </p>
      </div>

      <style>{`
        .settings-section {
          padding: 1.5rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .section-description {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin: 0;
          max-width: 300px;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
          flex-shrink: 0;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e2e8f0;
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle input:checked + .toggle-slider {
          background-color: var(--color-primary);
        }

        .toggle input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .bollinger-settings {
          border-top: 1px solid var(--color-border);
          padding-top: 1rem;
          transition: opacity 0.2s;
        }

        .bollinger-settings.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .setting-row label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .setting-row input {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          text-align: right;
        }

        .setting-row input:disabled {
          background-color: var(--color-background);
        }

        .settings-note {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin: 0;
          padding-top: 0.5rem;
          border-top: 1px dashed var(--color-border);
        }
      `}</style>
    </div>
  );
}

export default TrendBreakSettings;
