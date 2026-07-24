import type { ContributionState } from './ContributionState';

export class ContributionLifecycle {
  private state: ContributionState = 'declared';

  getState(): ContributionState {
    return this.state;
  }

  setState(state: ContributionState): void {
    this.state = state;
  }
}