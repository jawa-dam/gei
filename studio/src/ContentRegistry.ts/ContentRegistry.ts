export class ContentRegistry {
  private readonly content = new Map<string, unknown>();

  register(id: string, item: unknown): void {
    this.content.set(id, item);
  }

  resolve(id: string): unknown | undefined {
    return this.content.get(id);
  }

  list(): readonly unknown[] {
    return [...this.content.values()];
  }
}