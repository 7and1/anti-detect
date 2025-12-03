import { test, expect } from '@playwright/test';

test.describe('Tools Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
  });

  test('should display tools page', async ({ page }) => {
    await expect(page).toHaveTitle(/Tools/);
    await expect(page.locator('h1')).toContainText('Tools');
  });

  test('should show all tool categories', async ({ page }) => {
    await expect(page.locator('text=Fingerprint Tests')).toBeVisible();
    await expect(page.locator('text=Network & Security')).toBeVisible();
    await expect(page.locator('text=Analysis & Generation')).toBeVisible();
  });

  test('should have clickable tool cards', async ({ page }) => {
    const canvasTool = page.getByRole('link', { name: /Canvas Fingerprint/i });
    await expect(canvasTool).toBeVisible();
    await expect(canvasTool).toHaveAttribute('href', '/tools/canvas');
  });

  test('should navigate to canvas tool', async ({ page }) => {
    const canvasTool = page.getByRole('link', { name: /Canvas Fingerprint/i });
    await canvasTool.click();

    await expect(page).toHaveURL(/\/tools\/canvas/);
    await expect(page.locator('h1')).toContainText('Canvas');
  });

  test('should navigate to WebGL tool', async ({ page }) => {
    const webglTool = page.getByRole('link', { name: /WebGL/i });
    await webglTool.click();

    await expect(page).toHaveURL(/\/tools\/webgl/);
  });

  test('should navigate to WebRTC tool', async ({ page }) => {
    const webrtcTool = page.getByRole('link', { name: /WebRTC/i });
    await webrtcTool.click();

    await expect(page).toHaveURL(/\/tools\/webrtc/);
  });

  test('should show live status badges', async ({ page }) => {
    // All tools should be marked as live
    const liveTools = page.locator('[data-status="live"]');
    const count = await liveTools.count();
    expect(count).toBeGreaterThan(8); // At least 9 live tools
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Tools should still be visible in grid
    const canvasTool = page.getByRole('link', { name: /Canvas Fingerprint/i });
    await expect(canvasTool).toBeVisible();
  });
});

test.describe('Individual Tool Tests', () => {
  test('Canvas tool should generate fingerprint', async ({ page }) => {
    await page.goto('/tools/canvas');

    // Should automatically run or have a test button
    await page.waitForSelector('[data-testid="canvas-hash"]', { timeout: 5000 });

    const hash = page.locator('[data-testid="canvas-hash"]');
    await expect(hash).toBeVisible();
    const hashText = await hash.textContent();
    expect(hashText?.length).toBeGreaterThan(10);
  });

  test('WebRTC tool should detect IPs', async ({ page }) => {
    await page.goto('/tools/webrtc');

    await page.waitForSelector('[data-testid="ip-detected"]', { timeout: 10000 });

    const ipElement = page.locator('[data-testid="ip-detected"]');
    await expect(ipElement).toBeVisible();
  });

  test('Bot detection tool should run checks', async ({ page }) => {
    await page.goto('/tools/bot');

    await page.waitForSelector('[data-testid="bot-score"]', { timeout: 10000 });

    const score = page.locator('[data-testid="bot-score"]');
    await expect(score).toBeVisible();
  });

  test('Headers tool should show headers', async ({ page }) => {
    await page.goto('/tools/headers');

    await page.waitForSelector('[data-testid="headers-list"]', { timeout: 10000 });

    const headers = page.locator('[data-testid="header-item"]');
    const count = await headers.count();
    expect(count).toBeGreaterThan(3); // Should have multiple headers
  });
});
