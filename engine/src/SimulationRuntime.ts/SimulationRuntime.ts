export class SimulationRuntime {
  createSimulation(title: string, description?: string): {
    id: string;
    title: string;
    description?: string;
  } {
    return {
      id: crypto.randomUUID(),
      title,
      description,
    };
  }
}