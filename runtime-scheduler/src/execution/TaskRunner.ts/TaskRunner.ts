import type { ScheduledTask } from '../tasks/ScheduledTask';
import { TaskDispatcher } from './TaskDispatcher';

export class TaskRunner {
  private readonly dispatcher = new TaskDispatcher();

  run(task: ScheduledTask): void {
    this.dispatcher.dispatch(task);
  }
}