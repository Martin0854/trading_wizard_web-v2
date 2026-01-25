import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Login Page
 */
export class LoginPage {
  readonly page: Page;
  readonly passwordTab: Locator;
  readonly pemTab: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('text=Trading Wizard');
    this.passwordTab = page.locator('button:has-text("비밀번호"), [role="tab"]:has-text("비밀번호")');
    this.pemTab = page.locator('button:has-text("PEM"), [role="tab"]:has-text("PEM")');
    this.passwordInput = page.locator('input[type="password"], input[placeholder*="비밀번호"]');
    this.loginButton = page.locator('button:has-text("로그인")');
    this.errorMessage = page.locator('[class*="error"], [role="alert"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async isLoginPage(): Promise<boolean> {
    return this.page.url().includes('/login');
  }

  async loginWithPassword(password: string) {
    await this.passwordTab.click().catch(() => {}); // Tab might already be selected
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async waitForRedirect(url: string, timeout: number = 10000) {
    await this.page.waitForURL(url, { timeout });
  }
}
