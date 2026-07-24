import { CapabilityRegistry } from './CapabilityRegistry';
import { CapabilityLoader } from './CapabilityLoader';
import { CapabilityHealthMonitor } from './CapabilityHealthMonitor';
import { CapabilityManifestLoader } from './CapabilityManifestLoader';

export class CapabilityManager {
  private readonly registry = new CapabilityRegistry();
  private readonly loader = new CapabilityLoader();
  private readonly healthMonitor = new CapabilityHealthMonitor();
  private readonly manifestLoader = new CapabilityManifestLoader();

  initialize(): void {
    this.manifestLoader.load();
    this.healthMonitor.check();
  }

  getRegistry(): CapabilityRegistry {
    return this.registry;
  }

  getLoader(): CapabilityLoader {
    return this.loader;
  }
}