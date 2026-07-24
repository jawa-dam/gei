import type { IGraph } from './IGraph';

export interface ITopologicalSorter {
  sort(graph: IGraph): string[];
}