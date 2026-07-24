import type { DependencyGraph } from '../graph/DependencyGraph';

export interface DependencyReport {
  nodeCount: number;
  edgeCount: number;
  graph: DependencyGraph;
}