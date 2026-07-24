import type { DependencyGraph } from '../graph/DependencyGraph';
import { GraphBuilder } from './GraphBuilder';

export class ManifestGraphBuilder {
  static build(): DependencyGraph {
    return new GraphBuilder().build();
  }
}