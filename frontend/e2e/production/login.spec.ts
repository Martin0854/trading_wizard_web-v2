import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Production E2E Tests - Login Flow
 * Tests against the deployed application at https://trading.kalee-dc.click/
 */
test.describe('Trading Wizard - 로그인 페이지', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.goto('/');
  });

  test('비인증 사용자는 로그인 페이지로 리다이렉트된다', async ({ page }) => {
    // 루트로 접근하면 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    // 타이틀 확인
    await expect(loginPage.title).toBeVisible();

    // 로그인 버튼 확인
    await expect(loginPage.loginButton).toBeVisible();

    // 비밀번호 입력 필드 확인
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('비밀번호 탭과 PEM 파일 탭이 표시된다', async ({ page }) => {
    // 비밀번호 탭
    const passwordTab = page.locator('button.auth-tab:has-text("비밀번호")');
    await expect(passwordTab).toBeVisible();

    // PEM 파일 탭
    const pemTab = page.locator('button.auth-tab:has-text("PEM 파일")');
    await expect(pemTab).toBeVisible();
  });

  test('빈 비밀번호일 때 로그인 버튼이 비활성화된다', async ({ page }) => {
    // 버튼이 비활성화 상태인지 확인
    await expect(loginPage.loginButton).toBeDisabled();

    // 페이지는 여전히 로그인 페이지
    await expect(page).toHaveURL(/\/login/);
  });

  test('PEM 파일 탭으로 전환할 수 있다', async ({ page }) => {
    // PEM 탭 클릭 (auth-tab 클래스로 구체화)
    const pemTab = page.locator('button.auth-tab:has-text("PEM 파일")');
    await pemTab.click();

    // PEM 탭이 활성화되었는지 확인 (active 클래스)
    await expect(pemTab).toHaveClass(/active/);
  });

  test('투자 면책 조항이 로그인 페이지에 표시된다', async ({ page }) => {
    // 면책 조항 텍스트 확인
    const disclaimerText = page.locator('body');
    const bodyText = await disclaimerText.textContent();

    // 암호화, 보안 또는 투자 관련 텍스트 확인
    const hasDisclaimer = bodyText?.includes('암호화') ||
                          bodyText?.includes('투자') ||
                          bodyText?.includes('책임') ||
                          bodyText?.includes('보관');

    expect(hasDisclaimer).toBeTruthy();
  });

  test('PEM 키 생성 링크가 표시된다', async ({ page }) => {
    // PEM 탭으로 전환
    const pemTab = page.locator('button.auth-tab:has-text("PEM 파일")');
    await pemTab.click();

    // PEM 키 생성 링크 확인
    const generateLink = page.locator('button:has-text("PEM 키가 없으신가요")');
    await expect(generateLink).toBeVisible();
  });
});
