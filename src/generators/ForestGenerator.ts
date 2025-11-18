// Forest Generator using Poisson Disk Sampling and Perlin Noise
// Refined implementation with guaranteed non-overlapping trees and organic spacing

import { MapGenerator } from './MapGenerator';
import { MapData, Tree, TerrainType } from '../types/generator';
import { PoissonDiskSampling } from '../utils/poisson';
import { PerlinNoise } from '../utils/noise';

export class ForestGenerator extends MapGenerator {
  generate(): MapData {
    // Get parameters with defaults
    const treeDensity = this.getParam('treeDensity', 0.3); // Density multiplier (0-1)
    const minTreeDistance = this.getParam('minTreeDistance', 3); // Minimum spacing between trees
    const noiseScale = this.getParam('noiseScale', 0.05); // Perlin noise frequency
    const treeRadius = this.getParam('treeRadius', 1.5); // Radius of tree circles

    // Validate parameters
    if (treeDensity < 0 || treeDensity > 1) {
      throw new Error('treeDensity must be between 0 and 1');
    }
    if (minTreeDistance < 1) {
      throw new Error('minTreeDistance must be at least 1');
    }
    if (treeRadius < 0.5 || treeRadius > 5) {
      throw new Error('treeRadius must be between 0.5 and 5');
    }

    // Generate potential tree positions using Poisson Disk Sampling
    // This guarantees minimum distance between all points (no overlapping trees)
    const poisson = new PoissonDiskSampling(
      this.width,
      this.height,
      minTreeDistance,
      this.seed // Seed ensures reproducible generation
    );
    const points = poisson.generate();
    
    console.log(`[ForestGenerator] Generated ${points.length} Poisson points`);
    console.log(`[ForestGenerator] Map size: ${this.width}x${this.height}`);
    console.log(`[ForestGenerator] Parameters:`, { treeDensity, minTreeDistance, noiseScale, treeRadius });

    // Use Perlin noise to create natural clustering and clearings
    const noise = new PerlinNoise(this.seed);
    const trees: Tree[] = [];
    
    let acceptedCount = 0;
    let rejectedCount = 0;
    const threshold = 1 - treeDensity;
    console.log(`[ForestGenerator] Noise threshold: ${threshold.toFixed(3)} (values above this create trees)`);

    for (const point of points) {
      // Sample Perlin noise at this position for organic density variation
      const noiseValue = noise.octaveNoise(
        point.x * noiseScale,
        point.y * noiseScale,
        4, // 4 octaves for detailed variation
        0.5 // Persistence
      );

      // Normalize noise from [-1, 1] to [0, 1] range
      const normalizedNoise = (noiseValue + 1) / 2;
      
      // Log first few samples for debugging
      if (trees.length < 3) {
        console.log(`[ForestGenerator] Point ${points.indexOf(point)}: noise=${normalizedNoise.toFixed(3)}, threshold=${threshold.toFixed(3)}, accept=${normalizedNoise > threshold}`);
      }

      // Tree appears if noise value exceeds threshold (controlled by density)
      // Higher density = lower threshold = more trees
      // Lower density = higher threshold = fewer trees (more clearings)
      if (normalizedNoise > threshold) {
        acceptedCount++;
        // Vary tree size based on noise value for visual interest
        // Size is a multiplier for the base treeRadius (0.7 to 1.5x)
        const sizeMultiplier = 0.7 + (normalizedNoise * 0.8);
        const actualRadius = treeRadius * sizeMultiplier;
        
        // Create typed Tree object
        trees.push({
          x: Math.floor(point.x),
          y: Math.floor(point.y),
          size: Math.round(actualRadius * 10) / 10 // Round to 1 decimal for storage
        });
      } else {
        rejectedCount++;
      }
    }

    console.log(`[ForestGenerator] Created ${trees.length} trees from ${points.length} points`);
    console.log(`[ForestGenerator] Accepted: ${acceptedCount}, Rejected: ${rejectedCount}`);
    console.log(`[ForestGenerator] Sample trees:`, trees.slice(0, 3));
    
    // Fallback: If no trees were created but we have points, create some anyway
    // This ensures the forest isn't completely empty
    if (trees.length === 0 && points.length > 0) {
      console.warn(`[ForestGenerator] No trees passed noise filter! Creating fallback trees...`);
      const fallbackCount = Math.min(Math.floor(points.length * 0.3), 50);
      for (let i = 0; i < fallbackCount; i++) {
        const point = points[i];
        trees.push({
          x: Math.floor(point.x),
          y: Math.floor(point.y),
          size: treeRadius
        });
      }
      console.log(`[ForestGenerator] Created ${trees.length} fallback trees`);
    }

    // Create grid for visualization (stores tree presence, not full background)
    const grid = this.createEmptyGrid(0); // 0 = clearing (no tree)
    
    // Mark tree positions on grid (for grid-based visibility)
    for (const tree of trees) {
      const radius = Math.ceil(tree.size || 1);
      // Mark cells around tree center (approximate circle)
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const x = tree.x + dx;
            const y = tree.y + dy;
            if (this.inBounds(x, y)) {
              grid[y][x] = 1; // 1 = tree present
            }
          }
        }
      }
    }

    console.log(`[ForestGenerator] Returning map data with ${trees.length} trees`);

    return {
      width: this.width,
      height: this.height,
      trees, // Typed Tree[] array
      grid,
      seed: this.seed, // Seed for reproducibility
      terrainType: TerrainType.Forest
    };
  }
}
