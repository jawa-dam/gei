import type { DependencyEdge } from './DependencyEdge';
import type { DependencyNode } from './DependencyNode';

export class DependencyGraph {
  private readonly nodesList = new Map<string, DependencyNode>();
  private readonly edgesList: DependencyEdge[] = [];

  addNode(node: DependencyNode): void {
    this.nodesList.set(node.id, node);
  }

  addEdge(edge: DependencyEdge): void {
    this.edgesList.push(edge);
  }

  getNode(id: string): DependencyNode | undefined {
    return this.nodesList.get(id);
  }

  nodes(): readonly DependencyNode[] {
    return [...this.nodesList.values()];
  }

  edges(): readonly DependencyEdge[] {
    return [...this.edgesList];
  }
}