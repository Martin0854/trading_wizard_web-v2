import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Daily Focus App
 */
export class DailyFocusPage {
  readonly page: Page;
  readonly header: Locator;
  readonly headerTitle: Locator;
  readonly navLinks: Locator;
  readonly mainContent: Locator;
  readonly footer: Locator;
  readonly recommendationList: Locator;
  readonly recommendationCards: Locator;
  readonly emptyState: Locator;
  readonly settingsLink: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.headerTitle = page.locator('header a').first();
    this.navLinks = page.locator('nav a, header a');
    this.mainContent = page.locator('main');
    this.footer = page.locator('footer');
    this.recommendationList = page.locator('[class*="recommendation-list"], [data-testid="recommendation-list"]');
    this.recommendationCards = page.locator('[class*="recommendation-card"], [data-testid="recommendation-card"]');
    this.emptyState = page.locator('[class*="empty-state"], [data-testid="empty-state"]');
    this.settingsLink = page.locator('a[href="/settings"]');
    this.loadingIndicator = page.locator('[class*="loading"], .home-page.loading');
  }

  async goto() {
    await this.page.goto('/');
  }

  async gotoSettings() {
    await this.page.goto('/settings');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getRecommendationCount(): Promise<number> {
    return await this.recommendationCards.count();
  }

  async clickRecommendationCard(index: number = 0) {
    await this.recommendationCards.nth(index).click();
  }

  async navigateToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL('/settings');
  }
}
