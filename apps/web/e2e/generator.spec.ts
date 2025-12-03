import { test, expect } from '@playwright/test';

test.describe('Profile Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/generator');
  });

  test('should display generator page', async ({ page }) => {
    await expect(page).toHaveTitle(/Generator/);
    await expect(page.locator('h1')).toContainText('Generator');
  });

  test('should have OS selection', async ({ page }) => {
    const osSelect = page.locator('[data-testid="os-select"]');
    await expect(osSelect).toBeVisible();
  });

  test('should have browser selection', async ({ page }) => {
    const browserSelect = page.locator('[data-testid="browser-select"]');
    await expect(browserSelect).toBeVisible();
  });

  test('should have quality selection', async ({ page }) => {
    const qualitySelect = page.locator('[data-testid="quality-select"]');
    await expect(qualitySelect).toBeVisible();
  });

  test('should generate fingerprint', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    // Wait for generation
    await page.waitForSelector('[data-testid="generated-fingerprint"]', { timeout: 10000 });

    // Should show generated data
    await expect(page.locator('[data-testid="user-agent"]')).toBeVisible();
  });

  test('should filter by OS', async ({ page }) => {
    // Select Windows
    await page.selectOption('[data-testid="os-select"]', 'Windows');

    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    await page.waitForSelector('[data-testid="generated-fingerprint"]', { timeout: 10000 });

    // User agent should contain Windows
    const userAgent = await page.locator('[data-testid="user-agent"]').textContent();
    expect(userAgent).toContain('Windows');
  });

  test('should export to different formats', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    await page.waitForSelector('[data-testid="generated-fingerprint"]', { timeout: 10000 });

    // Select Puppeteer export format
    await page.selectOption('[data-testid="export-format"]', 'puppeteer');

    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();

    // Should show code export
    const codeBlock = page.locator('[data-testid="export-code"]');
    await expect(codeBlock).toBeVisible();
    const code = await codeBlock.textContent();
    expect(code).toContain('puppeteer');
  });

  test('should copy export code', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    await page.waitForSelector('[data-testid="generated-fingerprint"]', { timeout: 10000 });

    const copyButton = page.getByRole('button', { name: /copy/i });
    await copyButton.click();

    // Should show copied confirmation
    await expect(page.locator('text=Copied')).toBeVisible();
  });

  test('should handle generation errors', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/generate*', (route) => {
      route.fulfill({
        status: 404,
        body: JSON.stringify({ error: 'No fingerprint found' }),
      });
    });

    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
