import type { IContribution } from './IContribution';

export interface IContributionProvider {
  getContributions(): readonly IContribution[];
}