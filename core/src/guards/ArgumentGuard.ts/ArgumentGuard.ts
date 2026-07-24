import { PlatformError } from '@gei/shared';

export class ArgumentGuard {
  static notNull<T>(value: T | null | undefined, name: string): asserts value is T {
    if (value === null || value === undefined) {
      throw new PlatformError(`Argument "${name}" must not be null or undefined.`);
    }
  }

  static notEmpty(value: string, name: string): asserts value is string {
    if (value.trim().length === 0) {
      throw new PlatformError(`Argument "${name}" must not be empty.`);
    }
  }
}