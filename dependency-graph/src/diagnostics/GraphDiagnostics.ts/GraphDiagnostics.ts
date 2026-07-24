import type { DependencyGraph } from '../graph/DependencyGraph';
import type { DependencyReport } from './DependencyReport';

export class GraphDiagnostics {
  analyze(graph: DependencyGraph): DependencyReport {
    return {
      nodeCount: graph.nodes().length,
      edgeCount: graph.edges().length,
      graph,
    };
  }
}