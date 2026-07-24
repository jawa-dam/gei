import { describe, expect, it } from 'vitest';
import { TaskFactory } from './TaskFactory';

describe('TaskFactory', () => {
  it('creates a scheduled task', () => {
    const factory = new TaskFactory();
    const task = factory.create({ id: 'task-1', name: 'Demo Task' });

    expect(task).toEqual({
      id: 'task-1',
      name: 'Demo Task',
    });
  });
});