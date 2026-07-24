import type { DependencyEdge } from '../graph/DependencyEdge';
import type { DependencyGraph } from '../graph/DependencyGraph';
import type { DependencyNode } from '../graph/DependencyNode';

export class GraphBuilder {
  private readonly nodes: DependencyNode[] = [];
  private readonly edges: DependencyEdge[] = [];

  addNode(node: DependencyNode): this {
    this.nodes.push(node);
    return this;
  }

  addEdge(edge: DependencyEdge): this {
    this.edges.push(edge);
    return this;
  }

  build(): DependencyGraph {
    const graph = new DependencyGraph();

    for (const node of this.nodes) {
      graph.addNode(node);
    }

    for (const edge of this.edges) {
      graph.addEdge(edge);
    }

    return graph;
  }
}