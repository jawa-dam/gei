import type { DependencyGraph } from '../graph/DependencyGraph';
import { DependencyResolver } from './DependencyResolver';

export class BootOrderResolver {
  private readonly resolver = new DependencyResolver();

  resolve(graph: DependencyGraph): string[] {
    return this.resolver.resolve(graph);
  }
}