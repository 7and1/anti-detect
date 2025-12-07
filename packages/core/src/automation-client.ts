import type {
  AutomationTaskDTO,
  AutomationTaskRunDTO,
  WebhookSubscriptionDTO,
} from '@anti-detect/types';

export interface AutomationClientOptions {
  apiBase?: string;
  token?: string;
}

export interface AutomationTaskPayload {
  name: string;
  cadence: AutomationTaskDTO['cadence'];
  schedule?: Record<string, unknown> | null;
  targets: AutomationTaskDTO['targets'];
  timezone?: string;
  projectId?: string;
  webhook?: { url: string; secret?: string };
  activate?: boolean;
}

export class AutomationClient {
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(options: AutomationClientOptions = {}) {
    const envBase =
      typeof process !== 'undefined' && process.env && process.env.AUTOMATION_API
        ? process.env.AUTOMATION_API
        : undefined;
    this.baseUrl = options.apiBase || envBase || 'http://127.0.0.1:8787';
    this.token = options.token;
  }

  async listTasks(limit = 25): Promise<AutomationTaskDTO[]> {
    const data = await this.request<{ tasks: AutomationTaskDTO[] }>(`/tasks?limit=${limit}`);
    return data.tasks ?? [];
  }

  async getTask(taskId: string): Promise<{ task: AutomationTaskDTO; runs: AutomationTaskRunDTO[] }> {
    return this.request(`/tasks/${taskId}`);
  }

  async createTask(payload: AutomationTaskPayload): Promise<AutomationTaskDTO> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async triggerTask(taskId: string): Promise<void> {
    await this.request(`/tasks/${taskId}/trigger`, { method: 'POST' });
  }

  async listWebhooks(projectId?: string): Promise<WebhookSubscriptionDTO[]> {
    const params = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const data = await this.request<{ webhooks: WebhookSubscriptionDTO[] }>(`/webhooks${params}`);
    return data.webhooks ?? [];
  }

  async sendWebhookTest(id: string): Promise<void> {
    await this.request(`/webhooks/${id}/test`, { method: 'POST' });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const message = await safeError(response);
      throw new Error(`Request failed (${response.status}): ${message}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

async function safeError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') {
      return data.error;
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText || 'Unknown error';
  }
}
