import { test, expect } from '@playwright/test';

test.describe('Automation & Webhooks', () => {
  test.beforeEach(async ({ page }) => {
    const now = Date.now();
    const sampleTasks = [
      {
        id: 'task-home-1',
        name: 'Nightly Scanner',
        status: 'scheduled',
        cadence: 'daily',
        nextRunAt: now + 60 * 60 * 1000,
        lastRunAt: now - 2 * 60 * 60 * 1000,
        targets: [{ label: 'Main Batch', batchSize: 120 }],
        createdAt: now - 24 * 60 * 60 * 1000,
        updatedAt: now,
      },
    ];
    const sampleWebhooks = [
      {
        id: 'webhook-home-1',
        name: 'Ops SIEM',
        url: 'https://example.com/hooks/siem',
        status: 'active',
        events: ['automation.run.completed'],
        createdAt: now - 12 * 60 * 60 * 1000,
        updatedAt: now,
      },
    ];

    await page.route('**/tasks*', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tasks: sampleTasks }),
        });
      }
      return route.continue();
    });

    await page.route('**/webhooks*', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ webhooks: sampleWebhooks }),
        });
      }
      return route.continue();
    });

    await page.goto('/automation');
  });

  test('should display automation page with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Automation');
    await expect(page.locator('text=Schedule recurring scanner batches')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await expect(page.getByTestId('stat-card-total-tasks')).toBeVisible();
    await expect(page.getByTestId('stat-card-scheduled')).toBeVisible();
    await expect(page.getByTestId('stat-card-queued')).toBeVisible();
    await expect(page.getByTestId('stat-card-next-run')).toBeVisible();
  });

  test('should display task scheduling form', async ({ page }) => {
    await expect(page.locator('text=Schedule batch scans')).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Task name' }).first()).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Cadence' }).first()).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Batch size' }).first()).toBeVisible();
  });

  test('should display webhook routing section', async ({ page }) => {
    await expect(page.locator('text=Webhook routing')).toBeVisible();
    await expect(page.locator('text=Endpoint URL')).toBeVisible();
  });

  test('should display dispatch queue table', async ({ page }) => {
    const table = page.locator('[data-testid="automation-task-table"]');
    await expect(table).toBeVisible();

    // Check table headers
    await expect(page.locator('th:has-text("Task")')).toBeVisible();
    await expect(page.locator('th:has-text("Cadence")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Next run")')).toBeVisible();
  });
});

test.describe('Task Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/tasks*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tasks: [] }),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'task-new-123',
            name: 'Test Task',
            status: 'scheduled',
            cadence: 'interval',
            schedule: { intervalMinutes: 30 },
            targets: [{ type: 'scan', label: 'Test Batch', batchSize: 50 }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
        });
      }
    });

    await page.route('**/webhooks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ webhooks: [] }),
      });
    });

    await page.goto('/automation');
  });

  test('should create a new automation task', async ({ page }) => {
    // Fill task name
    await page.fill('input[value="Weekly drift audit"]', 'E2E Test Task');

    // Select cadence
    await page.selectOption('select', 'interval');

    // Set interval
    await page.fill('input[type="number"][min="15"]', '60');

    // Set batch size
    await page.fill('input[type="number"][min="10"]', '100');

    // Submit form
    const submitButton = page.locator('[data-testid="automation-task-submit"]');
    await submitButton.click();

    // Should show success message
    await expect(page.locator('text=Automation task scheduled')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Clear task name
    await page.fill('input[value="Weekly drift audit"]', '');

    // Try to submit
    const submitButton = page.locator('[data-testid="automation-task-submit"]');
    await submitButton.click();

    // Form should not submit due to HTML5 validation
    // Check that success message is NOT shown
    await expect(page.locator('text=Automation task scheduled')).not.toBeVisible();
  });

  test('should support different cadence options', async ({ page }) => {
    const cadenceSelect = page.locator('select').first();

    // Check all cadence options are available
    await expect(cadenceSelect.locator('option[value="interval"]')).toBeAttached();
    await expect(cadenceSelect.locator('option[value="hourly"]')).toBeAttached();
    await expect(cadenceSelect.locator('option[value="daily"]')).toBeAttached();
    await expect(cadenceSelect.locator('option[value="cron"]')).toBeAttached();
    await expect(cadenceSelect.locator('option[value="manual"]')).toBeAttached();
  });
});

test.describe('Webhook Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/tasks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [] }),
      });
    });

    await page.route('**/webhooks*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            webhooks: [
              {
                id: 'webhook-1',
                name: 'Test Webhook',
                url: 'https://example.com/hook',
                status: 'active',
                events: ['automation.run.completed'],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          }),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'webhook-new',
            name: 'New Webhook',
            url: 'https://siem.example.com/ingest',
            status: 'active',
            events: ['automation.run.completed', 'automation.run.failed'],
            createdAt: Date.now(),
          }),
        });
      }
    });

    await page.goto('/automation');
  });

  test('should display existing webhooks', async ({ page }) => {
    await expect(page.locator('text=Test Webhook')).toBeVisible();
    await expect(page.locator('text=https://example.com/hook')).toBeVisible();
  });

  test('should create a new webhook subscription', async ({ page }) => {
    // Fill webhook name
    const webhookNameInput = page.locator('[data-testid="webhook-name-input"]');
    await webhookNameInput.fill('SIEM Integration');

    // Fill URL
    await page.fill('[data-testid="webhook-url-input"]', 'https://siem.example.com/ingest');

    // Submit webhook form
    await page.click('button:has-text("Save Webhook")');

    // Should show success
    const statusMessage = page.locator('[data-testid="webhook-status"]');
    await expect(statusMessage).toHaveText(/Webhook saved/);
  });

  test('should test webhook connectivity', async ({ page }) => {
    await page.route('**/webhooks/test', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, status: 200 }),
      });
    });

    // Fill webhook URL for testing
    await page.fill('[data-testid="webhook-url-input"]', 'https://test.example.com/webhook');

    // Click test button
    const testButton = page.locator('[data-testid="webhook-test-button"]');
    await testButton.click();

    // Should show test status
    const statusElement = page.locator('[data-testid="webhook-status"]');
    await expect(statusElement).toHaveText(/Webhook responded/);
  });

  test('should show event checkboxes', async ({ page }) => {
    // Check event options are displayed
    await expect(page.locator('text=automation.run.completed')).toBeVisible();
    await expect(page.locator('text=automation.run.failed')).toBeVisible();
  });

  test('should allow triggering test on existing webhook', async ({ page }) => {
    await page.route('**/webhooks/*/test', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ delivery: { status: 'delivered' } }),
      });
    });

    // Find and click trigger button for existing webhook
    const triggerButton = page.locator('button:has-text("Trigger test")').first();
    await triggerButton.click();

    // Should update status
    await expect(page.locator('text=Triggered Test Webhook')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Task Queue Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/tasks*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tasks: [
              {
                id: 'task-1',
                name: 'Daily Audit',
                status: 'scheduled',
                cadence: 'daily',
                targets: [{ label: 'Main Batch', batchSize: 100 }],
                nextRunAt: Date.now() + 3600000,
                lastRunAt: Date.now() - 86400000,
                createdAt: Date.now() - 604800000,
                updatedAt: Date.now(),
              },
              {
                id: 'task-2',
                name: 'Hourly Check',
                status: 'queued',
                cadence: 'hourly',
                targets: [{ label: 'Quick Scan', batchSize: 25 }],
                nextRunAt: Date.now() + 1800000,
                lastRunAt: Date.now() - 3600000,
                createdAt: Date.now() - 172800000,
                updatedAt: Date.now(),
              },
            ],
          }),
        });
      }
    });

    await page.route('**/webhooks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ webhooks: [] }),
      });
    });

    await page.goto('/automation');
  });

  test('should display tasks in queue table', async ({ page }) => {
    await expect(page.locator('text=Daily Audit')).toBeVisible();
    await expect(page.locator('text=Hourly Check')).toBeVisible();
  });

  test('should show task status badges', async ({ page }) => {
    await expect(page.locator('span:has-text("scheduled")')).toBeVisible();
    await expect(page.locator('span:has-text("queued")')).toBeVisible();
  });

  test('should trigger manual task run', async ({ page }) => {
    await page.route('**/tasks/*/trigger', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task: { id: 'task-1', status: 'queued' },
          run: { id: 'run-new', status: 'queued' },
        }),
      });
    });

    // Click "Run once" button
    const runButton = page.locator('[data-testid="trigger-task-1"]');
    await runButton.click();

    // Should show success message
    await expect(page.locator('text=Run enqueued')).toBeVisible({ timeout: 5000 });
  });

  test('should refresh task list', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();

    await refreshButton.click();

    // Tasks should still be visible after refresh
    await expect(page.locator('text=Daily Audit')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/tasks*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.route('**/webhooks*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/automation');

    // Should show error message
    await expect(page.locator('text=Unable to load automation data')).toBeVisible({ timeout: 5000 });
  });

  test('should handle task creation failure', async ({ page }) => {
    await page.route('**/tasks*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tasks: [] }),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid task configuration' }),
        });
      }
    });

    await page.route('**/webhooks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ webhooks: [] }),
      });
    });

    await page.goto('/automation');

    // Fill and submit form
    await page.fill('input[value="Weekly drift audit"]', 'Bad Task');
    const submitButton = page.locator('[data-testid="automation-task-submit"]');
    await submitButton.click();

    // Should show error
    await expect(page.locator('text=Invalid task configuration')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Responsive Design', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/tasks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [] }),
      });
    });

    await page.route('**/webhooks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ webhooks: [] }),
      });
    });

    await page.goto('/automation');

    // Main elements should still be visible
    await expect(page.locator('h1')).toContainText('Automation');
    await expect(page.locator('[data-testid="automation-task-submit"]')).toBeVisible();
  });

  test('should stack forms on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.route('**/tasks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [] }),
      });
    });

    await page.route('**/webhooks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ webhooks: [] }),
      });
    });

    await page.goto('/automation');

    // Both forms should be visible
    await expect(page.locator('text=Schedule batch scans')).toBeVisible();
    await expect(page.locator('text=Webhook routing')).toBeVisible();
  });
});
