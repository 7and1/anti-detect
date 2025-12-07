'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { AutomationTaskDTO, WebhookSubscriptionDTO } from '@anti-detect/types';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  listAutomationTasks,
  createAutomationTask,
  triggerAutomationTask,
  listWebhookSubscriptions,
  createWebhookSubscription,
  testWebhookSubscription,
  testAdhocWebhook,
  type CreateAutomationTaskRequest,
  type CreateWebhookRequest,
  type WebhookTestRequest,
} from '@/lib/api';

const DEFAULT_PROJECT = 'project-demo';
const CADENCE_OPTIONS: Array<{ value: CreateAutomationTaskRequest['cadence']; label: string }> = [
  { value: 'interval', label: 'Interval' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'cron', label: 'Cron' },
  { value: 'manual', label: 'Manual' },
];
const TIMEZONES = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Singapore'];
const AUTOMATION_EVENTS = ['automation.run.completed', 'automation.run.failed'];

interface TaskFormState {
  name: string;
  cadence: CreateAutomationTaskRequest['cadence'];
  intervalMinutes: number;
  dailyTime: string;
  timezone: string;
  targetLabel: string;
  batchSize: number;
  webhookUrl: string;
  webhookSecret: string;
}

interface WebhookFormState {
  name: string;
  url: string;
  secret: string;
  events: string[];
}

export default function AutomationPage() {
  const [tasks, setTasks] = useState<AutomationTaskDTO[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSubscriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>({
    name: 'Weekly drift audit',
    cadence: 'interval',
    intervalMinutes: 720,
    dailyTime: '09:00',
    timezone: 'UTC',
    targetLabel: 'Scanner Batch',
    batchSize: 50,
    webhookUrl: '',
    webhookSecret: '',
  });
  const [webhookForm, setWebhookForm] = useState<WebhookFormState>({
    name: 'SIEM bridge',
    url: '',
    secret: '',
    events: [...AUTOMATION_EVENTS],
  });

  useEffect(() => {
    refreshData();
  }, []);

  const stats = useMemo(() => {
    const scheduled = tasks.filter((task) => task.status === 'scheduled').length;
    const queued = tasks.filter((task) => task.status === 'queued').length;
    const nextRun = tasks
      .map((task) => task.nextRunAt)
      .filter((value): value is number => Boolean(value))
      .sort()[0];
    return {
      total: tasks.length,
      scheduled,
      queued,
      nextRun,
    };
  }, [tasks]);

  const sparklineData = useMemo(() => {
    const points = tasks.map((task) => (task.lastRunAt || task.createdAt) % 100);
    return points.length ? points : [5, 35, 15, 45, 10];
  }, [tasks]);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskList, webhookList] = await Promise.all([
        listAutomationTasks(),
        listWebhookSubscriptions(DEFAULT_PROJECT),
      ]);
      setTasks(taskList);
      setWebhooks(webhookList);
    } catch (err) {
      setError('Unable to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    setError(null);
    try {
      const payload: CreateAutomationTaskRequest = {
        name: taskForm.name,
        projectId: DEFAULT_PROJECT,
        cadence: taskForm.cadence,
        timezone: taskForm.timezone,
        schedule: buildSchedule(taskForm),
        targets: [
          {
            type: 'scan',
            label: taskForm.targetLabel || taskForm.name,
            batchSize: taskForm.batchSize,
          },
        ],
        webhook: taskForm.webhookUrl
          ? { url: taskForm.webhookUrl, secret: taskForm.webhookSecret || undefined }
          : undefined,
        activate: taskForm.cadence !== 'manual',
      };
      await createAutomationTask(payload);
      setSuccess('Automation task scheduled');
      setTaskForm((prev) => ({ ...prev, name: 'Follow-up batch' }));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save task');
    }
  };

  const handleTrigger = async (taskId: string) => {
    setError(null);
    try {
      await triggerAutomationTask(taskId);
      setSuccess('Run enqueued');
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enqueue run');
    }
  };

  const handleWebhookSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWebhookStatus(null);
    setError(null);
    try {
      const payload: CreateWebhookRequest = {
        name: webhookForm.name,
        projectId: DEFAULT_PROJECT,
        url: webhookForm.url,
        secret: webhookForm.secret || undefined,
        events: webhookForm.events.length ? webhookForm.events : [...AUTOMATION_EVENTS],
      };
      await createWebhookSubscription(payload);
      setWebhookStatus('Webhook saved');
      setWebhookForm((prev) => ({ ...prev, name: `${prev.name} copy` }));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save webhook');
    }
  };

  const handleWebhookTest = async () => {
    setWebhookStatus('Sending test payload...');
    try {
      const testPayload: WebhookTestRequest = {
        url: webhookForm.url,
        secret: webhookForm.secret || undefined,
        projectId: DEFAULT_PROJECT,
      };
      const result = await testAdhocWebhook(testPayload);
      setWebhookStatus(result.ok ? `Webhook responded (${result.status})` : result.error || 'Webhook failed');
    } catch (err) {
      setWebhookStatus(err instanceof Error ? err.message : 'Webhook failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-wide text-text-muted">Automation</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-text-primary">Automation & Webhooks</h1>
                <p className="text-text-secondary max-w-2xl">
                  Schedule recurring scanner batches, ship diffs to SIEM/SOAR systems, and monitor queue health in one view.
                </p>
                {error && <p className="text-sm text-error">{error}</p>}
                {success && <p className="text-sm text-success">{success}</p>}
              </div>
              <div className="w-full md:w-64">
                <Sparkline data={sparklineData} />
                <p className="text-xs text-text-muted">Queue momentum</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Tasks" value={stats.total} accent="from-success to-terminal" />
              <StatCard label="Scheduled" value={stats.scheduled} accent="from-accent to-success" />
              <StatCard label="Queued" value={stats.queued} accent="from-warning to-orange-500" />
              <StatCard
                label="Next Run"
                value={stats.nextRun ? new Date(stats.nextRun).toLocaleString() : 'Pending'}
                accent="from-indigo-500 to-blue-500"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form
              onSubmit={handleTaskSubmit}
              className="p-6 rounded-2xl border border-border bg-bg-secondary shadow-sm space-y-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Schedule batch scans</h2>
                <p className="text-sm text-text-muted">Define cadence, targets, and webhooks for downstream automation.</p>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-text-muted">Task name</label>
                <input
                  value={taskForm.name}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-text-muted">Cadence</label>
                  <select
                    value={taskForm.cadence}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, cadence: e.target.value as TaskFormState['cadence'] }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  >
                    {CADENCE_OPTIONS.map((cadence) => (
                      <option key={cadence.value} value={cadence.value}>
                        {cadence.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted">Interval (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    value={taskForm.intervalMinutes}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, intervalMinutes: Number(e.target.value) || prev.intervalMinutes }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted">Daily time</label>
                  <input
                    type="time"
                    value={taskForm.dailyTime}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, dailyTime: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-text-muted">Timezone</label>
                  <select
                    value={taskForm.timezone}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  >
                    {TIMEZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted">Batch size</label>
                  <input
                    type="number"
                    min={10}
                    value={taskForm.batchSize}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, batchSize: Number(e.target.value) || prev.batchSize }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-text-muted">Target label</label>
                  <input
                    value={taskForm.targetLabel}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, targetLabel: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted">Webhook URL (optional)</label>
                  <input
                    type="url"
                    value={taskForm.webhookUrl}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-text-muted">Webhook secret</label>
                  <input
                    value={taskForm.webhookSecret}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, webhookSecret: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                    placeholder="optional"
                  />
                </div>
              </div>
              <button
                type="submit"
                data-testid="automation-task-submit"
                className="w-full md:w-auto inline-flex items-center justify-center rounded-lg bg-success px-6 py-2 text-sm font-semibold text-bg-primary"
              >
                Launch Task
              </button>
            </form>

            <section className="p-6 rounded-2xl border border-border bg-bg-secondary shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Webhook routing</h2>
                <p className="text-sm text-text-muted">Register SIEM or Slack endpoints and fire a signed test delivery.</p>
              </div>
              <form onSubmit={handleWebhookSubmit} className="space-y-3">
                <div>
                  <label className="text-sm text-text-muted">Webhook name</label>
                  <input
                    value={webhookForm.name}
                    onChange={(e) => setWebhookForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                    data-testid="webhook-name-input"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted">Endpoint URL</label>
                  <input
                    type="url"
                    value={webhookForm.url}
                    onChange={(e) => setWebhookForm((prev) => ({ ...prev, url: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                    data-testid="webhook-url-input"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-text-muted">Secret</label>
                    <input
                      value={webhookForm.secret}
                      onChange={(e) => setWebhookForm((prev) => ({ ...prev, secret: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                      placeholder="auto-generate if empty"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-muted">Events</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {AUTOMATION_EVENTS.map((event) => (
                        <label key={event} className="inline-flex items-center gap-2 text-xs text-text-secondary">
                          <input
                            type="checkbox"
                            checked={webhookForm.events.includes(event)}
                            onChange={(e) => {
                              setWebhookForm((prev) => {
                                const exists = prev.events.includes(event);
                                return {
                                  ...prev,
                                  events: exists
                                    ? prev.events.filter((value) => value !== event)
                                    : [...prev.events, event],
                                };
                              });
                            }}
                            className="rounded border-border"
                          />
                          {event}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button type="submit" className="rounded-lg bg-text-primary px-4 py-2 text-sm font-semibold text-bg-primary">
                    Save Webhook
                  </button>
                  <button
                    type="button"
                    onClick={handleWebhookTest}
                    data-testid="webhook-test-button"
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary"
                  >
                    Send Test Ping
                  </button>
                </div>
                {webhookStatus && (
                  <p className="text-xs text-text-muted" data-testid="webhook-status">
                    {webhookStatus}
                  </p>
                )}
              </form>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">Active webhooks</p>
                <ul className="space-y-2">
                  {webhooks.length === 0 && <li className="text-sm text-text-muted">No webhooks registered yet.</li>}
                  {webhooks.map((hook) => (
                    <li key={hook.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-text-primary">{hook.name}</p>
                        <p className="text-xs text-text-muted">{hook.url}</p>
                      </div>
                      <button
                        className="text-xs text-accent"
                        onClick={async () => {
                          try {
                            await testWebhookSubscription(hook.id);
                            setWebhookStatus(`Triggered ${hook.name}`);
                          } catch (err) {
                            setWebhookStatus(
                              err instanceof Error ? err.message : 'Webhook trigger failed'
                            );
                          }
                        }}
                      >
                        Trigger test
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </section>

          <section className="p-6 rounded-2xl border border-border bg-bg-secondary shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Dispatch queue</h2>
                <p className="text-sm text-text-muted">Monitor automation runs and enqueue adhoc executions.</p>
              </div>
              <button
                onClick={refreshData}
                className="text-sm font-medium text-accent"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm" data-testid="automation-task-table">
                <thead>
                  <tr className="text-xs uppercase text-text-muted">
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2">Cadence</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Next run</th>
                    <th className="px-3 py-2">Last run</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-text-muted">
                        No automation tasks yet.
                      </td>
                    </tr>
                  )}
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-t border-border/80">
                      <td className="px-3 py-3">
                        <p className="font-medium text-text-primary">{task.name}</p>
                        <p className="text-xs text-text-muted">{task.targets[0]?.label}</p>
                      </td>
                      <td className="px-3 py-3 text-text-secondary">{task.cadence}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs capitalize text-text-secondary">
                          {task.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-text-secondary">
                        {task.nextRunAt ? new Date(task.nextRunAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-3 text-text-secondary">
                        {task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          className="text-xs font-semibold text-accent"
                          onClick={() => handleTrigger(task.id)}
                          data-testid={`trigger-${task.id}`}
                        >
                          Run once
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function buildSchedule(form: TaskFormState): CreateAutomationTaskRequest['schedule'] {
  if (form.cadence === 'interval') {
    return { intervalMinutes: form.intervalMinutes };
  }
  if (form.cadence === 'daily') {
    return { dailyTime: form.dailyTime, timezone: form.timezone };
  }
  if (form.cadence === 'cron') {
    return { cron: '*/30 * * * *' };
  }
  return undefined;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (
    <div className="rounded-2xl border border-border bg-bg-secondary p-4" data-testid={`stat-card-${slug}`}>
      <p className="text-xs uppercase text-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold text-text-primary bg-clip-text text-transparent bg-gradient-to-br ${accent}`}>
        {value}
      </p>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const normalized = data.map((value, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 0;
    const y = 100 - (value / max) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full text-success" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        points={normalized.join(' ')}
      />
    </svg>
  );
}
