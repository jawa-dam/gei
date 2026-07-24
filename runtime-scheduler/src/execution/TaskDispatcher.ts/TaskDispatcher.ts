import type { ScheduledTask } from '../tasks/ScheduledTask';
import { TaskExecutor } from './TaskExecutor';

export class TaskDispatcher {
  private readonly executor = new TaskExecutor();

  dispatch(task: ScheduledTask): void {
    this.executor.execute(task);
  }
}