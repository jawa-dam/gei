import { describe, expect, it } from 'vitest';
import { DepthFirstSearch } from './DepthFirstSearch';

describe('DepthFirstSearch', () => {
  it('visits nodes depth-first', () => {
    const graph = new Map<string, string[]>([
      ['A', ['B', 'C']],
      ['B', ['D']],
      ['C', []],
      ['D', []],
    ]);

    const result = DepthFirstSearch.traverse('A', (node) => graph.get(node) ?? []);
    expect(result).toEqual(['A', 'B', 'D', 'C']);
  });
});