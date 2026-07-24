import { describe, expect, it } from 'vitest';
import { DependencyGraph } from './DependencyGraph';

describe('DependencyGraph', () => {
  it('stores nodes', () => {
    const graph = new DependencyGraph();

    graph.addNode({
      id: 'A',
      name: 'Node A'
    });

    expect(graph.nodes()).toHaveLength(1);
  });

  it('stores edges', () => {
    const graph = new DependencyGraph();

    graph.addNode({
      id: 'A',
      name: 'Node A'
    });

    graph.addNode({
      id: 'B',
      name: 'Node B'
    });

    graph.addEdge({
      from: 'A',
      to: 'B'
    });

    expect(graph.edges()).toHaveLength(1);
  });

  it('finds a node', () => {
    const graph = new DependencyGraph();

    graph.addNode({
      id: 'GEI',
      name: 'Genesis Engineered'
    });

    expect(graph.getNode('GEI')?.name).toBe('Genesis Engineered');
  });
});