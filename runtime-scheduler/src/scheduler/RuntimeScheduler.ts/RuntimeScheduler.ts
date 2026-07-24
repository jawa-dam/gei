import type { SchedulerState } from './SchedulerState';

export class RuntimeScheduler {
  private state: SchedulerState = 'created';

  getState(): SchedulerState {
    return this.state;
  }

  start(): void {
    this.state = 'running';
  }

  stop(): void {
    this.state = 'stopped';
  }
}