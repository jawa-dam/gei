import { describe, expect, it } from 'vitest';
import { RuntimeScheduler } from './RuntimeScheduler';

describe('RuntimeScheduler', () => {
  it('starts in created state', () => {
    const scheduler = new RuntimeScheduler();
    expect(scheduler.getState()).toBe('created');
  });

  it('can start and stop', () => {
    const scheduler = new RuntimeScheduler();

    scheduler.start();
    expect(scheduler.getState()).toBe('running');

    scheduler.stop();
    expect(scheduler.getState()).toBe('stopped');
  });
});