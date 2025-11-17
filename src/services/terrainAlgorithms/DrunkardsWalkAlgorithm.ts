import { v4 as uuidv4 } from 'uuid';
import { Position } from '../../types/map';
import { MapGenerationOptions } from '../mapGenerationService';
import { MapTerrainType, CaveSubtype } from '../../types/enums';
import { GeneratedRoom } from './types';
import { getCaveConfig } from '../../config';

/**
 * Drunkard's Walk Algorithm for organic cave generation
 * 
 * This algorithm simulates a random walker ("drunkard") carving out cave passages.
 * The walker moves randomly through the grid, creating connected organic cave systems.
 * 
 * Features:
 * - Organic, natural-looking cave passages
 * - Connected cave systems without manual corridor placement
 * - Rooms (large open areas) emerge naturally from walker behavior
 * - Suitable for caves, caverns, and organic underground systems
 */
export class DrunkardsWalkAlgorithm {
  private seed: number = Math.random();

  constructor(seed?: number) {
    if (seed !== undefined) {
      this.seed = seed;
    }
  }

  setSeed(seed: number) {
    this.seed = seed;
  }

  private random(): number {
    // Simple seeded random number generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate cave system using Drunkard's Walk algorithm
   * 
   * @param options - Map generation options
   * @returns Array of generated cave rooms/areas
   */
  generateCave(options: MapGenerationOptions): {
    rooms: GeneratedRoom[];
    corridors: Position[][];
    caveMap: boolean[][];
  } {
    const { width, height, terrainType, subtype } = options;
    
    // Get cave configuration for this subtype
    const caveConfig = terrainType === MapTerrainType.CAVE && subtype 
      ? getCaveConfig(subtype as CaveSubtype)
      : undefined;
    
    // Extract Drunkard's Walk parameters from config or use defaults
    const dwParams = caveConfig?.drunkardsWalk || {};
    const coveragePercent = dwParams.coveragePercent || 15;
    const cavemapResolution = dwParams.resolution || 3;
    const directionChangeChance = dwParams.directionChangeChance || 0.15;
    const widerAreaChance = dwParams.widerAreaChance || 0.02;
    const minStepsBeforeChange = dwParams.minStepsBeforeChange || 3;
    const maxStepsBeforeChange = dwParams.maxStepsBeforeChange || 8;
    
    // Calculate cave map dimensions at higher resolution
    const caveWidth = width * cavemapResolution;
    const caveHeight = height * cavemapResolution;
    
    // Calculate target floor tiles based on coverage percentage
    const targetFloorTiles = Math.floor(caveWidth * caveHeight * (coveragePercent / 100));
    
    // Initialize cave map (true = wall, false = floor/cave)
    const caveMap: boolean[][] = Array(caveHeight).fill(null).map(() => Array(caveWidth).fill(true));
    
    // Step 1: Drunkard's Walk to carve out cave
    this.carveWithDrunkard(
      caveMap, 
      caveWidth, 
      caveHeight, 
      targetFloorTiles,
      directionChangeChance,
      widerAreaChance,
      minStepsBeforeChange,
      maxStepsBeforeChange
    );
    
    // Step 2: Convert cave map to rectangular regions for organic rendering
    const rooms = this.convertCaveMapToTiles(caveMap, caveWidth, caveHeight, cavemapResolution);
    
    // Step 3: No separate corridors - the tiles represent the full cave system
    const corridors: Position[][] = [];
    
    return { rooms, corridors, caveMap };
  }

  /**
   * Convert cave map to larger rectangular regions for efficient rendering
   * Groups cave tiles into bigger rectangles to reduce object count and corners
   * Uses a greedy rectangle-packing algorithm
   */
  private convertCaveMapToTiles(
    caveMap: boolean[][],
    width: number,
    height: number,
    resolution: number
  ): GeneratedRoom[] {
    const tiles: GeneratedRoom[] = [];
    
    // Convert from high-resolution cave map back to grid coordinates
    const tileScale = 1 / resolution;
    
    // Create a copy to track which tiles have been processed
    const processed: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
    
    // Greedy rectangle packing: find the largest rectangles possible
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // If this is a floor tile and not yet processed
        if (!caveMap[y][x] && !processed[y][x]) {
          // Find the largest rectangle starting at this position
          const rect = this.findLargestRectangle(caveMap, processed, x, y, width, height);
          
          // Mark all tiles in this rectangle as processed
          for (let ry = rect.y; ry < rect.y + rect.height; ry++) {
            for (let rx = rect.x; rx < rect.x + rect.width; rx++) {
              processed[ry][rx] = true;
            }
          }
          
          // Create a room object for this rectangle
          const tile: GeneratedRoom = {
            id: uuidv4(),
            type: 'cave_tile',
            shape: { type: 'rectangle' },
            position: { x: rect.x * tileScale, y: rect.y * tileScale },
            size: { width: rect.width * tileScale, height: rect.height * tileScale },
            doors: []
          };
          tiles.push(tile);
        }
      }
    }
    
    return tiles;
  }

  /**
   * Find the largest rectangle of floor tiles starting at (startX, startY)
   * Uses a greedy approach to maximize rectangle area
   */
  private findLargestRectangle(
    caveMap: boolean[][],
    processed: boolean[][],
    startX: number,
    startY: number,
    mapWidth: number,
    mapHeight: number
  ): { x: number; y: number; width: number; height: number } {
    // Find the maximum width at the starting row
    let maxWidth = 0;
    while (
      startX + maxWidth < mapWidth &&
      !caveMap[startY][startX + maxWidth] &&
      !processed[startY][startX + maxWidth]
    ) {
      maxWidth++;
    }
    
    // Expand downward, maintaining the maximum width possible
    let height = 1;
    let currentWidth = maxWidth;
    
    while (startY + height < mapHeight && currentWidth > 0) {
      // Check how far we can extend in this row
      let rowWidth = 0;
      while (
        startX + rowWidth < startX + currentWidth &&
        startX + rowWidth < mapWidth &&
        !caveMap[startY + height][startX + rowWidth] &&
        !processed[startY + height][startX + rowWidth]
      ) {
        rowWidth++;
      }
      
      // If we can't maintain at least some width, stop expanding
      if (rowWidth === 0) break;
      
      // Use the minimum width to maintain a rectangle
      currentWidth = Math.min(currentWidth, rowWidth);
      height++;
    }
    
    return {
      x: startX,
      y: startY,
      width: currentWidth,
      height: height
    };
  }

  /**
   * Carve out cave using drunkard's walk
   */
  private carveWithDrunkard(
    caveMap: boolean[][],
    width: number,
    height: number,
    targetFloorTiles: number,
    directionChangeChance: number,
    widerAreaChance: number,
    minStepsBeforeChange: number,
    maxStepsBeforeChange: number
  ): void {
    // Start from center
    let x = Math.floor(width / 2);
    let y = Math.floor(height / 2);
    
    let floorTiles = 0;
    
    // Directions: up, right, down, left
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];
    
    // Direction persistence (drunkard tends to keep walking same direction)
    let currentDirection = Math.floor(this.random() * directions.length);
    let stepsInDirection = 0;
    const stepsBeforeChange = minStepsBeforeChange + Math.floor(this.random() * (maxStepsBeforeChange - minStepsBeforeChange));
    
    while (floorTiles < targetFloorTiles) {
      // Carve single tiles most of the time, occasionally carve slightly wider
      // This creates narrow, winding passages with occasional wider "rooms"
      const carveRadius = this.random() < widerAreaChance ? 2 : 1;
      
      // Carve current position and potentially surrounding tiles
      for (let dy = -carveRadius + 1; dy < carveRadius; dy++) {
        for (let dx = -carveRadius + 1; dx < carveRadius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1) {
            if (caveMap[ny][nx]) {
              caveMap[ny][nx] = false;
              floorTiles++;
              
              // Stop early if we've reached target
              if (floorTiles >= targetFloorTiles) {
                return;
              }
            }
          }
        }
      }
      
      // Change direction occasionally (add some randomness to the walk)
      // Lower probability means longer, straighter passages
      stepsInDirection++;
      if (stepsInDirection >= stepsBeforeChange || this.random() < directionChangeChance) {
        currentDirection = Math.floor(this.random() * directions.length);
        stepsInDirection = 0;
      }
      
      // Move in current direction (move one tile at a time for narrow passages)
      const direction = directions[currentDirection];
      x += direction.dx;
      y += direction.dy;
      
      // Keep within bounds
      x = Math.max(1, Math.min(width - 2, x));
      y = Math.max(1, Math.min(height - 2, y));
    }
  }
}
