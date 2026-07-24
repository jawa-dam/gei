import type { IGraph } from './IGraph';

export interface IGraphValidator {
  validate(graph: IGraph): void;
}