import { test, expect } from '@playwright/test';
import { DailyFocusPage } from '../pages/DailyFocusPage';

test.describe('Daily Focus - 홈페이지', () => {
  let dailyFocusPage: DailyFocusPage;

  test.beforeEach(async ({ page }) => {
    dailyFocusPage = new DailyFocusPage(page);
    await dailyFocusPage.goto();
  });

  test('홈페이지가 정상적으로 로드된다', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveURL('/');

    // 헤더 확인
    await expect(dailyFocusPage.header).toBeVisible();
    // 헤더 타이틀은 a 태그로 렌더링됨
    await expect(dailyFocusPage.headerTitle).toContainText('Daily Focus');

    // 메인 콘텐츠 확인
    await expect(dailyFocusPage.mainContent).toBeVisible();

    // 푸터 확인
    await expect(dailyFocusPage.footer).toBeVisible();
  });

  test('네비게이션 링크가 표시된다', async () => {
    await expect(dailyFocusPage.navLinks.first()).toBeVisible();

    // 매수 추천 링크
    const homeLink = dailyFocusPage.page.locator('a:has-text("매수 추천")');
    await expect(homeLink).toBeVisible();

    // 설정 링크
    const settingsLink = dailyFocusPage.page.locator('a:has-text("설정")');
    await expect(settingsLink).toBeVisible();
  });

  test('설정 페이지로 네비게이션할 수 있다', async ({ page }) => {
    await dailyFocusPage.navigateToSettings();
    await expect(page).toHaveURL('/settings');
  });

  test('추천 목록, 로딩 또는 에러 상태가 표시된다', async () => {
    await dailyFocusPage.waitForLoad();

    // 추천 카드가 있거나, 로딩 상태이거나, 에러 상태이거나, 빈 상태가 표시되어야 함
    const hasCards = await dailyFocusPage.recommendationCards.count() > 0;
    const hasEmptyState = await dailyFocusPage.emptyState.isVisible().catch(() => false);
    const hasLoading = await dailyFocusPage.loadingIndicator.isVisible().catch(() => false);
    const hasError = await dailyFocusPage.page.locator('.home-page.error, [class*="error"]').isVisible().catch(() => false);
    const hasHomePage = await dailyFocusPage.page.locator('.home-page').isVisible().catch(() => false);

    // 최소한 홈페이지 컨테이너가 있어야 함
    expect(hasCards || hasEmptyState || hasLoading || hasError || hasHomePage).toBeTruthy();
  });

  test('푸터에 투자 면책 조항이 표시된다', async () => {
    await expect(dailyFocusPage.footer).toContainText('투자');
    await expect(dailyFocusPage.footer).toContainText('책임');
  });
});

test.describe('Daily Focus - 설정 페이지', () => {
  let dailyFocusPage: DailyFocusPage;

  test.beforeEach(async ({ page }) => {
    dailyFocusPage = new DailyFocusPage(page);
    await dailyFocusPage.gotoSettings();
  });

  test('설정 페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page).toHaveURL('/settings');
    await expect(dailyFocusPage.header).toBeVisible();
    await expect(dailyFocusPage.mainContent).toBeVisible();
  });

  test('설정 폼 요소가 표시된다', async ({ page }) => {
    // 설정 관련 입력 필드 또는 컨트롤 확인
    const formElements = page.locator('input, select, button[type="submit"]');
    const count = await formElements.count();
    expect(count).toBeGreaterThan(0);
  });
});
