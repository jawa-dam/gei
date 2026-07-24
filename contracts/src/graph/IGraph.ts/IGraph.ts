import type { IGraphNode } from './IGraphNode';
import type { IGraphEdge } from './IGraphEdge';

export interface IGraph {
  nodes(): readonly IGraphNode[];
  edges(): readonly IGraphEdge[];
}