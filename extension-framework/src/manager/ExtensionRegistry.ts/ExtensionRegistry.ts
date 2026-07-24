export class ExtensionRegistry {
  private readonly extensions = new Map<string, unknown>();

  register(id: string, extension: unknown): void {
    this.extensions.set(id, extension);
  }

  resolve(id: string): unknown | undefined {
    return this.extensions.get(id);
  }

  contains(id: string): boolean {
    return this.extensions.has(id);
  }

  ids(): string[] {
    return [...this.extensions.keys()];
  }
}