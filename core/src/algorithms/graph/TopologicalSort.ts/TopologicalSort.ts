export class TopologicalSort {
  static sort<T>(
    nodes: readonly T[],
    getNeighbors: (node: T) => readonly T[],
  ): T[] {
    const visited = new Set<T>();
    const temp = new Set<T>();
    const result: T[] = [];

    const visit = (node: T): void => {
      if (visited.has(node)) {
        return;
      }

      if (temp.has(node)) {
        throw new Error('Cycle detected during topological sort.');
      }

      temp.add(node);

      for (const neighbor of getNeighbors(node)) {
        visit(neighbor);
      }

      temp.delete(node);
      visited.add(node);
      result.push(node);
    };

    for (const node of nodes) {
      visit(node);
    }

    return result.reverse();
  }
}