import { PlatformError } from '@gei/shared';

export class IdentifierGuard {
  static validIdentifier(value: string, name: string): void {
    if (value.trim().length === 0) {
      throw new PlatformError(`Identifier "${name}" must not be empty.`);
    }
  }
}