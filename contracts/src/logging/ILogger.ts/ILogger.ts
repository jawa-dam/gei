import type { Severity } from '@gei/shared';

export interface ILogger {
  log(severity: Severity, message: string, context?: Record<string, unknown>): void;
}