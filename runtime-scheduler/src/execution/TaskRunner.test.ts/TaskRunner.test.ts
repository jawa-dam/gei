import { describe, expect, it } from 'vitest';
import { TaskRunner } from './TaskRunner';

describe('TaskRunner', () => {
  it('exists and can be instantiated', () => {
    const runner = new TaskRunner();
    expect(runner).toBeInstanceOf(TaskRunner);
  });
});