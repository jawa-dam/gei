export class PlatformAssertions {
  static true(condition: boolean, message = 'Assertion failed'): void {
    if (!condition) {
      throw new Error(message);
    }
  }
}