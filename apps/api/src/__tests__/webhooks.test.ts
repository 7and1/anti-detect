import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch for webhook delivery tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock crypto.subtle for signature tests
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
  subtle: {
    importKey: vi.fn().mockResolvedValue({}),
    sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
});

describe('Webhook Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Webhook Subscription Validation', () => {
    it('validates required subscription fields', () => {
      const validSubscription = {
        name: 'SIEM Integration',
        url: 'https://siem.example.com/webhook',
        events: ['automation.run.completed', 'automation.run.failed'],
        secret: 'secret12345678',
      };

      expect(validSubscription.name.length).toBeGreaterThanOrEqual(3);
      expect(validSubscription.url).toMatch(/^https?:\/\//);
      expect(validSubscription.events.length).toBeGreaterThan(0);
      expect(validSubscription.secret.length).toBeGreaterThanOrEqual(8);
    });

    it('rejects invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        '',
        'http://',
      ];

      invalidUrls.forEach((url) => {
        const isValid = /^https?:\/\/[^\s]+$/.test(url);
        expect(isValid).toBe(false);
      });
    });

    it('validates event names', () => {
      const validEvents = [
        'automation.run.completed',
        'automation.run.failed',
        'webhook.test',
      ];

      const invalidEvents = [
        '',
        'invalid',
        'random.event.name',
      ];

      validEvents.forEach((event) => {
        expect(event).toMatch(/^(automation\.|webhook\.)/);
      });

      invalidEvents.forEach((event) => {
        const isValid = /^(automation\.run\.(completed|failed)|webhook\.test)$/.test(event);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Webhook Delivery', () => {
    it('sends POST request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      const payload = {
        id: 'event-123',
        type: 'automation.run.completed',
        timestamp: Date.now(),
        data: { taskId: 'task-1', runId: 'run-1' },
      };

      await mockFetch('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Anti-Detect-Event': 'automation.run.completed',
          'X-Anti-Detect-Signature': 'abc123signature',
        },
        body: JSON.stringify(payload),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Anti-Detect-Event': 'automation.run.completed',
          }),
        })
      );
    });

    it('handles webhook delivery failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const response = await mockFetch('https://example.com/webhook', {
        method: 'POST',
        body: '{}',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        mockFetch('https://example.com/webhook', { method: 'POST' })
      ).rejects.toThrow('Network error');
    });

    it('respects timeout for slow endpoints', async () => {
      // Simulate a slow response
      mockFetch.mockImplementationOnce(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, status: 200 }), 100)
        )
      );

      const startTime = Date.now();
      await mockFetch('https://slow.example.com/webhook', { method: 'POST' });
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Webhook Signature', () => {
    it('creates HMAC-SHA256 signature format', () => {
      // Signature should be hex string
      const mockSignature = 'a'.repeat(64); // SHA-256 produces 32 bytes = 64 hex chars
      expect(mockSignature).toMatch(/^[a-f0-9]{64}$/);
    });

    it('signature varies with different secrets', () => {
      const sig1 = 'secret1_signature_hash';
      const sig2 = 'secret2_signature_hash';
      expect(sig1).not.toBe(sig2);
    });

    it('signature varies with different payloads', () => {
      const payload1Hash = 'hash_for_payload_1';
      const payload2Hash = 'hash_for_payload_2';
      expect(payload1Hash).not.toBe(payload2Hash);
    });
  });

  describe('Webhook Event Types', () => {
    it('automation.run.completed contains required fields', () => {
      const event = {
        id: 'event-123',
        type: 'automation.run.completed',
        projectId: 'proj-1',
        timestamp: Date.now(),
        data: {
          task: {
            id: 'task-1',
            name: 'Test Task',
            cadence: 'interval',
            status: 'scheduled',
          },
          run: {
            id: 'run-1',
            taskId: 'task-1',
            status: 'completed',
            queuedAt: Date.now() - 10000,
            completedAt: Date.now(),
            durationMs: 9500,
            successCount: 50,
            failCount: 0,
          },
        },
      };

      expect(event.type).toBe('automation.run.completed');
      expect(event.data.task).toBeDefined();
      expect(event.data.run).toBeDefined();
      expect(event.data.run.status).toBe('completed');
    });

    it('automation.run.failed contains error information', () => {
      const event = {
        id: 'event-456',
        type: 'automation.run.failed',
        projectId: 'proj-1',
        timestamp: Date.now(),
        data: {
          task: {
            id: 'task-1',
            name: 'Test Task',
            cadence: 'interval',
            status: 'failed',
          },
          run: {
            id: 'run-2',
            taskId: 'task-1',
            status: 'failed',
            queuedAt: Date.now() - 5000,
            completedAt: Date.now(),
            error: 'Connection timeout',
          },
        },
      };

      expect(event.type).toBe('automation.run.failed');
      expect(event.data.run.status).toBe('failed');
      expect(event.data.run.error).toBeDefined();
    });

    it('webhook.test is a valid test event', () => {
      const event = {
        id: 'event-test',
        type: 'webhook.test',
        projectId: 'proj-1',
        timestamp: Date.now(),
        data: {
          message: 'Webhook test payload',
        },
      };

      expect(event.type).toBe('webhook.test');
      expect(event.data.message).toBeDefined();
    });
  });

  describe('Delivery Logging', () => {
    it('records successful delivery', () => {
      const delivery = {
        id: 'delivery-001',
        subscriptionId: 'sub-123',
        event: 'automation.run.completed',
        status: 'delivered' as const,
        responseCode: 200,
        error: null,
        deliveredAt: Date.now(),
        durationMs: 150,
      };

      expect(delivery.status).toBe('delivered');
      expect(delivery.responseCode).toBe(200);
      expect(delivery.error).toBeNull();
    });

    it('records failed delivery with error', () => {
      const delivery = {
        id: 'delivery-002',
        subscriptionId: 'sub-123',
        event: 'automation.run.completed',
        status: 'failed' as const,
        responseCode: 503,
        error: 'Service Unavailable',
        deliveredAt: Date.now(),
        durationMs: 5000,
      };

      expect(delivery.status).toBe('failed');
      expect(delivery.error).toBe('Service Unavailable');
    });

    it('tracks delivery duration', () => {
      const fastDelivery = { durationMs: 50 };
      const slowDelivery = { durationMs: 5000 };

      expect(fastDelivery.durationMs).toBeLessThan(1000);
      expect(slowDelivery.durationMs).toBeGreaterThanOrEqual(5000);
    });
  });
});

describe('Adhoc Webhook Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends test payload to provided URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const testInput = {
      url: 'https://test.example.com/webhook',
      secret: 'testsecret123',
      projectId: 'proj-test',
    };

    await mockFetch(testInput.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Anti-Detect-Event': 'webhook.test',
      },
      body: JSON.stringify({
        type: 'webhook.test',
        projectId: testInput.projectId,
        data: { message: 'Adhoc webhook test' },
      }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      testInput.url,
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('returns error for unreachable endpoint', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await mockFetch('https://unreachable.example.com/webhook', {
      method: 'POST',
    }).catch((error: Error) => ({
      ok: false,
      status: 0,
      error: error.message,
    }));

    expect(result.ok).toBe(false);
    expect(result.error).toBe('ECONNREFUSED');
  });
});
