import type { Identifier, Metadata, SemanticVersion } from '@gei/shared';

export interface DependencyNode {
  id: Identifier;
  name: string;
  version?: SemanticVersion;
  metadata?: Metadata;
}