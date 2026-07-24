import type { Contribution } from '../models/Contribution';

export class ContributionRegistry {
  private readonly contributions = new Map<string, Contribution>();

  register(contribution: Contribution): void {
    this.contributions.set(contribution.id, contribution);
  }

  resolve(id: string): Contribution | undefined {
    return this.contributions.get(id);
  }

  all(): readonly Contribution[] {
    return [...this.contributions.values()];
  }
}