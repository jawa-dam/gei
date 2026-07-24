import { describe, expect, it } from 'vitest';

import { GraphBuilder } from '../builder/GraphBuilder';
import { DependencyResolver } from './DependencyResolver';

describe('DependencyResolver', () => {

  it('returns dependency ids', () => {

    const graph =
      new GraphBuilder()
        .addNode({
          id: 'A',
          name: 'Node A'
        })
        .build();

    const resolver = new DependencyResolver();

    expect(resolver.resolve(graph)).toEqual(['A']);

  });

});