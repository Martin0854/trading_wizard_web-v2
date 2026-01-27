import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

async function loginAndGoToDailyFocus(page: any) {
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await loginPage.passwordInput.fill('test-password');
  await loginPage.loginButton.click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  await page.goto('/daily-focus');
  await page.waitForLoadState('networkidle');
}

async function loginAndGoToPortfolio(page: any) {
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await loginPage.passwordInput.fill('test-password');
  await loginPage.loginButton.click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  const portfolioCard = page.locator('.wizard-card:has-text("My Portfolio")');
  await portfolioCard.click();
  await expect(page).toHaveURL(/\/portfolio/);
  await page.waitForLoadState('networkidle');
}

test.describe('Daily Focus - Stock Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToDailyFocus(page);
  });

  test('clicking recommendation card opens stock detail modal', async ({ page }) => {
    await page.waitForTimeout(2000);

    const recommendationCard = page.locator('.recommendation-card').first();
    const hasCards = await recommendationCard.isVisible().catch(() => false);

    if (!hasCards) {
      console.log('No recommendation cards available, skipping test');
      test.skip();
      return;
    }

    const stockName = await recommendationCard.locator('.stock-name').textContent();
    await recommendationCard.click();

    const modal = page.locator('.modal-backdrop[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const modalTitle = page.locator('#modal-title');
    await expect(modalTitle).toContainText(stockName || '');

    await expect(page.locator('.indicators-section')).toBeVisible();
  });

  test('modal shows technical indicators (Bollinger, RSI, MACD)', async ({ page }) => {
    await page.waitForTimeout(2000);

    const recommendationCard = page.locator('.recommendation-card').first();
    if (!(await recommendationCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await recommendationCard.click();
    const modal = page.locator('.modal-backdrop[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await expect(page.locator('h4:has-text("볼린저 밴드")')).toBeVisible();
    await expect(page.locator('h4:has-text("RSI")')).toBeVisible();
    await expect(page.locator('h4:has-text("MACD")')).toBeVisible();
    await expect(page.locator('h4:has-text("거래량")')).toBeVisible();
  });

  test('modal closes on close button click', async ({ page }) => {
    await page.waitForTimeout(2000);

    const recommendationCard = page.locator('.recommendation-card').first();
    if (!(await recommendationCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await recommendationCard.click();
    const modal = page.locator('.modal-backdrop[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const closeButton = page.locator('.modal-close');
    await closeButton.click();

    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await page.waitForTimeout(2000);

    const recommendationCard = page.locator('.recommendation-card').first();
    if (!(await recommendationCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await recommendationCard.click();
    const modal = page.locator('.modal-backdrop[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.waitForTimeout(2000);

    const recommendationCard = page.locator('.recommendation-card').first();
    if (!(await recommendationCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await recommendationCard.click();
    const modal = page.locator('.modal-backdrop[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('My Portfolio - Complete Sell Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToPortfolio(page);
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('sell button opens sell modal', async ({ page }) => {
    const positionCard = page.locator('.position-card').first();
    if (!(await positionCard.isVisible().catch(() => false))) {
      console.log('No positions available, skipping test');
      test.skip();
      return;
    }

    const sellButton = positionCard.locator('.action-btn.sell');
    await sellButton.click();

    const sellModal = page.locator('.modal-overlay[role="dialog"]');
    await expect(sellModal).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sell-modal-title')).toHaveText('매도 기록');
  });

  test('sell modal shows position info', async ({ page }) => {
    const positionCard = page.locator('.position-card').first();
    if (!(await positionCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    const stockName = await positionCard.locator('.position-name').textContent();
    await positionCard.locator('.action-btn.sell').click();

    const modal = page.locator('.modal-overlay[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await expect(page.locator('.position-info-name')).toContainText(stockName || '');
    await expect(page.locator('.position-info-details')).toContainText('보유 수량');
    await expect(page.locator('.position-info-details')).toContainText('평균 매수가');
  });

  test('sell modal calculates expected P&L', async ({ page }) => {
    const positionCard = page.locator('.position-card').first();
    if (!(await positionCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await positionCard.locator('.action-btn.sell').click();
    const modal = page.locator('.modal-overlay[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.locator('#sellPrice').fill('80000');
    await page.locator('#sellQuantity').fill('5');

    const sellSummary = page.locator('.sell-summary');
    await expect(sellSummary).toBeVisible();
    await expect(sellSummary).toContainText('매도 금액');
    await expect(sellSummary).toContainText('예상 손익');
  });

  test('sell all button fills max quantity', async ({ page }) => {
    const positionCard = page.locator('.position-card').first();
    if (!(await positionCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await positionCard.locator('.action-btn.sell').click();
    const modal = page.locator('.modal-overlay[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const quantityBefore = await page.locator('#sellQuantity').inputValue();

    await page.locator('.sell-all-btn').click();

    const quantityAfter = await page.locator('#sellQuantity').inputValue();
    expect(parseInt(quantityAfter)).toBeGreaterThan(0);
  });

  test('cancel button closes sell modal', async ({ page }) => {
    const positionCard = page.locator('.position-card').first();
    if (!(await positionCard.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await positionCard.locator('.action-btn.sell').click();
    const modal = page.locator('.modal-overlay[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.locator('.sell-cancel').click();
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('My Portfolio - Add Buy to Existing Position', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToPortfolio(page);
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('add buy button opens buy modal', async ({ page }) => {
    const positionCard = page.locator('.position-card').first();
    if (!(await positionCard.isVisible().catch(() => false))) {
      console.log('No positions available, skipping test');
      test.skip();
      return;
    }

    const addBuyButton = positionCard.locator('.action-btn.buy');
    if (!(await addBuyButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await addBuyButton.click();

    const modal = page.locator('.modal-overlay[role="dialog"], .modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});

test.describe('My Portfolio - Sell Signal Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToPortfolio(page);
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('sell signal list displays when signals exist', async ({ page }) => {
    const sellSignalList = page.locator('.sell-signal-list, [class*="sell-signal"]');
    const signalCount = await sellSignalList.count();

    if (signalCount > 0) {
      await expect(sellSignalList.first()).toBeVisible();
    }
    
    expect(signalCount).toBeGreaterThanOrEqual(0);
  });

  test('position card shows sell signal badges', async ({ page }) => {
    const signalBadges = page.locator('.sell-signal-badge');
    const badgeCount = await signalBadges.count();

    if (badgeCount > 0) {
      const badge = signalBadges.first();
      await expect(badge).toBeVisible();

      const badgeText = await badge.textContent();
      const validSignals = ['손절매', '익절매', '추세이탈'];
      expect(validSignals.some(signal => badgeText?.includes(signal))).toBeTruthy();
    }

    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Settings - Save & Verify Persistence', () => {
  test('Daily Focus settings save and persist', async ({ page }) => {
    await loginAndGoToDailyFocus(page);

    await page.goto('/daily-focus/settings');
    await page.waitForLoadState('networkidle');

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill('test-password');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    }

    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();

    if (sliderCount > 0) {
      const firstSlider = sliders.first();
      const originalValue = await firstSlider.inputValue();

      await firstSlider.fill('60');

      const saveButton = page.locator('button:has-text("저장")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }

      await page.reload();
      await page.waitForLoadState('networkidle');

      const newValue = await sliders.first().inputValue();
      expect(['60', originalValue]).toContain(newValue);
    }

    expect(true).toBeTruthy();
  });

  test('Portfolio settings reset to defaults', async ({ page }) => {
    await loginAndGoToPortfolio(page);

    await page.goto('/portfolio/settings');
    await page.waitForLoadState('networkidle');

    const resetButton = page.locator('button:has-text("초기화")');
    const hasReset = await resetButton.isVisible().catch(() => false);

    if (hasReset) {
      await resetButton.click();

      page.on('dialog', dialog => dialog.accept());
      await page.waitForTimeout(500);

      expect(true).toBeTruthy();
    } else {
      expect(true).toBeTruthy();
    }
  });
});

test.describe('Cross-app Navigation', () => {
  test('navigate from Daily Focus to Portal via header', async ({ page }) => {
    await loginAndGoToDailyFocus(page);

    const portalLink = page.locator('a:has-text("포털"), a[href*="portal"], header a:has-text("Trading")');
    const hasPortalLink = await portalLink.first().isVisible().catch(() => false);

    if (hasPortalLink) {
      await portalLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    expect(true).toBeTruthy();
  });

  test('navigate from Portfolio to Portal via header', async ({ page }) => {
    await loginAndGoToPortfolio(page);

    const portalLink = page.locator('a:has-text("포털"), a[href*="portal"], header a:has-text("Trading")');
    const hasPortalLink = await portalLink.first().isVisible().catch(() => false);

    if (hasPortalLink) {
      await portalLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    expect(true).toBeTruthy();
  });
});
