export class KnowledgeStore {
  private readonly items = new Map<string, unknown>();

  add(id: string, item: unknown): void {
    this.items.set(id, item);
  }

  get(id: string): unknown | undefined {
    return this.items.get(id);
  }

  list(): readonly unknown[] {
    return [...this.items.values()];
  }
}