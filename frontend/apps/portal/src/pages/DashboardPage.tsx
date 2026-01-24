import { useNavigate } from 'react-router-dom';
import { WizardCard } from '../components/WizardCard';
import { useAuthStore } from '../store/authStore';
import {
  getDailyFocusUrl,
  getMyPortfolioUrl,
  navigateToApp,
} from '@trading-wizard/shared-ui/services';

export function DashboardPage() {
  const navigate = useNavigate();
  const { userIdHash, authMethod, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigateToDailyFocus = () => {
    navigateToApp(getDailyFocusUrl());
  };

  const handleNavigateToPortfolio = () => {
    navigateToApp(getMyPortfolioUrl());
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Trading Wizard</h1>
        <div className="user-info">
          <span className="auth-badge">
            {authMethod === 'pem' ? 'PEM' : 'Password'}
          </span>
          <span className="user-hash" title={userIdHash || ''}>
            {userIdHash?.substring(0, 8)}...
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <h2>위자드 선택</h2>
        <p className="dashboard-subtitle">사용할 기능을 선택하세요</p>

        <div className="wizard-grid">
          <WizardCard
            title="Daily Focus"
            description="볼린저 밴드 스퀴즈 전략 기반 매수 추천"
            icon="📈"
            onClick={handleNavigateToDailyFocus}
          />
          <WizardCard
            title="My Portfolio"
            description="포트폴리오 관리 및 매도 신호"
            icon="💼"
            onClick={handleNavigateToPortfolio}
          />
        </div>

        <div className="info-section">
          <h3>기능 안내</h3>
          <div className="info-cards">
            <div className="info-card">
              <h4>Daily Focus Wizard</h4>
              <ul>
                <li>KOSPI 100 종목 실시간 스캔</li>
                <li>볼린저 밴드 스퀴즈 탐지</li>
                <li>매수 신호 및 신뢰도 점수</li>
                <li>기술적 지표 분석 (RSI, MACD)</li>
              </ul>
            </div>
            <div className="info-card">
              <h4>My Portfolio Wizard</h4>
              <ul>
                <li>포지션 관리 및 추적</li>
                <li>손절/익절 신호 알림</li>
                <li>손익 계산 및 리포트</li>
                <li>거래 이력 관리</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>Trading Wizard는 투자 참고용이며, 투자 결정은 본인 책임입니다.</p>
      </footer>
    </div>
  );
}
