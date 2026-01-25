import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header, Footer, SessionGuard } from '@trading-wizard/shared-ui/components';
import type { NavLink } from '@trading-wizard/shared-ui/components';
import { getPortalUrl } from '@trading-wizard/shared-ui/services';
import PortfolioPage from './pages/PortfolioPage';
import SettingsPage from './pages/SettingsPage';
import { usePortfolioStore } from './store/portfolioStore';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { lastUpdated } = usePortfolioStore();

  const navLinks: NavLink[] = [
    {
      label: '포트폴리오',
      href: '/portfolio',
      active: location.pathname === '/portfolio' || location.pathname === '/',
    },
    {
      label: '설정',
      href: '/portfolio/settings',
      active: location.pathname === '/settings',
    },
    {
      label: '포털',
      href: getPortalUrl(),
      active: false,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        title="My Portfolio Wizard"
        navLinks={navLinks}
        dataFreshness={lastUpdated ?? undefined}
      />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer disclaimer="본 서비스에서 제공하는 매도 신호는 투자 참고용이며, 매매 권유가 아닙니다. 투자에 대한 최종 결정과 책임은 이용자 본인에게 있습니다." />
    </div>
  );
}

function App() {
  return (
    <SessionGuard>
      <BrowserRouter basename="/portfolio">
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <PortfolioPage />
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </SessionGuard>
  );
}

export default App;
