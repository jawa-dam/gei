export class CapabilityRegistry {
  private readonly capabilities = new Map<string, unknown>();

  register(id: string, capability: unknown): void {
    this.capabilities.set(id, capability);
  }

  resolve(id: string): unknown | undefined {
    return this.capabilities.get(id);
  }

  contains(id: string): boolean {
    return this.capabilities.has(id);
  }
}