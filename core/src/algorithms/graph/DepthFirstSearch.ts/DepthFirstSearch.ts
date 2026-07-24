export class DepthFirstSearch {
  static traverse<T>(
    start: T,
    getNeighbors: (node: T) => readonly T[],
  ): T[] {
    const visited = new Set<T>();
    const result: T[] = [];

    const visit = (node: T): void => {
      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      result.push(node);

      for (const neighbor of getNeighbors(node)) {
        visit(neighbor);
      }
    };

    visit(start);
    return result;
  }
}