export class SimulationBuilder {
  build(name: string): { id: string; name: string } {
    return {
      id: crypto.randomUUID(),
      name,
    };
  }
}