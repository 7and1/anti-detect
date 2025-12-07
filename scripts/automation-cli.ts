#!/usr/bin/env node
import process from 'node:process';

import { AutomationClient, type AutomationTaskPayload } from '@anti-detect/core';

async function main() {
  const command = process.argv[2] || 'list';
  const arg = process.argv[3];
  const client = new AutomationClient({
    apiBase: process.env.AUTOMATION_API,
  });

  try {
    switch (command) {
      case 'list': {
        const tasks = await client.listTasks();
        console.table(
          tasks.map((task) => ({
            id: task.id,
            name: task.name,
            status: task.status,
            nextRun: task.nextRunAt ? new Date(task.nextRunAt).toISOString() : '—',
          }))
        );
        break;
      }
      case 'trigger': {
        if (!arg) throw new Error('Usage: pnpm tsx scripts/automation-cli.ts trigger <taskId>');
        await client.triggerTask(arg);
        console.log(`Queued run for ${arg}`);
        break;
      }
      case 'create-demo': {
        const payload: AutomationTaskPayload = {
          name: 'CLI demo batch',
          projectId: 'cli',
          cadence: 'interval',
          schedule: { intervalMinutes: 30 },
          targets: [
            {
              type: 'scan',
              label: 'CLI batch',
              batchSize: 25,
            },
          ],
          activate: true,
        };
        const task = await client.createTask(payload);
        console.log('Created task', task.id);
        break;
      }
      default:
        console.error('Unknown command. Use list | trigger <id> | create-demo');
        process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
