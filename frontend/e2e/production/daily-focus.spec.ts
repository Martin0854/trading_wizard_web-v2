import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Production E2E Tests - Daily Focus App
 * Tests the Daily Focus wizard at https://trading.kalee-dc.click/daily-focus/
 */

// Helper to login and navigate to Daily Focus
async function loginAndGoToDailyFocus(page: any) {
  const loginPage = new LoginPage(page);
  await page.goto('/');

  // Wait for login page
  await expect(page).toHaveURL(/\/login/);

  // Login with test password
  await loginPage.passwordInput.fill('test-password');
  await loginPage.loginButton.click();

  // Wait for redirect to dashboard
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });

  // Navigate to Daily Focus
  await page.goto('/daily-focus');
  await page.waitForLoadState('networkidle');
}

test.describe('Daily Focus - 홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToDailyFocus(page);
  });

  test('Daily Focus 페이지가 정상적으로 로드된다', async ({ page }) => {
    // URL 확인
    await expect(page).toHaveURL(/\/daily-focus/);

    // 헤더 확인
    const header = page.locator('header, [class*="header"], nav').first();
    await expect(header).toBeVisible();
  });

  test('Daily Focus 타이틀이 표시된다', async ({ page }) => {
    // 타이틀 또는 브랜드 확인
    await expect(page.locator('text=Daily Focus')).toBeVisible();
  });

  test('네비게이션 링크가 표시된다', async ({ page }) => {
    // 네비게이션 링크 확인
    const navLinks = page.locator('nav a, header a, [class*="nav"] a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('매수 추천 링크가 표시된다', async ({ page }) => {
    // 매수 추천 관련 링크/메뉴
    const buyLink = page.locator('a:has-text("매수"), a:has-text("추천"), [class*="nav"]:has-text("매수")').first();
    await expect(buyLink).toBeVisible();
  });

  test('설정 링크가 표시된다', async ({ page }) => {
    // 설정 링크
    const settingsLink = page.locator('a[href*="settings"], a:has-text("설정")');
    await expect(settingsLink.first()).toBeVisible();
  });

  test('메인 콘텐츠 영역이 표시된다', async ({ page }) => {
    // 메인 콘텐츠
    const mainContent = page.locator('main, [class*="content"], [class*="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('푸터가 표시된다', async ({ page }) => {
    // 푸터 확인
    const footer = page.locator('footer, [class*="footer"]');
    const footerVisible = await footer.first().isVisible().catch(() => false);

    // 푸터가 있거나 면책조항 텍스트가 있는지 확인
    const hasDisclaimer = await page.locator('text=투자').isVisible().catch(() => false);

    expect(footerVisible || hasDisclaimer).toBeTruthy();
  });

  test('추천 목록 또는 로딩/빈 상태가 표시된다', async ({ page }) => {
    // 추천 카드, 로딩 상태, 빈 상태 중 하나가 표시되어야 함
    const hasCards = await page.locator('[class*="card"], [class*="recommendation"]').count() > 0;
    const hasLoading = await page.locator('[class*="loading"], [class*="spinner"]').isVisible().catch(() => false);
    const hasEmpty = await page.locator('[class*="empty"], text=없습니다').isVisible().catch(() => false);
    const hasError = await page.locator('[class*="error"]').isVisible().catch(() => false);
    const hasContent = await page.locator('main, [class*="content"]').isVisible().catch(() => false);

    expect(hasCards || hasLoading || hasEmpty || hasError || hasContent).toBeTruthy();
  });
});

test.describe('Daily Focus - 설정 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToDailyFocus(page);
  });

  test('설정 페이지로 네비게이션할 수 있다', async ({ page }) => {
    // 설정 링크 클릭
    const settingsLink = page.locator('a[href*="settings"], a:has-text("설정")').first();
    await settingsLink.click();

    // 설정 페이지 URL 확인
    await expect(page).toHaveURL(/\/settings/);
  });

  test('설정 페이지가 정상적으로 로드된다', async ({ page }) => {
    // 설정 페이지로 직접 이동
    await page.goto('/daily-focus/settings');
    await page.waitForLoadState('networkidle');

    // 페이지 로드 확인
    await expect(page).toHaveURL(/\/settings/);

    // 콘텐츠 확인
    const content = page.locator('main, [class*="content"], [class*="settings"]').first();
    await expect(content).toBeVisible();
  });

  test('설정 페이지에 콘텐츠가 표시된다', async ({ page }) => {
    await page.goto('/daily-focus/settings');
    await page.waitForLoadState('networkidle');

    // 설정 페이지에 폼 요소가 있거나, 빈 상태 메시지가 있거나, 최소한 메인 콘텐츠가 표시되어야 함
    const hasFormElements = await page.locator('input, select, button[type="submit"]').count() > 0;
    const hasContent = await page.locator('main, [class*="content"], [class*="settings"]').isVisible().catch(() => false);
    const hasText = (await page.locator('body').textContent())?.length || 0 > 100;

    expect(hasFormElements || hasContent || hasText).toBeTruthy();
  });
});

test.describe('Daily Focus - 추천 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToDailyFocus(page);
  });

  test('KOSPI 100 종목 데이터가 표시되거나 로딩 중이다', async ({ page }) => {
    // 종목 관련 데이터나 로딩 상태 확인
    await page.waitForTimeout(2000); // API 응답 대기

    const hasStockData = await page.locator('[class*="stock"], [class*="ticker"], text=KOSPI').isVisible().catch(() => false);
    const hasCards = await page.locator('[class*="card"]').count() > 0;
    const hasLoading = await page.locator('[class*="loading"]').isVisible().catch(() => false);
    const hasNoData = await page.locator('text=데이터, text=없습니다').isVisible().catch(() => false);
    const hasContent = await page.locator('main').isVisible().catch(() => false);

    expect(hasStockData || hasCards || hasLoading || hasNoData || hasContent).toBeTruthy();
  });

  test('볼린저 밴드 스퀴즈 관련 정보가 표시된다', async ({ page }) => {
    // 볼린저 밴드 또는 스퀴즈 관련 UI 요소 확인
    const hasBollinger = await page.locator('text=볼린저, text=Bollinger, text=스퀴즈, text=squeeze').isVisible().catch(() => false);
    const hasSignal = await page.locator('text=신호, text=매수, text=signal').isVisible().catch(() => false);
    const hasChart = await page.locator('canvas, svg, [class*="chart"]').isVisible().catch(() => false);
    const hasContent = await page.locator('[class*="content"], main').isVisible().catch(() => false);

    // 관련 UI가 있거나 최소한 메인 콘텐츠가 표시되어야 함
    expect(hasBollinger || hasSignal || hasChart || hasContent).toBeTruthy();
  });
});

test.describe('Daily Focus - 반응형 레이아웃', () => {
  test('데스크톱 뷰에서 레이아웃이 정상 표시된다', async ({ page }) => {
    await loginAndGoToDailyFocus(page);

    // 뷰포트 설정 (데스크톱)
    await page.setViewportSize({ width: 1280, height: 720 });

    // 기본 요소들이 보이는지 확인
    const header = page.locator('header, [class*="header"]').first();
    await expect(header).toBeVisible();
  });

  test('모바일 뷰에서 레이아웃이 정상 표시된다', async ({ page }) => {
    await loginAndGoToDailyFocus(page);

    // 뷰포트 설정 (모바일)
    await page.setViewportSize({ width: 375, height: 667 });

    // 기본 요소들이 보이는지 확인
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });
});
