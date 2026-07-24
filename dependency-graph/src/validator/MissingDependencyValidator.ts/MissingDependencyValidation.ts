import type { DependencyGraph } from '../graph/DependencyGraph';

export class MissingDependencyValidation {
  validate(graph: DependencyGraph): void {
    for (const edge of graph.edges()) {
      if (!graph.getNode(edge.from) || !graph.getNode(edge.to)) {
        throw new Error(`Missing dependency detected: ${edge.from} -> ${edge.to}`);
      }
    }
  }
}