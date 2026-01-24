/**
 * StopLossSettings form component
 */

interface StopLossSettingsProps {
  value: number;
  onChange: (value: number) => void;
}

function StopLossSettings({ value, onChange }: StopLossSettingsProps) {
  return (
    <div className="settings-section">
      <h3 className="section-title">손절매 설정</h3>
      <p className="section-description">
        평균 매수가 대비 손실률이 이 값 이하가 되면 손절매 추천 신호가 발생합니다.
      </p>

      <div className="slider-container">
        <div className="slider-labels">
          <span>-20%</span>
          <span className="current-value">{value}%</span>
          <span>0%</span>
        </div>
        <input
          type="range"
          min="-20"
          max="0"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider"
        />
      </div>

      <div className="input-row">
        <label htmlFor="stopLossInput">직접 입력</label>
        <div className="input-with-unit">
          <input
            id="stopLossInput"
            type="number"
            min="-20"
            max="0"
            step="0.5"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
          />
          <span className="unit">%</span>
        </div>
      </div>

      <style>{`
        .settings-section {
          padding: 1.5rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .section-description {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin: 0 0 1.5rem 0;
        }

        .slider-container {
          margin-bottom: 1rem;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .current-value {
          font-weight: 600;
          color: var(--color-error);
        }

        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #ef4444, #fca5a5);
          appearance: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-surface);
          border: 2px solid var(--color-error);
          cursor: pointer;
        }

        .input-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }

        .input-row label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .input-with-unit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .input-with-unit input {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          text-align: right;
        }

        .unit {
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}

export default StopLossSettings;
