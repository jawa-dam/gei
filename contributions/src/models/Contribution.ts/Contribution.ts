import type { ContributionId } from './ContributionId';
import type { ContributionMetadata } from './ContributionMetadata';

export interface Contribution {
  id: ContributionId;
  metadata: ContributionMetadata;
}