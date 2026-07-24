import type { CapabilityState } from './CapabilityStateMachine';

export class CapabilityLifecycle {
  private state: CapabilityState = 'discovered';

  getState(): CapabilityState {
    return this.state;
  }

  setState(state: CapabilityState): void {
    this.state = state;
  }
}