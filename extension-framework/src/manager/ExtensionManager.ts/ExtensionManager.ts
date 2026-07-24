import { ExtensionRegistry } from './ExtensionRegistry';
import { ExtensionCatalog } from './ExtensionCatalog';

export class ExtensionManager {
  private readonly registry = new ExtensionRegistry();
  private readonly catalog = new ExtensionCatalog();

  getRegistry(): ExtensionRegistry {
    return this.registry;
  }

  getCatalog(): ExtensionCatalog {
    return this.catalog;
  }
}