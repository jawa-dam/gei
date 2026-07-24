import type { Identifier, SemanticVersion, Metadata } from '@gei/shared';

export interface IServiceDescriptor {
  id: Identifier;
  name: string;
  version: SemanticVersion;
  metadata?: Metadata;
}