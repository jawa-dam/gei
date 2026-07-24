import { describe, expect, it } from 'vitest';
import { TopologicalSort } from './TopologicalSort';

describe('TopologicalSort', () => {
  it('sorts nodes in dependency order', () => {
    const graph = new Map<string, string[]>([
      ['A', ['B']],
      ['B', ['C']],
      ['C', []],
    ]);

    const result = TopologicalSort.sort(['A', 'B', 'C'], (node) => graph.get(node) ?? []);
    expect(result).toEqual(['A', 'B', 'C']);
  });
});