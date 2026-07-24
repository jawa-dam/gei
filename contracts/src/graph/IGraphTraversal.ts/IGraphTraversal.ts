import type { Identifier } from '@gei/shared';

export interface IGraphTraversal {
  depthFirst(startId: Identifier): Identifier[];
  breadthFirst(startId: Identifier): Identifier[];
}