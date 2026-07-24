import { PlatformError, type State } from '@gei/shared';

export class StateGuard {
  static validTransition(current: State, next: State): void {
    const allowed: Record<State, State[]> = {
      created: ['initializing'],
      initializing: ['initialized', 'failed'],
      initialized: ['running', 'failed'],
      running: ['paused', 'stopping', 'failed'],
      paused: ['running', 'stopping', 'failed'],
      stopping: ['stopped', 'failed'],
      stopped: [],
      disposed: [],
      failed: ['stopping', 'disposed'],
    };

    if (!allowed[current].includes(next)) {
      throw new PlatformError(`Invalid state transition from "${current}" to "${next}".`);
    }
  }
}