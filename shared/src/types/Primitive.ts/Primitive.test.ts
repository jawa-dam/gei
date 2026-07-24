import { describe, expect, it } from 'vitest';

describe('Primitive', () => {
  it('is defined at compile time only', () => {
    expect(true).toBe(true);
  });
});