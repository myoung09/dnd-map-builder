// Cave Generator using Cellular Automata

import { MapGenerator } from './MapGenerator';
import { MapData, TerrainType } from '../types/generator';

export class CaveGenerator extends MapGenerator {
  generate(): MapData {
    const fillProbability = this.getParam('fillProbability', 0.45);
    const smoothIterations = this.getParam('smoothIterations', 4);
    const wallThreshold = this.getParam('wallThreshold', 5);

    // Initialize grid with random walls
    let grid = this.createEmptyGrid(0);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Edges are always walls
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          grid[y][x] = 1;
        } else {
          // Random fill
          grid[y][x] = this.random.next() < fillProbability ? 1 : 0;
        }
      }
    }

    // Apply cellular automata smoothing
    for (let iteration = 0; iteration < smoothIterations; iteration++) {
      grid = this.smoothGrid(grid, wallThreshold);
    }

    return {
      width: this.width,
      height: this.height,
      grid,
      seed: this.seed,
      terrainType: TerrainType.Cave
    };
  }

  private smoothGrid(oldGrid: number[][], wallThreshold: number): number[][] {
    const newGrid = this.createEmptyGrid(0);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Count wall neighbors
        const wallCount = this.countNeighbors(oldGrid, x, y, 1);

        // Apply rule: if enough walls nearby, become wall
        if (wallCount >= wallThreshold) {
          newGrid[y][x] = 1;
        } else {
          newGrid[y][x] = 0;
        }

        // Keep edges as walls
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          newGrid[y][x] = 1;
        }
      }
    }

    return newGrid;
  }

  // Flood fill to find largest connected cave
  private floodFill(grid: number[][], startX: number, startY: number): Set<string> {
    const visited = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (!this.inBounds(x, y)) continue;
      if (grid[y][x] === 1) continue; // Wall

      visited.add(key);

      // Add neighbors
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    return visited;
  }
}
