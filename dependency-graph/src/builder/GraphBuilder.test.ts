import { describe, expect, it } from 'vitest';
import { GraphBuilder } from './GraphBuilder';

describe('GraphBuilder', () => {

  it('builds a graph', () => {

    const graph =
      new GraphBuilder()
        .addNode({
          id: 'A',
          name: 'A'
        })
        .build();

    expect(graph.nodes()).toHaveLength(1);

  });

});