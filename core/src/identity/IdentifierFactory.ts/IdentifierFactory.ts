export class IdentifierFactory {
  static create(prefix: string, value: string): string {
    const normalizedPrefix = prefix.trim();
    const normalizedValue = value.trim();

    if (normalizedPrefix.length === 0) {
      throw new Error('Identifier prefix must not be empty.');
    }

    if (normalizedValue.length === 0) {
      throw new Error('Identifier value must not be empty.');
    }

    return `${normalizedPrefix}:${normalizedValue}`;
  }
}