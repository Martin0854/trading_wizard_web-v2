/**
 * TakeProfitSettings form component
 */

interface TakeProfitSettingsProps {
  value: number;
  onChange: (value: number) => void;
}

function TakeProfitSettings({ value, onChange }: TakeProfitSettingsProps) {
  return (
    <div className="settings-section">
      <h3 className="section-title">익절매 설정</h3>
      <p className="section-description">
        평균 매수가 대비 수익률이 이 값 이상이 되면 익절매 추천 신호가 발생합니다.
      </p>

      <div className="slider-container">
        <div className="slider-labels">
          <span>0%</span>
          <span className="current-value">+{value}%</span>
          <span>100%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider"
        />
      </div>

      <div className="input-row">
        <label htmlFor="takeProfitInput">직접 입력</label>
        <div className="input-with-unit">
          <input
            id="takeProfitInput"
            type="number"
            min="0"
            max="100"
            step="1"
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
          color: var(--color-success);
        }

        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #86efac, #22c55e);
          appearance: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-surface);
          border: 2px solid var(--color-success);
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

export default TakeProfitSettings;
