import { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import BollingerSettings from '../components/settings/BollingerSettings';
import IndicatorSettings from '../components/settings/IndicatorSettings';
import ConfidenceSettings from '../components/settings/ConfidenceSettings';
import { LoadingSpinner, ErrorMessage } from '@trading-wizard/shared-ui';
import './SettingsPage.css';

function SettingsPage() {
  const {
    settings,
    loading,
    error,
    isAuthenticated,
    setSettings,
    resetToDefaults,
    authenticate,
    saveSettings,
    setError,
  } = useSettingsStore();

  const [password, setPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    try {
      await authenticate(password);
    } catch {
      // Error is handled in the store
    }
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    try {
      await saveSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error is handled in the store
    }
  };

  const handleReset = () => {
    if (window.confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      resetToDefaults();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="settings-page">
        <div className="auth-section">
          <h2>설정 접근</h2>
          <p>
            설정을 저장하려면 비밀번호를 입력해주세요.
            <br />
            이 비밀번호는 설정 데이터를 암호화하는 데 사용됩니다.
          </p>
          <form onSubmit={handleAuthenticate} className="auth-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoFocus
            />
            <button type="submit" disabled={loading || !password}>
              {loading ? <LoadingSpinner /> : '확인'}
            </button>
          </form>
          {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
          <p className="auth-note">
            비밀번호를 잊으면 설정을 복구할 수 없습니다.
            <br />
            동일한 비밀번호로 다른 기기에서도 설정에 접근할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>전략 설정</h2>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            기본값으로 초기화
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : '저장'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
      {saveSuccess && (
        <div className="success-message">설정이 저장되었습니다.</div>
      )}

      <BollingerSettings settings={settings} onChange={setSettings} />
      <IndicatorSettings settings={settings} onChange={setSettings} />
      <ConfidenceSettings settings={settings} onChange={setSettings} />
    </div>
  );
}

export default SettingsPage;
