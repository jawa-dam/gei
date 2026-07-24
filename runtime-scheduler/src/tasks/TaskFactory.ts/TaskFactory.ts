import type { TaskDescriptor } from './TaskDescriptor';
import type { ScheduledTask } from './ScheduledTask';

export class TaskFactory {
  create(descriptor: TaskDescriptor): ScheduledTask {
    return {
      id: descriptor.id,
      name: descriptor.name,
    };
  }
}