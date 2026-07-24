import type { SchedulerMetrics } from './SchedulerMetrics';

export interface SchedulerReport {
  metrics: SchedulerMetrics;
  generatedAt: string;
} 