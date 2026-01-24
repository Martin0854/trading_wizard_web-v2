import type { DailyFocusSettings } from '@trading-wizard/shared-ui/types';
import './SettingsForm.css';

interface IndicatorSettingsProps {
  settings: DailyFocusSettings;
  onChange: (settings: Partial<DailyFocusSettings>) => void;
}

function IndicatorSettings({ settings, onChange }: IndicatorSettingsProps) {
  return (
    <div className="settings-group">
      <h3>보조 지표 설정</h3>
      <p className="group-description">
        RSI, MACD, 거래량 지표의 계산 파라미터를 조정합니다.
      </p>

      <div className="form-section">
        <h4>RSI</h4>
        <div className="form-field">
          <label htmlFor="rsiPeriod">RSI 기간 (일)</label>
          <input
            type="number"
            id="rsiPeriod"
            value={settings.rsiPeriod}
            onChange={(e) =>
              onChange({ rsiPeriod: parseInt(e.target.value, 10) || 14 })
            }
            min={7}
            max={28}
          />
          <span className="field-hint">7-28 (기본: 14)</span>
        </div>
      </div>

      <div className="form-section">
        <h4>MACD</h4>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="macdFast">빠른 EMA</label>
            <input
              type="number"
              id="macdFast"
              value={settings.macdFast}
              onChange={(e) =>
                onChange({ macdFast: parseInt(e.target.value, 10) || 12 })
              }
              min={5}
              max={20}
            />
            <span className="field-hint">5-20 (기본: 12)</span>
          </div>
          <div className="form-field">
            <label htmlFor="macdSlow">느린 EMA</label>
            <input
              type="number"
              id="macdSlow"
              value={settings.macdSlow}
              onChange={(e) =>
                onChange({ macdSlow: parseInt(e.target.value, 10) || 26 })
              }
              min={15}
              max={40}
            />
            <span className="field-hint">15-40 (기본: 26)</span>
          </div>
          <div className="form-field">
            <label htmlFor="macdSignal">시그널 EMA</label>
            <input
              type="number"
              id="macdSignal"
              value={settings.macdSignal}
              onChange={(e) =>
                onChange({ macdSignal: parseInt(e.target.value, 10) || 9 })
              }
              min={5}
              max={15}
            />
            <span className="field-hint">5-15 (기본: 9)</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>거래량</h4>
        <div className="form-field">
          <label htmlFor="volumeAvgPeriod">평균 거래량 기간 (일)</label>
          <input
            type="number"
            id="volumeAvgPeriod"
            value={settings.volumeAvgPeriod}
            onChange={(e) =>
              onChange({ volumeAvgPeriod: parseInt(e.target.value, 10) || 20 })
            }
            min={10}
            max={60}
          />
          <span className="field-hint">거래량 비율 계산에 사용할 평균 기간 (10-60, 기본: 20)</span>
        </div>
      </div>
    </div>
  );
}

export default IndicatorSettings;
