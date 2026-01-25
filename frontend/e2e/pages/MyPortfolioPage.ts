import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for My Portfolio App
 */
export class MyPortfolioPage {
  readonly page: Page;
  readonly header: Locator;
  readonly headerTitle: Locator;
  readonly navLinks: Locator;
  readonly mainContent: Locator;
  readonly footer: Locator;
  readonly positionList: Locator;
  readonly positionCards: Locator;
  readonly emptyState: Locator;
  readonly addPositionButton: Locator;
  readonly addPositionModal: Locator;
  readonly dashboardSummary: Locator;
  readonly portfolioAllocation: Locator;
  readonly sellSignalList: Locator;
  readonly settingsLink: Locator;
  readonly stockSearchInput: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.headerTitle = page.locator('header a').first();
    this.navLinks = page.locator('nav a, header a');
    this.mainContent = page.locator('main').first();
    this.footer = page.locator('footer');
    this.positionList = page.locator('[class*="position-list"], [data-testid="position-list"]');
    this.positionCards = page.locator('[class*="position-card"], [data-testid="position-card"]');
    this.emptyState = page.locator('[class*="empty-state"], [data-testid="empty-state"]');
    this.addPositionButton = page.locator('button:has-text("추가"), button:has-text("포지션"), [data-testid="add-position"]');
    this.addPositionModal = page.locator('[class*="modal"], [data-testid="add-position-modal"]');
    this.dashboardSummary = page.locator('[class*="dashboard-summary"], [data-testid="dashboard-summary"]');
    this.portfolioAllocation = page.locator('[class*="portfolio-allocation"], [data-testid="portfolio-allocation"]');
    this.sellSignalList = page.locator('[class*="sell-signal"], [data-testid="sell-signal-list"]');
    this.settingsLink = page.locator('a[href="/settings"]');
    this.stockSearchInput = page.locator('input[type="text"], input[placeholder*="검색"], input[placeholder*="종목"]');
    this.loadingIndicator = page.locator('[class*="loading"], [data-testid="loading"]');
  }

  async goto() {
    await this.page.goto('/portfolio');
  }

  async gotoSettings() {
    await this.page.goto('/settings');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getPositionCount(): Promise<number> {
    return await this.positionCards.count();
  }

  async clickAddPosition() {
    await this.addPositionButton.click();
  }

  async navigateToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL('/settings');
  }

  async searchStock(query: string) {
    await this.stockSearchInput.first().fill(query);
  }
}
