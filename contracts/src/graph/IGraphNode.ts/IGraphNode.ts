import type { Identifier, Metadata } from '@gei/shared';

export interface IGraphNode {
  id: Identifier;
  label: string;
  metadata?: Metadata;
}