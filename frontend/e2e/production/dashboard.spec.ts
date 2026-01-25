import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Production E2E Tests - Dashboard & Wizard Selection
 * Tests the main dashboard after login
 */

// Helper to login before each test
async function loginAndNavigate(page: any) {
  const loginPage = new LoginPage(page);
  await page.goto('/');

  // Wait for login page
  await expect(page).toHaveURL(/\/login/);

  // Login with test password (any password works in test environment)
  await loginPage.passwordInput.fill('test-password');
  await loginPage.loginButton.click();

  // Wait for redirect to dashboard
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
}

test.describe('Trading Wizard - 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('로그인 후 대시보드가 표시된다', async ({ page }) => {
    // 대시보드 타이틀 확인 (텍스트로 확인)
    await expect(page.locator('text=위자드 선택')).toBeVisible();

    // 부제목 확인
    await expect(page.locator('text=사용할 기능을 선택하세요')).toBeVisible();
  });

  test('Daily Focus 카드가 표시된다', async ({ page }) => {
    // Daily Focus 카드 확인
    const dailyFocusCard = page.locator('.wizard-card:has-text("Daily Focus")');
    await expect(dailyFocusCard).toBeVisible();

    // 카드 설명 확인
    await expect(dailyFocusCard.locator('.wizard-description')).toContainText('볼린저 밴드');
  });

  test('My Portfolio 카드가 표시된다', async ({ page }) => {
    // My Portfolio 카드 확인
    const portfolioCard = page.locator('.wizard-card:has-text("My Portfolio")');
    await expect(portfolioCard).toBeVisible();

    // 카드 설명 확인
    await expect(portfolioCard.locator('.wizard-description')).toContainText('포트폴리오');
  });

  test('기능 안내 섹션이 표시된다', async ({ page }) => {
    // 기능 안내 제목
    await expect(page.locator('text=기능 안내')).toBeVisible();

    // Daily Focus Wizard 기능 목록
    await expect(page.locator('text=Daily Focus Wizard')).toBeVisible();
    await expect(page.locator('text=KOSPI 100 종목')).toBeVisible();

    // My Portfolio Wizard 기능 목록
    await expect(page.locator('text=My Portfolio Wizard')).toBeVisible();
    await expect(page.locator('text=포지션 관리')).toBeVisible();
  });

  test('헤더에 로그아웃 버튼이 표시된다', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")');
    await expect(logoutButton).toBeVisible();
  });

  test('헤더에 인증 정보가 표시된다', async ({ page }) => {
    // PASSWORD 인증 방식 표시
    await expect(page.locator('text=PASSWORD')).toBeVisible();
  });

  test('로그아웃 버튼 클릭 시 로그인 페이지로 이동한다', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")');
    await logoutButton.click();

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Trading Wizard - Daily Focus 진입', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Daily Focus 카드 클릭 시 Daily Focus 페이지로 이동한다', async ({ page }) => {
    // Daily Focus 카드 클릭 (wizard-card 클래스 사용)
    const dailyFocusCard = page.locator('.wizard-card:has-text("Daily Focus")');
    await dailyFocusCard.click();

    // Daily Focus 페이지로 이동
    await expect(page).toHaveURL(/\/daily-focus/);
  });

  test('Daily Focus 페이지에 헤더가 표시된다', async ({ page }) => {
    // Daily Focus로 이동
    await page.goto('/daily-focus');

    // 헤더 또는 네비게이션 확인
    const headerOrNav = page.locator('header, nav, [class*="header"]').first();
    await expect(headerOrNav).toBeVisible();
  });

  test('Daily Focus 페이지에 메인 콘텐츠가 표시된다', async ({ page }) => {
    await page.goto('/daily-focus');

    // 메인 콘텐츠 영역 확인
    const mainContent = page.locator('main, [class*="content"], [class*="container"]').first();
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Trading Wizard - My Portfolio 진입', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('My Portfolio 카드 클릭 시 Portfolio 페이지로 이동한다', async ({ page }) => {
    // My Portfolio 카드 클릭 (wizard-card 클래스 사용)
    const portfolioCard = page.locator('.wizard-card:has-text("My Portfolio")');
    await portfolioCard.click();

    // Portfolio 페이지로 이동
    await expect(page).toHaveURL(/\/portfolio/);
  });

  test('My Portfolio 페이지가 로드된다', async ({ page }) => {
    // My Portfolio 카드 클릭
    const portfolioCard = page.locator('.wizard-card:has-text("My Portfolio")');
    await portfolioCard.click();

    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');

    // URL 확인
    await expect(page).toHaveURL(/\/portfolio/);

    // 페이지에 콘텐츠가 있는지 확인 (빈 페이지가 아닌지)
    const body = page.locator('body');
    const bodyText = await body.textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});
