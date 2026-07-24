import type { DependencyGraph } from '../graph/DependencyGraph';

export class DependencyValidator {
  validate(graph: DependencyGraph): void {
    if (graph.nodes().length === 0) {
      throw new Error('Dependency graph must contain at least one node.');
    }
  }
}