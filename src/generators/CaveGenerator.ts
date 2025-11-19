// Cave Generator using Cellular Automata
/**
 * Generates organic cave systems using cellular automata.
 * 
 * Algorithm Overview:
 * 1. Initialize grid with random walls based on fillProbability
 * 2. Apply cellular automata rules iteratively:
 *    - Cell becomes wall if 4+ neighbors are walls (configurable via wallThreshold)
 *    - Otherwise, cell becomes open space
 * 3. Ensure connectivity by removing isolated regions using flood fill
 * 4. Keep largest connected cave system
 * 
 * Features:
 * - Organic, natural-looking cave formations
 * - Adjustable roughness via caveRoughness parameter (affects fillProbability)
 * - Guaranteed connectivity (no isolated chambers)
 * - Cellular automata creates realistic cave patterns
 * 
 * Parameters:
 * - fillProbability: Initial chance of wall (0.0-1.0). Higher = more walls, rougher caves
 * - caveRoughness: Multiplier for fillProbability (0.5-2.0). Higher = rougher caves
 * - smoothIterations: Number of CA iterations (1-10). More = smoother caves
 * - wallThreshold: Neighbors needed to become wall (3-6). Default 4 creates balanced caves
 */

import { MapGenerator } from './MapGenerator';
import { MapData, TerrainType } from '../types/generator';

export class CaveGenerator extends MapGenerator<MapData, number> {
  generate(): MapData {
    console.log('[CaveGenerator] Starting cave generation');
    
    // Get parameters with defaults
    const baseFillProbability = this.getParam('fillProbability', 0.45);
    const caveRoughness = this.getParam('caveRoughness', 1.0);
    const smoothIterations = this.getParam('smoothIterations', 4);
    const wallThreshold = this.getParam('wallThreshold', 4); // Standard CA rule: 4+ neighbors = wall
    
    // Calculate adjusted fill probability based on roughness
    // Roughness < 1.0 = smoother caves (fewer walls)
    // Roughness > 1.0 = rougher caves (more walls)
    const fillProbability = Math.max(0.1, Math.min(0.8, baseFillProbability * caveRoughness));
    
    console.log(`[CaveGenerator] Parameters: fillProb=${fillProbability.toFixed(3)}, roughness=${caveRoughness}, iterations=${smoothIterations}, threshold=${wallThreshold}`);

    // Step 1: Initialize grid with random walls based on fillProbability
    let grid = this.initializeGrid(fillProbability);
    console.log(`[CaveGenerator] Initialized ${this.width}x${this.height} grid with ${fillProbability.toFixed(1)}% fill`);

    // Step 2: Apply cellular automata rules for specified iterations
    for (let iteration = 0; iteration < smoothIterations; iteration++) {
      grid = this.applyCellularAutomata(grid, wallThreshold);
      console.log(`[CaveGenerator] Completed iteration ${iteration + 1}/${smoothIterations}`);
    }

    // Step 3: Ensure connectivity by removing isolated regions
    grid = this.ensureConnectivity(grid);
    console.log('[CaveGenerator] Ensured connectivity - removed isolated regions');

    // Count final open spaces
    const openSpaces = grid.flat().filter(cell => cell === 0).length;
    const totalCells = this.width * this.height;
    console.log(`[CaveGenerator] Final cave: ${openSpaces}/${totalCells} open spaces (${((openSpaces/totalCells)*100).toFixed(1)}%)`);

    return {
      width: this.width,
      height: this.height,
      grid,
      seed: this.seed,
      terrainType: TerrainType.Cave
    };
  }

  /**
   * Initialize grid with random walls based on fillProbability
   * Edges are always walls to create contained cave systems
   */
  private initializeGrid(fillProbability: number): number[][] {
    const grid = this.createEmptyGrid(0);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Edges are always walls
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          grid[y][x] = 1;
        } else {
          // Random fill based on probability
          grid[y][x] = this.random.next() < fillProbability ? 1 : 0;
        }
      }
    }
    
    return grid;
  }

  /**
   * Apply cellular automata rules: cell becomes wall if wallThreshold or more neighbors are walls
   * Standard rule is 4+ neighbors = wall, which creates organic, cave-like patterns
   */
  private applyCellularAutomata(oldGrid: number[][], wallThreshold: number): number[][] {
    const newGrid = this.createEmptyGrid(0 as number);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Keep edges as walls
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          newGrid[y][x] = 1;
          continue;
        }

        // Count wall neighbors (including out-of-bounds as walls)
        const wallCount = this.countNeighbors(oldGrid, x, y, 1 as number);

        // Apply cellular automata rule
        // If 4+ neighbors are walls, become wall; else become open space
        if (wallCount >= wallThreshold) {
          newGrid[y][x] = 1;
        } else {
          newGrid[y][x] = 0;
        }
      }
    }

    return newGrid;
  }

  /**
   * Ensure connectivity by finding the largest connected region and removing isolated areas
   * Uses flood fill to identify all connected regions, keeps only the largest one
   * Enhanced to return information about the main chamber
   */
  private ensureConnectivity(grid: number[][]): number[][] {
    // Find all open space regions using flood fill
    const regions: Set<string>[] = [];
    const visited = new Set<string>();

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const key = `${x},${y}`;
        
        // If this is an open space we haven't visited yet
        if (grid[y][x] === 0 && !visited.has(key)) {
          // Flood fill to find all connected open spaces
          const region = this.floodFill(grid, x, y);
          
          // Mark all cells in this region as visited
          region.forEach(cellKey => visited.add(cellKey));
          
          regions.push(region);
        }
      }
    }

    console.log(`[CaveGenerator] Found ${regions.length} separate regions`);

    // If no regions found, return grid as-is (all walls)
    if (regions.length === 0) {
      console.warn('[CaveGenerator] No open regions found!');
      return grid;
    }

    // Find largest region (main chamber)
    const largestRegion = regions.reduce((largest, current) => 
      current.size > largest.size ? current : largest
    );
    
    const mainChamberSize = largestRegion.size;
    const totalOpenSpaces = regions.reduce((sum, region) => sum + region.size, 0);
    const mainChamberPercentage = ((mainChamberSize / totalOpenSpaces) * 100).toFixed(1);
    
    console.log(`[CaveGenerator] Main chamber: ${mainChamberSize} cells (${mainChamberPercentage}% of all open space)`);
    
    // Calculate center of main chamber for reference
    const mainChamberCenter = this.calculateRegionCenter(largestRegion);
    console.log(`[CaveGenerator] Main chamber center: (${mainChamberCenter.x}, ${mainChamberCenter.y})`);

    // Create new grid with only the largest region (main chamber)
    const connectedGrid = this.createEmptyGrid(1 as number); // Start with all walls

    // Copy edges (keep as walls)
    for (let x = 0; x < this.width; x++) {
      connectedGrid[0][x] = 1;
      connectedGrid[this.height - 1][x] = 1;
    }
    for (let y = 0; y < this.height; y++) {
      connectedGrid[y][0] = 1;
      connectedGrid[y][this.width - 1] = 1;
    }

    // Mark cells in largest region as open space (main chamber)
    largestRegion.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      if (this.inBounds(x, y)) {
        connectedGrid[y][x] = 0;
      }
    });

    return connectedGrid;
  }

  /**
   * Calculate the center point of a region
   * Returns the average x,y coordinates of all cells in the region
   */
  private calculateRegionCenter(region: Set<string>): { x: number; y: number } {
    let sumX = 0;
    let sumY = 0;
    let count = 0;

    region.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      sumX += x;
      sumY += y;
      count++;
    });

    return {
      x: Math.round(sumX / count),
      y: Math.round(sumY / count)
    };
  }

  /**
   * Flood fill to find all cells in a connected region
   * Returns a set of coordinate keys for all connected open spaces
   */
  private floodFill(grid: number[][], startX: number, startY: number): Set<string> {
    const visited = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = `${x},${y}`;

      // Skip if already visited
      if (visited.has(key)) continue;
      
      // Skip if out of bounds
      if (!this.inBounds(x, y)) continue;
      
      // Skip if wall
      if (grid[y][x] === 1) continue;

      // Mark as visited
      visited.add(key);

      // Add 4-directional neighbors to queue
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    return visited;
  }
}
