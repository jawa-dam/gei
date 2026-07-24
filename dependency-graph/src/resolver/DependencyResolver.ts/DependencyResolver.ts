import type { DependencyGraph } from '../graph/DependencyGraph';

export class DependencyResolver {
  resolve(graph: DependencyGraph): string[] {
    return graph.nodes().map((node) => node.id);
  }
}