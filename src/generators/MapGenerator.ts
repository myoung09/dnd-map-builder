// Abstract base class for map generators

import { MapData, GeneratorParameters } from '../types/generator';
import { SeededRandom } from '../utils/random';

export abstract class MapGenerator<T extends MapData = MapData> {
  protected width: number;
  protected height: number;
  protected seed: number;
  protected random: SeededRandom;
  protected parameters: GeneratorParameters;

  constructor(parameters: GeneratorParameters) {
    this.parameters = parameters;
    this.width = parameters.width;
    this.height = parameters.height;
    this.seed = parameters.seed ?? Date.now();
    this.random = new SeededRandom(this.seed);
  }

  // Abstract method to be implemented by subclasses
  abstract generate(): T;

  // Helper method to create empty grid
  protected createEmptyGrid(fillValue: number = 0): number[][] {
    return Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(fillValue));
  }

  // Helper method to check if coordinates are within bounds
  protected inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  // Helper method to count neighbors (for cellular automata)
  protected countNeighbors(grid: number[][], x: number, y: number, value: number = 1): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (this.inBounds(nx, ny) && grid[ny][nx] === value) {
          count++;
        } else if (!this.inBounds(nx, ny)) {
          count++; // Count out of bounds as walls
        }
      }
    }
    return count;
  }

  // Helper to get parameter with default value
  protected getParam<K extends keyof GeneratorParameters>(
    key: K,
    defaultValue: NonNullable<GeneratorParameters[K]>
  ): NonNullable<GeneratorParameters[K]> {
    return (this.parameters[key] ?? defaultValue) as NonNullable<GeneratorParameters[K]>;
  }
}
