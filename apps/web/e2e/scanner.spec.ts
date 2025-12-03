import { test, expect } from '@playwright/test';

test.describe('Fingerprint Scanner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display scanner page', async ({ page }) => {
    await expect(page).toHaveTitle(/Anti-Detect/);
    await expect(page.locator('h1')).toContainText('Browser');
  });

  test('should have scan button', async ({ page }) => {
    const scanButton = page.getByRole('button', { name: /scan/i });
    await expect(scanButton).toBeVisible();
  });

  test('should start scanning when button clicked', async ({ page }) => {
    const scanButton = page.getByRole('button', { name: /scan/i });
    await scanButton.click();

    // Should show loading state
    await expect(page.locator('[data-testid="scan-progress"]')).toBeVisible();
  });

  test('should display results after scanning', async ({ page }) => {
    const scanButton = page.getByRole('button', { name: /scan/i });
    await scanButton.click();

    // Wait for results (timeout 30s)
    await page.waitForSelector('[data-testid="scan-results"]', { timeout: 30000 });

    // Should show fingerprint hash
    await expect(page.locator('[data-testid="fingerprint-hash"]')).toBeVisible();
  });

  test('should display protection score', async ({ page }) => {
    const scanButton = page.getByRole('button', { name: /scan/i });
    await scanButton.click();

    await page.waitForSelector('[data-testid="scan-results"]', { timeout: 30000 });

    // Should show protection score
    const scoreElement = page.locator('[data-testid="protection-score"]');
    await expect(scoreElement).toBeVisible();
    const scoreText = await scoreElement.textContent();
    expect(scoreText).toMatch(/\d+/); // Should contain a number
  });

  test('should navigate to tools page', async ({ page }) => {
    const toolsLink = page.getByRole('link', { name: /tools/i });
    await toolsLink.click();

    await expect(page).toHaveURL(/\/tools/);
  });

  test('should navigate to learn page', async ({ page }) => {
    const learnLink = page.getByRole('link', { name: /learn/i });
    await learnLink.click();

    await expect(page).toHaveURL(/\/learn/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const scanButton = page.getByRole('button', { name: /scan/i });
    await expect(scanButton).toBeVisible();
  });

  test('should handle scan errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/scan', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    const scanButton = page.getByRole('button', { name: /scan/i });
    await scanButton.click();

    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
