import { PlatformError } from '@gei/shared';

export class CollectionGuard {
  static notEmpty<T>(items: readonly T[], name: string): void {
    if (items.length === 0) {
      throw new PlatformError(`Collection "${name}" must not be empty.`);
    }
  }

  static noDuplicates<T>(items: readonly T[], name: string): void {
    const seen = new Set<T>();
    for (const item of items) {
      if (seen.has(item)) {
        throw new PlatformError(`Collection "${name}" must not contain duplicate items.`);
      }
      seen.add(item);
    }
  }
}