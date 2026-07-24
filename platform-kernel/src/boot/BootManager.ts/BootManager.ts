import type { KernelContext } from '../kernel/KernelContext';

export class BootManager {
  constructor(private readonly context: KernelContext) {}

  boot(): void {
    void this.context;
  }
}