import type { DailyFocusSettings } from '@trading-wizard/shared-ui/types';
import './SettingsForm.css';

interface BollingerSettingsProps {
  settings: DailyFocusSettings;
  onChange: (settings: Partial<DailyFocusSettings>) => void;
}

function BollingerSettings({ settings, onChange }: BollingerSettingsProps) {
  return (
    <div className="settings-group">
      <h3>볼린저 밴드 설정</h3>
      <p className="group-description">
        볼린저 밴드의 계산 파라미터를 조정합니다.
      </p>

      <div className="form-field">
        <label htmlFor="bollingerPeriod">기간 (일)</label>
        <input
          type="number"
          id="bollingerPeriod"
          value={settings.bollingerPeriod}
          onChange={(e) =>
            onChange({ bollingerPeriod: parseInt(e.target.value, 10) || 12 })
          }
          min={5}
          max={50}
        />
        <span className="field-hint">5-50 (기본: 12)</span>
      </div>

      <div className="form-field">
        <label htmlFor="bollingerStdDev">표준편차 배수 (σ)</label>
        <input
          type="number"
          id="bollingerStdDev"
          value={settings.bollingerStdDev}
          onChange={(e) =>
            onChange({ bollingerStdDev: parseFloat(e.target.value) || 1.3 })
          }
          min={0.5}
          max={3.0}
          step={0.1}
        />
        <span className="field-hint">0.5-3.0 (기본: 1.3)</span>
      </div>

      <div className="form-field">
        <label htmlFor="squeezeThresholdPct">스퀴즈 임계값 (%)</label>
        <input
          type="number"
          id="squeezeThresholdPct"
          value={settings.squeezeThresholdPct}
          onChange={(e) =>
            onChange({ squeezeThresholdPct: parseInt(e.target.value, 10) || 55 })
          }
          min={30}
          max={80}
        />
        <span className="field-hint">
          밴드폭이 이동평균 대비 이 값 이하일 때 스퀴즈 상태로 판단 (30-80, 기본: 55)
        </span>
      </div>

      <div className="form-field">
        <label htmlFor="squeezeLookbackDays">스퀴즈 확인 기간 (일)</label>
        <input
          type="number"
          id="squeezeLookbackDays"
          value={settings.squeezeLookbackDays}
          onChange={(e) =>
            onChange({ squeezeLookbackDays: parseInt(e.target.value, 10) || 5 })
          }
          min={3}
          max={20}
        />
        <span className="field-hint">최근 N일 중 스퀴즈 상태 여부 확인 (3-20, 기본: 5)</span>
      </div>

      <div className="form-field">
        <label htmlFor="bbWidthMAPeriod">밴드폭 MA 기간 (일)</label>
        <input
          type="number"
          id="bbWidthMAPeriod"
          value={settings.bbWidthMAPeriod}
          onChange={(e) =>
            onChange({ bbWidthMAPeriod: parseInt(e.target.value, 10) || 10 })
          }
          min={5}
          max={30}
        />
        <span className="field-hint">밴드폭 이동평균 계산 기간 (5-30, 기본: 10)</span>
      </div>
    </div>
  );
}

export default BollingerSettings;
