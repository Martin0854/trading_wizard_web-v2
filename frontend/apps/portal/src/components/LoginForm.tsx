import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import type { AuthMethod, AuthCredentials } from '@trading-wizard/shared-ui/services';
import { isValidPem, generateKeyPair, downloadFile } from '@trading-wizard/shared-ui/crypto';

interface LoginFormProps {
  onSubmit: (credentials: AuthCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

type ViewMode = 'login' | 'generate';

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [password, setPassword] = useState('');
  const [pemContent, setPemContent] = useState('');
  const [pemFileName, setPemFileName] = useState<string | null>(null);
  const [pemError, setPemError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Key generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{
    privateKeyPem: string;
    userIdHash: string;
  } | null>(null);

  const handleMethodChange = (method: AuthMethod) => {
    setAuthMethod(method);
    setPemError(null);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();

      if (!isValidPem(content)) {
        setPemError('유효하지 않은 PEM 파일입니다. RSA 개인키 파일을 선택해주세요.');
        setPemContent('');
        setPemFileName(null);
        return;
      }

      setPemContent(content);
      setPemFileName(file.name);
      setPemError(null);
    } catch {
      setPemError('파일을 읽을 수 없습니다.');
      setPemContent('');
      setPemFileName(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const credentials: AuthCredentials = {
      method: authMethod,
      password: authMethod === 'password' ? password : undefined,
      pemContent: authMethod === 'pem' ? pemContent : undefined,
    };

    await onSubmit(credentials);
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    setPemError(null);

    try {
      const keyPair = await generateKeyPair();
      setGeneratedKey({
        privateKeyPem: keyPair.privateKeyPem,
        userIdHash: keyPair.userIdHash,
      });
    } catch (err) {
      setPemError(err instanceof Error ? err.message : '키 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadKey = () => {
    if (!generatedKey) return;

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `trading-wizard-key-${timestamp}.pem`;
    downloadFile(generatedKey.privateKeyPem, filename, 'application/x-pem-file');
  };

  const handleUseGeneratedKey = async () => {
    if (!generatedKey) return;

    // Set the generated key as the current PEM content and login
    setPemContent(generatedKey.privateKeyPem);
    setPemFileName('새로 생성된 키');
    setAuthMethod('pem');
    setViewMode('login');

    // Auto-submit with the generated key
    const credentials: AuthCredentials = {
      method: 'pem',
      pemContent: generatedKey.privateKeyPem,
    };
    await onSubmit(credentials);
  };

  const isFormValid =
    (authMethod === 'password' && password.length > 0) ||
    (authMethod === 'pem' && pemContent.length > 0);

  // Key Generation View
  if (viewMode === 'generate') {
    return (
      <div className="login-form">
        <div className="generate-header">
          <button
            type="button"
            className="back-btn"
            onClick={() => {
              setViewMode('login');
              setGeneratedKey(null);
            }}
          >
            ← 돌아가기
          </button>
          <h3>새 PEM 키 생성</h3>
        </div>

        {!generatedKey ? (
          <div className="generate-intro">
            <p className="form-hint">
              PEM 키는 비밀번호 대신 사용할 수 있는 암호화 키 파일입니다.
              생성된 키 파일은 안전한 곳에 보관해주세요.
            </p>
            <button
              type="button"
              className="submit-btn"
              onClick={handleGenerateKey}
              disabled={isGenerating}
            >
              {isGenerating ? '키 생성 중...' : '새 키 생성하기'}
            </button>
          </div>
        ) : (
          <div className="generate-result">
            <div className="success-icon">✓</div>
            <p className="success-message">키가 성공적으로 생성되었습니다!</p>

            <div className="key-info">
              <label>사용자 ID (해시)</label>
              <code className="user-hash-display">{generatedKey.userIdHash.substring(0, 16)}...</code>
            </div>

            <div className="key-preview">
              <label>개인키 미리보기</label>
              <pre className="key-content">
                {generatedKey.privateKeyPem.substring(0, 200)}...
              </pre>
            </div>

            <div className="warning-box">
              <strong>중요!</strong> 이 키 파일은 다시 복구할 수 없습니다.
              반드시 다운로드하여 안전한 곳에 보관해주세요.
            </div>

            <div className="generate-actions">
              <button
                type="button"
                className="download-btn"
                onClick={handleDownloadKey}
              >
                키 파일 다운로드 (.pem)
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={handleUseGeneratedKey}
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '이 키로 로그인'}
              </button>
            </div>
          </div>
        )}

        {pemError && <div className="form-error-box">{pemError}</div>}
      </div>
    );
  }

  // Login View
  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {/* Auth Method Tabs */}
      <div className="auth-method-tabs">
        <button
          type="button"
          className={`auth-tab ${authMethod === 'password' ? 'active' : ''}`}
          onClick={() => handleMethodChange('password')}
        >
          비밀번호
        </button>
        <button
          type="button"
          className={`auth-tab ${authMethod === 'pem' ? 'active' : ''}`}
          onClick={() => handleMethodChange('pem')}
        >
          PEM 파일
        </button>
      </div>

      {/* Password Login */}
      {authMethod === 'password' && (
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            disabled={isLoading}
          />
          <p className="form-hint">
            비밀번호는 서버에 저장되지 않습니다. 동일한 비밀번호로 여러 기기에서 설정에 접근할 수 있습니다.
          </p>
        </div>
      )}

      {/* PEM File Login */}
      {authMethod === 'pem' && (
        <div className="form-group">
          <label htmlFor="pem-file">PEM 파일</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              id="pem-file"
              ref={fileInputRef}
              accept=".pem,.key"
              onChange={handleFileSelect}
              disabled={isLoading}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="file-select-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              파일 선택
            </button>
            {pemFileName && (
              <span className="file-name">{pemFileName}</span>
            )}
          </div>
          {pemError && <p className="form-error">{pemError}</p>}
          <p className="form-hint">
            RSA 개인키 파일(.pem)을 선택해주세요. 파일은 서버로 전송되지 않으며, 브라우저에서만 사용됩니다.
          </p>
          <button
            type="button"
            className="generate-link"
            onClick={() => setViewMode('generate')}
          >
            PEM 키가 없으신가요? 새로 생성하기 →
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="form-error-box">{error}</div>}

      {/* Submit Button */}
      <button
        type="submit"
        className="submit-btn"
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}
