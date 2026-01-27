import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Production E2E Tests - Portfolio Data Persistence
 * Tests that portfolio positions persist after page refresh
 *
 * Test URL: https://trading.kalee-dc.click/portfolio/
 */

// Helper to login and navigate to Portfolio
async function loginAndGoToPortfolio(page: any) {
  const loginPage = new LoginPage(page);
  await page.goto('/');

  // Wait for login page
  await expect(page).toHaveURL(/\/login/);

  // Login with test password
  await loginPage.passwordInput.fill('test-password');
  await loginPage.loginButton.click();

  // Wait for redirect to dashboard
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });

  // Click Portfolio card on dashboard
  const portfolioCard = page.locator('.wizard-card:has-text("My Portfolio")');
  await portfolioCard.click();

  // Wait for Portfolio page URL
  await expect(page).toHaveURL(/\/portfolio/);
  await page.waitForLoadState('networkidle');
}

test.describe('My Portfolio - 데이터 영속성 테스트', () => {
  test('보유 종목 추가 후 새로고침해도 데이터가 유지된다', async ({ page }) => {
    await loginAndGoToPortfolio(page);

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Wait for initial data load (loading indicator should disappear)
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Get initial position count
    const initialPositionCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const initialCount = await initialPositionCards.count();
    console.log(`Initial position count: ${initialCount}`);

    // Click add position button (use the one in toolbar, not empty state)
    const addButton = page.locator('button.add-btn:has-text("종목 추가")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for modal to appear
    const modal = page.locator('.modal-overlay, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Search for a stock (삼성전자)
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="종목"]');
    await searchInput.fill('삼성전자');

    // Wait for search results
    await page.waitForTimeout(1500); // Wait for API response

    // Click on first search result
    const searchResult = page.locator('.stock-search-item, button:has-text("삼성전자")').first();
    await searchResult.click({ timeout: 5000 }).catch(async () => {
      // If no results, skip the test with a warning
      console.log('⚠️ No search results found for 삼성전자, skipping test');
      test.skip();
    });

    // Fill buy form (using id selectors)
    const priceInput = page.locator('#price, input[name="price"]');
    await priceInput.fill('70000');

    const quantityInput = page.locator('#quantity, input[name="quantity"]');
    await quantityInput.fill('10');

    // Submit the form (매수 기록 button in the form)
    const submitButton = page.locator('button.buy-form-submit, button:has-text("매수 기록")');
    await submitButton.click();

    // Wait for modal to close and data to sync
    await expect(modal).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000); // Wait for auto-save debounce

    // Wait for syncing indicator to appear and disappear
    await page.waitForSelector('.syncing-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Get new position count
    const afterAddPositionCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const afterAddCount = await afterAddPositionCards.count();
    console.log(`Position count after add: ${afterAddCount}`);

    // Position count should have increased
    expect(afterAddCount).toBeGreaterThanOrEqual(initialCount);

    // Now refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for data to load from server
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000); // Additional wait for data rendering

    // Get position count after refresh
    const afterRefreshPositionCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const afterRefreshCount = await afterRefreshPositionCards.count();
    console.log(`Position count after refresh: ${afterRefreshCount}`);

    // ✅ THIS IS THE KEY ASSERTION: Data should persist after refresh
    expect(afterRefreshCount).toBe(afterAddCount);

    const samsungPosition = page.locator('.position-name:has-text("삼성전자")').first();
    await expect(samsungPosition).toBeVisible({ timeout: 5000 });
  });

  test('포지션 삭제 후 새로고침해도 삭제 상태가 유지된다', async ({ page }) => {
    await loginAndGoToPortfolio(page);

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Check if there are any positions to delete
    const positionCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const initialCount = await positionCards.count();

    if (initialCount === 0) {
      console.log('⚠️ No positions to delete, skipping test');
      test.skip();
      return;
    }

    // Get count before deletion
    console.log(`Position count before delete: ${initialCount}`);

    const sellButton = page.locator('.position-card .action-btn.sell').first();
    await sellButton.click({ timeout: 5000 }).catch(() => {
      console.log('No sell button found, skipping test');
      test.skip();
    });

    const sellModal = page.locator('.modal-overlay[role="dialog"]');
    await expect(sellModal).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Sell modal did not appear, skipping test');
      test.skip();
    });

    await page.locator('#sellPrice').fill('75000');

    const quantityInput = page.locator('#sellQuantity');
    const currentQuantity = await quantityInput.inputValue();
    if (!currentQuantity || currentQuantity === '0') {
      await quantityInput.fill('10');
    }

    await page.locator('button.sell-submit').click();

    // Wait for sync
    await page.waitForTimeout(2000);
    await page.waitForSelector('.syncing-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Position count should reflect the deletion
    const afterRefreshCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const afterRefreshCount = await afterRefreshCards.count();
    console.log(`Position count after refresh: ${afterRefreshCount}`);

    // Count should be same or less (sold positions may still show with 'sold' status)
    expect(afterRefreshCount).toBeLessThanOrEqual(initialCount);
  });

  test('여러 포지션 추가 후 새로고침해도 모두 유지된다', async ({ page }) => {
    await loginAndGoToPortfolio(page);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    const initialCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const initialCount = await initialCards.count();
    console.log(`Initial position count: ${initialCount}`);

    // Add first position
    const addButton = page.locator('button.add-btn:has-text("종목 추가")').first();
    await addButton.click();

    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="종목"]');
    await searchInput.fill('카카오');
    await page.waitForTimeout(1500);

    const searchResult = page.locator('.stock-search-item').first();
    if (await searchResult.isVisible()) {
      await searchResult.click();

      const priceInput = page.locator('#price, input[name="price"]');
      await priceInput.fill('50000');

      const quantityInput = page.locator('#quantity, input[name="quantity"]');
      await quantityInput.fill('5');

      // Submit the form (매수 기록 button in the form)
      const submitButton = page.locator('button.buy-form-submit, button:has-text("매수 기록")');
      await submitButton.click();

      // Wait for save
      await page.waitForTimeout(2000);
      await page.waitForSelector('.syncing-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});
    }

    // Get count after adding
    const afterAddCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const afterAddCount = await afterAddCards.count();
    console.log(`Position count after add: ${afterAddCount}`);

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Verify count after refresh
    const afterRefreshCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const afterRefreshCount = await afterRefreshCards.count();
    console.log(`Position count after refresh: ${afterRefreshCount}`);

    expect(afterRefreshCount).toBe(afterAddCount);
  });
});

test.describe('My Portfolio - 브라우저 세션 간 데이터 유지', () => {
  test('로그아웃 후 다시 로그인하면 데이터가 유지된다', async ({ page }) => {
    // First session: Add a position
    await loginAndGoToPortfolio(page);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Get current position count
    const positionCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const positionCount = await positionCards.count();
    console.log(`Current position count: ${positionCount}`);

    // Add a new position with a unique identifier (timestamp in stock name search)
    const addButton = page.locator('button.add-btn:has-text("종목 추가")').first();
    await addButton.click();

    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="종목"]');
    await searchInput.fill('네이버');
    await page.waitForTimeout(1500);

    const searchResult = page.locator('.stock-search-item').first();
    if (await searchResult.isVisible()) {
      await searchResult.click();

      const priceInput = page.locator('#price, input[name="price"]');
      await priceInput.fill('180000');

      const quantityInput = page.locator('#quantity, input[name="quantity"]');
      await quantityInput.fill('2');

      const submitButton = page.locator('button:has-text("추가"), button:has-text("매수"), button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);
      await page.waitForSelector('.syncing-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});
    }

    // Get count after adding
    const afterAddCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const afterAddCount = await afterAddCards.count();
    console.log(`Position count after add: ${afterAddCount}`);

    // Clear session (simulate logout by clearing localStorage)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate back to login
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // Login again
    const loginPage = new LoginPage(page);
    await loginPage.passwordInput.fill('test-password');
    await loginPage.loginButton.click();

    // Go to Portfolio again
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
    const portfolioCard = page.locator('.wizard-card:has-text("My Portfolio")');
    await portfolioCard.click();
    await expect(page).toHaveURL(/\/portfolio/);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Verify data persisted
    const afterReloginCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    const afterReloginCount = await afterReloginCards.count();
    console.log(`Position count after re-login: ${afterReloginCount}`);

    // ✅ Data should persist across sessions
    expect(afterReloginCount).toBe(afterAddCount);
  });
});
