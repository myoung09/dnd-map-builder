// Forest Generator using Poisson Disk Sampling and Perlin Noise

import { MapGenerator } from './MapGenerator';
import { MapData, Tree, TerrainType } from '../types/generator';
import { PoissonDiskSampling } from '../utils/poisson';
import { PerlinNoise } from '../utils/noise';

export class ForestGenerator extends MapGenerator {
  generate(): MapData {
    const treeDensity = this.getParam('treeDensity', 0.3);
    const minTreeDistance = this.getParam('minTreeDistance', 3);
    const noiseScale = this.getParam('noiseScale', 0.05);

    // Generate potential tree positions using Poisson sampling
    const poisson = new PoissonDiskSampling(
      this.width,
      this.height,
      minTreeDistance,
      this.seed
    );
    const points = poisson.generate();

    // Use Perlin noise to create natural clustering
    const noise = new PerlinNoise(this.seed);
    const trees: Tree[] = [];

    for (const point of points) {
      // Sample noise at this position
      const noiseValue = noise.octaveNoise(
        point.x * noiseScale,
        point.y * noiseScale,
        4,
        0.5
      );

      // Normalize noise to 0-1 range
      const normalizedNoise = (noiseValue + 1) / 2;

      // Tree appears if noise value is above threshold (controlled by density)
      if (normalizedNoise > (1 - treeDensity)) {
        // Vary tree size based on noise
        const size = 1 + Math.floor(normalizedNoise * 3);
        
        trees.push({
          x: Math.floor(point.x),
          y: Math.floor(point.y),
          size
        });
      }
    }

    // Create grid for visualization
    const grid = this.createEmptyGrid(0);
    
    for (const tree of trees) {
      const size = tree.size || 1;
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const x = tree.x + dx;
          const y = tree.y + dy;
          if (this.inBounds(x, y)) {
            grid[y][x] = size; // Store size in grid
          }
        }
      }
    }

    return {
      width: this.width,
      height: this.height,
      trees,
      grid,
      seed: this.seed,
      terrainType: TerrainType.Forest
    };
  }
}
