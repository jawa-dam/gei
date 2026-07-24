import type { ScheduledTask } from '../tasks/ScheduledTask';

export class TaskExecutor {
  execute(task: ScheduledTask): void {
    void task;
  }
}