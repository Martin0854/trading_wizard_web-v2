import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer, SessionGuard } from '@trading-wizard/shared-ui';
import { getPortalUrl, getMyPortfolioUrl } from '@trading-wizard/shared-ui/services';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import { useDailyFocusStore } from './store/dailyFocusStore';

function App() {
  const { dataFreshness } = useDailyFocusStore();

  const navLinks = [
    { label: '매수 추천', href: '/' },
    { label: '설정', href: '/settings' },
    { label: 'My Portfolio', href: getMyPortfolioUrl(), external: true },
    { label: '포털', href: getPortalUrl(), external: true },
  ];

  return (
    <SessionGuard>
      <BrowserRouter>
        <div className="app-container">
          <Header
            title="Daily Focus Wizard"
            navLinks={navLinks}
            dataFreshness={dataFreshness}
          />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
          <Footer disclaimer="본 서비스는 투자 신호를 제공하며, 매수 추천이 아닙니다. 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다." />
        </div>
      </BrowserRouter>
    </SessionGuard>
  );
}

export default App;
