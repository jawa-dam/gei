import type { ContributionId } from '../models/ContributionId';
import type { ContributionMetadata } from '../models/ContributionMetadata';

export interface ContributionDescriptor {
  id: ContributionId;
  metadata: ContributionMetadata;
}