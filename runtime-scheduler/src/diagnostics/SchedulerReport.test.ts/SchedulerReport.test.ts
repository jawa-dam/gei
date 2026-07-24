import { describe, expect, it } from 'vitest';
import type { SchedulerReport } from './SchedulerReport';

describe('SchedulerReport', () => {
  it('holds metrics and timestamp', () => {
    const report: SchedulerReport = {
      metrics: {
        queuedTasks: 1,
        runningTasks: 0,
        completedTasks: 2,
        failedTasks: 0,
      },
      generatedAt: '2026-07-21T00:00:00.000Z',
    };

    expect(report.metrics.queuedTasks).toBe(1);
    expect(report.generatedAt).toContain('2026-07-21');
  });
});