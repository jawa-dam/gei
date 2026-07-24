import { describe, expect, it } from 'vitest';

import { GraphBuilder } from '../builder/GraphBuilder';
import { GraphDiagnostics } from './GraphDiagnostics';

describe('GraphDiagnostics', () => {

  it('counts graph statistics', () => {

    const graph =
      new GraphBuilder()
        .addNode({
          id: 'A',
          name: 'Node A'
        })
        .build();

    const report =
      new GraphDiagnostics()
        .analyze(graph);

    expect(report.nodeCount).toBe(1);
    expect(report.edgeCount).toBe(0);

  });

});