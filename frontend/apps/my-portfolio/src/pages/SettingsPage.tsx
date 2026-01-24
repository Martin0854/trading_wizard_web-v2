/**
 * SettingsPage - Portfolio settings management
 */

import { useSettingsStore, validatePortfolioSettings } from '../store/settingsStore';
import StopLossSettings from '../components/settings/StopLossSettings';
import TakeProfitSettings from '../components/settings/TakeProfitSettings';
import TrendBreakSettings from '../components/settings/TrendBreakSettings';

function SettingsPage() {
  const { settings, isDirty, setSettings, resetToDefaults, markClean } = useSettingsStore();

  const validation = validatePortfolioSettings(settings);

  const handleSave = () => {
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }
    // Settings are saved to store, will be persisted via settingsService
    // when user data is saved (encrypted)
    markClean();
    alert('설정이 저장되었습니다.');
  };

  const handleReset = () => {
    if (confirm('설정을 기본값으로 초기화하시겠습니까?')) {
      resetToDefaults();
    }
  };

  return (
    <div className="settings-page">
      <div className="page-intro">
        <h2>매도 전략 설정</h2>
        <p>손절매, 익절매, 추세 이탈 기준을 설정합니다</p>
      </div>

      <main className="page-content">
        <div className="settings-grid">
          <StopLossSettings
            value={settings.stopLossPct}
            onChange={(value) => setSettings({ stopLossPct: value })}
          />

          <TakeProfitSettings
            value={settings.takeProfitPct}
            onChange={(value) => setSettings({ takeProfitPct: value })}
          />

          <TrendBreakSettings
            enabled={settings.sellOnMiddleBand}
            bollingerPeriod={settings.bollingerPeriod}
            bollingerStdDev={settings.bollingerStdDev}
            onEnabledChange={(enabled) => setSettings({ sellOnMiddleBand: enabled })}
            onPeriodChange={(period) => setSettings({ bollingerPeriod: period })}
            onStdDevChange={(stdDev) => setSettings({ bollingerStdDev: stdDev })}
          />
        </div>

        {!validation.isValid && (
          <div className="validation-errors">
            {validation.errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <div className="action-buttons">
          <button className="reset-btn" onClick={handleReset}>
            기본값으로 초기화
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!isDirty || !validation.isValid}
          >
            설정 저장
          </button>
        </div>

        <div className="info-box">
          <h4>설정 안내</h4>
          <ul>
            <li>
              <strong>손절매:</strong> 평균 매수가 대비 손실률이 설정 값 이하가 되면 매도 신호 발생
            </li>
            <li>
              <strong>익절매:</strong> 평균 매수가 대비 수익률이 설정 값 이상이 되면 매도 신호 발생
            </li>
            <li>
              <strong>추세 이탈:</strong> 현재가가 볼린저 밴드 중심선 아래로 하락하면 매도 신호 발생
            </li>
          </ul>
          <p className="disclaimer">
            이 신호는 참고용이며, 투자 결정은 본인의 판단으로 하시기 바랍니다.
          </p>
        </div>
      </main>

      <style>{`
        .settings-page {
          background-color: var(--color-background);
        }

        .page-intro {
          padding: 1.5rem 2rem;
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }

        .page-intro h2 {
          font-size: 1.25rem;
          margin: 0 0 0.25rem 0;
        }

        .page-intro p {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        .page-content {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .validation-errors {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #fee2e2;
          border-radius: var(--radius-md);
          color: #dc2626;
        }

        .validation-errors p {
          margin: 0.25rem 0;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--color-border);
        }

        .reset-btn {
          padding: 0.75rem 1.5rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 1rem;
          cursor: pointer;
        }

        .reset-btn:hover {
          background-color: var(--color-background);
        }

        .save-btn {
          padding: 0.75rem 2rem;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
        }

        .save-btn:hover:not(:disabled) {
          background-color: var(--color-primary-dark);
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-box {
          margin-top: 2rem;
          padding: 1.5rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .info-box h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .info-box ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .info-box li {
          margin-bottom: 0.5rem;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .info-box li strong {
          color: var(--color-text-primary);
        }

        .disclaimer {
          margin: 1rem 0 0 0;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border);
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}

export default SettingsPage;
