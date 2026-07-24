export class BreadthFirstSearch {
  static traverse<T>(
    start: T,
    getNeighbors: (node: T) => readonly T[],
  ): T[] {
    const visited = new Set<T>([start]);
    const queue: T[] = [start];
    const result: T[] = [];

    while (queue.length > 0) {
      const node = queue.shift();
      if (node === undefined) {
        continue;
      }

      result.push(node);

      for (const neighbor of getNeighbors(node)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return result;
  }
}