// Poisson Disk Sampling for tree/object distribution
// Guarantees minimum distance between all generated points (no overlaps)

import { Point } from '../types/generator';
import { SeededRandom } from './random';

/**
 * Poisson Disk Sampling generates evenly-spaced random points
 * with a guaranteed minimum distance between all points.
 * 
 * This is perfect for:
 * - Tree placement in forests (organic spacing without overlap)
 * - Object distribution (items, rocks, etc.)
 * - Any scenario requiring "blue noise" distribution
 * 
 * Algorithm: Fast Poisson Disk Sampling by Robert Bridson
 * Time complexity: O(n) where n is the number of points generated
 */
export class PoissonDiskSampling {
  private width: number;
  private height: number;
  private minDistance: number; // Guaranteed minimum distance between any two points
  private random: SeededRandom;
  private cellSize: number;
  private grid: (Point | null)[][];
  private active: Point[];

  constructor(
    width: number,
    height: number,
    minDistance: number,
    seed?: number
  ) {
    this.width = width;
    this.height = height;
    this.minDistance = minDistance;
    this.random = new SeededRandom(seed);
    
    // Cell size for spatial grid (optimizes neighbor search)
    this.cellSize = minDistance / Math.sqrt(2);
    const cols = Math.ceil(width / this.cellSize);
    const rows = Math.ceil(height / this.cellSize);
    
    // Spatial grid for O(1) neighbor lookup
    this.grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
    this.active = [];
  }

  private gridCoords(point: Point): [number, number] {
    const col = Math.floor(point.x / this.cellSize);
    const row = Math.floor(point.y / this.cellSize);
    return [row, col];
  }

  /**
   * Check if a point is valid (within bounds and far enough from all other points)
   * This is the core overlap prevention mechanism
   */
  private isValidPoint(point: Point): boolean {
    // Bounds check
    if (point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height) {
      return false;
    }

    const [row, col] = this.gridCoords(point);
    const searchRadius = 2; // Check surrounding cells

    // Check all neighbors within search radius
    for (let r = Math.max(0, row - searchRadius); r <= Math.min(this.grid.length - 1, row + searchRadius); r++) {
      for (let c = Math.max(0, col - searchRadius); c <= Math.min(this.grid[0].length - 1, col + searchRadius); c++) {
        const neighbor = this.grid[r][c];
        if (neighbor) {
          const dx = point.x - neighbor.x;
          const dy = point.y - neighbor.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Reject if too close (guarantees minDistance)
          if (dist < this.minDistance) {
            return false;
          }
        }
      }
    }

    return true; // Point is valid
  }

  /**
   * Generate points using Poisson Disk Sampling algorithm
   * Returns array of points with guaranteed minimum spacing
   * 
   * @param maxAttempts - Number of attempts to place new point around each active point
   * @returns Array of Points with guaranteed minDistance separation
   */
  generate(maxAttempts: number = 30): Point[] {
    const points: Point[] = [];

    // Start with random point
    const first: Point = {
      x: this.random.nextFloat(0, this.width),
      y: this.random.nextFloat(0, this.height)
    };
    
    const [row, col] = this.gridCoords(first);
    this.grid[row][col] = first;
    this.active.push(first);
    points.push(first);

    while (this.active.length > 0) {
      const idx = this.random.nextInt(0, this.active.length - 1);
      const point = this.active[idx];
      let found = false;

      for (let i = 0; i < maxAttempts; i++) {
        const angle = this.random.nextFloat(0, 2 * Math.PI);
        const radius = this.random.nextFloat(this.minDistance, 2 * this.minDistance);
        
        const newPoint: Point = {
          x: point.x + radius * Math.cos(angle),
          y: point.y + radius * Math.sin(angle)
        };

        if (this.isValidPoint(newPoint)) {
          const [r, c] = this.gridCoords(newPoint);
          this.grid[r][c] = newPoint;
          this.active.push(newPoint);
          points.push(newPoint);
          found = true;
          break;
        }
      }

      if (!found) {
        this.active.splice(idx, 1);
      }
    }

    return points;
  }
}
