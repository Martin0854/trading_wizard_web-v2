import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '../store/authStore';
import type { AuthCredentials } from '@trading-wizard/shared-ui/services';
import { getReturnUrl } from '@trading-wizard/shared-ui/services';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, login, checkSession, clearError } = useAuthStore();

  const handlePostLogin = useCallback(() => {
    // Check if there's a return URL
    const returnUrl = getReturnUrl();
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    // Check existing session on mount
    if (checkSession()) {
      handlePostLogin();
    }
  }, [checkSession, handlePostLogin]);

  useEffect(() => {
    if (isAuthenticated) {
      handlePostLogin();
    }
  }, [isAuthenticated, handlePostLogin]);

  const handleSubmit = async (credentials: AuthCredentials) => {
    clearError();
    await login(credentials);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Trading Wizard</h1>
          <p>주식 투자 의사결정 도우미</p>
        </div>

        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />

        <div className="login-footer">
          <p className="security-note">
            모든 데이터는 클라이언트에서 암호화되어 저장됩니다.
            <br />
            서버는 암호화된 데이터만 보관하며, 복호화할 수 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
