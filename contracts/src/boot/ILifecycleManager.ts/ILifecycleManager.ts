import type { State } from '@gei/shared';

export interface ILifecycleManager {
  readonly state: State;
  transition(next: State): void;
}