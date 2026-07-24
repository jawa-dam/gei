export class CycleDetector {
  static hasCycle<T>(
    nodes: readonly T[],
    getNeighbors: (node: T) => readonly T[],
  ): boolean {
    const visited = new Set<T>();
    const stack = new Set<T>();

    const visit = (node: T): boolean => {
      if (stack.has(node)) {
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      stack.add(node);

      for (const neighbor of getNeighbors(node)) {
        if (visit(neighbor)) {
          return true;
        }
      }

      stack.delete(node);
      return false;
    };

    for (const node of nodes) {
      if (visit(node)) {
        return true;
      }
    }

    return false;
  }
}