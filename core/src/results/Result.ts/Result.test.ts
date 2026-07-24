import { describe, expect, it } from 'vitest';
import { Result } from './Result';

describe('Result', () => {
  it('creates a success result', () => {
    const result = Result.success('hello');
    expect(result.ok).toBe(true);
  });

  it('creates a failure result', () => {
    const error = new Error('bad') as never;
    const result = Result.failure(error as any);
    expect(result.ok).toBe(false);
  });
});