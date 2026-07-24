import type { KernelState } from './KernelState';

export class Kernel {
  private state: KernelState = 'created';

  getState(): KernelState {
    return this.state;
  }

  start(): void {
    this.state = 'running';
  }

  stop(): void {
    this.state = 'stopped';
  }
}