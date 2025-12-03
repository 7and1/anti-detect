import { test, expect } from '@playwright/test';

test.describe('Challenge Arena', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/challenge');
  });

  test('should display challenge page', async ({ page }) => {
    await expect(page).toHaveTitle(/Challenge/);
    await expect(page.locator('h1')).toContainText('Challenge');
  });

  test('should show all challenge levels', async ({ page }) => {
    await expect(page.locator('text=Basic JS')).toBeVisible();
    await expect(page.locator('text=Headless Hunter')).toBeVisible();
    await expect(page.locator('text=TLS Inspector')).toBeVisible();
    await expect(page.locator('text=Human Verification')).toBeVisible();
  });

  test('should have start button', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await expect(startButton).toBeVisible();
  });

  test('should run challenge when started', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();

    // Should show running state
    await expect(page.locator('[data-testid="challenge-running"]')).toBeVisible();
  });

  test('should complete all levels', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();

    // Wait for completion (may take up to 10 seconds for all 4 levels)
    await page.waitForSelector('[data-testid="challenge-complete"]', { timeout: 15000 });

    // Should show results
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
  });

  test('should show verdict', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();

    await page.waitForSelector('[data-testid="challenge-complete"]', { timeout: 15000 });

    // Should show verdict (HUMAN, SUSPICIOUS, or LIKELY BOT)
    const verdict = page.locator('[data-testid="verdict"]');
    await expect(verdict).toBeVisible();
    const verdictText = await verdict.textContent();
    expect(['HUMAN', 'SUSPICIOUS', 'LIKELY BOT']).toContain(verdictText);
  });

  test('should display level scores', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();

    await page.waitForSelector('[data-testid="challenge-complete"]', { timeout: 15000 });

    // Each level should have a score
    const scores = page.locator('[data-testid="level-score"]');
    const count = await scores.count();
    expect(count).toBe(4); // 4 levels
  });

  test('should show level checks', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();

    await page.waitForSelector('[data-testid="challenge-complete"]', { timeout: 15000 });

    // Should show individual checks
    const checks = page.locator('[data-testid="check-item"]');
    const count = await checks.count();
    expect(count).toBeGreaterThan(5); // Multiple checks across levels
  });

  test('should allow retrying', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();

    await page.waitForSelector('[data-testid="challenge-complete"]', { timeout: 15000 });

    // Should have retry button
    const retryButton = page.getByRole('button', { name: /again|retry/i });
    await expect(retryButton).toBeVisible();
  });
});
