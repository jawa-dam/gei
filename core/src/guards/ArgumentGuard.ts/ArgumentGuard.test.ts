import { describe, expect, it } from 'vitest';
import { ArgumentGuard } from './ArgumentGuard';

describe('ArgumentGuard', () => {
  it('throws when value is null', () => {
    expect(() => ArgumentGuard.notNull(null, 'value')).toThrow();
  });

  it('does not throw when value is present', () => {
    expect(() => ArgumentGuard.notNull('ok', 'value')).not.toThrow();
  });
});