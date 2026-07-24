import type { Identifier } from '@gei/shared';

export interface DependencyEdge {
  from: Identifier;
  to: Identifier;
}