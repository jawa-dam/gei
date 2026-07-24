import type { KernelContext } from '../kernel/KernelContext';

export class ShutdownManager {
  constructor(private readonly context: KernelContext) {}

  shutdown(): void {
    void this.context;
  }
}