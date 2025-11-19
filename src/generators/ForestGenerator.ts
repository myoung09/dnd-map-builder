// Forest Generator with Dense Tree Coverage and Guaranteed Walkable Paths
// Creates densely packed forests with clear walkable areas and entrance/exit paths

import { MapGenerator } from './MapGenerator';
import { MapData, Tree, PathPoint, TerrainType } from '../types/generator';
import { PerlinNoise } from '../utils/noise';
import { SeededRandom } from '../utils/random';

export class ForestGenerator extends MapGenerator<MapData, number> {
  private noise: PerlinNoise;
  private rng: SeededRandom; // Renamed from 'random' to avoid conflict
  
  constructor(params: any) {
    super(params);
    this.noise = new PerlinNoise(this.seed);
    this.rng = new SeededRandom(this.seed);
  }

  generate(): MapData {
    // Get parameters with defaults
    const clearingSize = this.getParam('clearingSize', 6); // Min clearing width
    const treeRadius = this.getParam('treeRadius', 2.5); // Individual tree size (increased from 1.5)
    const minTreeDistance = this.getParam('minTreeDistance', 2); // Min spacing
    const treeDensity = this.getParam('treeDensity', 0.95); // 0-1, how densely to pack trees (default: very dense)
    
    console.log(`[ForestGenerator] Starting DENSE forest generation`);
    console.log(`[ForestGenerator] Map: ${this.width}x${this.height}`);
    console.log(`[ForestGenerator] Tree density: ${treeDensity}, tree radius: ${treeRadius}, min distance: ${minTreeDistance}`);
    console.log(`[ForestGenerator] Clearing size: ${clearingSize}`);

    // Step 1: Generate entrance and exit points
    const entrance = this.generateEntrancePoint();
    const exit = this.generateExitPoint();
    console.log(`[ForestGenerator] Entrance: (${entrance.x}, ${entrance.y})`);
    console.log(`[ForestGenerator] Exit: (${exit.x}, ${exit.y})`);

    // Step 2: Generate walkable path from entrance to exit (without cluster dependency)
    const mainPath = this.generatePathDirect(entrance, exit, clearingSize);
    console.log(`[ForestGenerator] Generated main path with ${mainPath.length} points`);

    // Step 3: Generate branching paths from the main path
    const branchPathDensity = this.getParam('branchPathDensity', 0.5); // 0 = none, 1 = dense
    const branches = this.generateBranchingPathsDirect(mainPath, clearingSize, branchPathDensity);

    // Combine all paths for tree placement (main + branches)
    const allPaths = [...mainPath];
    for (const branch of branches) {
      allPaths.push(...branch);
    }

    // Step 4: Fill entire map with trees using grid-based dense placement
    const trees = this.fillMapWithTrees(
      allPaths,
      treeRadius,
      minTreeDistance,
      clearingSize,
      treeDensity
    );
    console.log(`[ForestGenerator] Densely placed ${trees.length} trees across entire map`);

    // Step 5: Create grid representation
    const grid = this.createGridRepresentation(trees, allPaths, treeRadius, clearingSize);

    console.log(`[ForestGenerator] Dense forest generation complete`);

    return {
      width: this.width,
      height: this.height,
      trees,
      paths: mainPath, // Main path for test continuity check
      branchPaths: branches, // Separate branch paths for rendering
      entrance,
      exit,
      grid,
      seed: this.seed,
      terrainType: TerrainType.Forest
    };
  }

  /**
   * Fill entire map with trees using dense grid-based placement
   * Avoids paths and uses Perlin noise for natural size variation
   */
  private fillMapWithTrees(
    paths: PathPoint[],
    treeRadius: number,
    minTreeDistance: number,
    pathBuffer: number,
    treeDensity: number
  ): Tree[] {
    const trees: Tree[] = [];
    const pathBufferRadius = pathBuffer / 2;
    
    // Create a set of path positions for fast lookup
    const pathSet = new Set<string>();
    for (const point of paths) {
      // Mark area around path as blocked
      for (let dy = -pathBufferRadius; dy <= pathBufferRadius; dy++) {
        for (let dx = -pathBufferRadius; dx <= pathBufferRadius; dx++) {
          const px = Math.floor(point.x + dx);
          const py = Math.floor(point.y + dy);
          pathSet.add(`${px},${py}`);
        }
      }
    }
    
    console.log(`[ForestGenerator] Path buffer created with ${pathSet.size} blocked cells`);
    
    // Grid-based sampling for dense placement
    const gridStep = Math.max(1, Math.floor(minTreeDistance * 0.8)); // Slightly overlap for density
    let attemptedPlacements = 0;
    let successfulPlacements = 0;
    
    for (let y = 0; y < this.height; y += gridStep) {
      for (let x = 0; x < this.width; x += gridStep) {
        attemptedPlacements++;
        
        // Add small random offset for natural look
        const offsetX = this.rng.nextFloat(-gridStep * 0.3, gridStep * 0.3);
        const offsetY = this.rng.nextFloat(-gridStep * 0.3, gridStep * 0.3);
        const treeX = Math.max(0, Math.min(this.width - 1, x + offsetX));
        const treeY = Math.max(0, Math.min(this.height - 1, y + offsetY));
        
        // Check if position is on path
        const key = `${Math.floor(treeX)},${Math.floor(treeY)}`;
        if (pathSet.has(key)) continue;
        
        // Use noise-based probability for slight variation (but keep very high)
        const noiseValue = this.noise.octaveNoise(treeX * 0.05, treeY * 0.05, 2, 0.5);
        const normalizedNoise = (noiseValue + 1) / 2;
        if (normalizedNoise < (1 - treeDensity)) continue; // Only skip if noise is very low
        
        // Check distance from existing trees (quick rejection)
        let tooClose = false;
        const checkRadius = minTreeDistance * 2; // Limit search area
        
        for (const existingTree of trees) {
          // Quick bounds check before distance calculation
          if (Math.abs(existingTree.x - treeX) > checkRadius || 
              Math.abs(existingTree.y - treeY) > checkRadius) {
            continue;
          }
          
          const dx = existingTree.x - treeX;
          const dy = existingTree.y - treeY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minTreeDistance) {
            tooClose = true;
            break;
          }
        }
        
        if (tooClose) continue;
        
        // Place tree with noise-based size variation
        const sizeNoise = this.noise.octaveNoise(treeX * 0.1, treeY * 0.1, 2, 0.5);
        const sizeVariation = 0.7 + ((sizeNoise + 1) / 2) * 0.6; // 0.7 to 1.3 range
        
        trees.push({
          x: treeX,
          y: treeY,
          size: Math.round(treeRadius * sizeVariation * 10) / 10,
          clusterId: 0 // No clusters in dense mode
        });
        
        successfulPlacements++;
      }
    }
    
    console.log(`[ForestGenerator] Dense placement: ${successfulPlacements}/${attemptedPlacements} trees placed (${(successfulPlacements/attemptedPlacements*100).toFixed(1)}% success rate)`);
    
    return trees;
  }

  /**
   * Generate entrance point on the left edge
   */
  private generateEntrancePoint(): PathPoint {
    const y = Math.floor(this.height / 2) + this.rng.nextInt(-10, 10);
    return { x: 0, y: Math.max(0, Math.min(this.height - 1, y)) };
  }

  /**
   * Generate exit point on the right edge
   */
  private generateExitPoint(): PathPoint {
    const y = Math.floor(this.height / 2) + this.rng.nextInt(-10, 10);
    return { x: this.width - 1, y: Math.max(0, Math.min(this.height - 1, y)) };
  }

  /**
   * Generate a walkable path from entrance to exit using direct waypoint interpolation
   * No cluster avoidance needed in dense mode
   */
  private generatePathDirect(
    entrance: PathPoint,
    exit: PathPoint,
    clearingSize: number
  ): PathPoint[] {
    const path: PathPoint[] = [];
    
    // Add entrance
    path.push({ ...entrance });
    
    // Generate waypoints for natural meandering path
    const numWaypoints = 3 + this.rng.nextInt(0, 3);
    const waypoints: PathPoint[] = [];
    
    for (let i = 0; i < numWaypoints; i++) {
      const progress = (i + 1) / (numWaypoints + 1);
      const baseX = Math.floor(entrance.x + (exit.x - entrance.x) * progress);
      const baseY = Math.floor(entrance.y + (exit.y - entrance.y) * progress);
      
      // Offset waypoint to create meandering path
      const offsetX = this.rng.nextInt(-15, 15);
      const offsetY = this.rng.nextInt(-15, 15);
      
      const x = Math.max(clearingSize, Math.min(this.width - clearingSize, baseX + offsetX));
      const y = Math.max(clearingSize, Math.min(this.height - clearingSize, baseY + offsetY));
      
      waypoints.push({ x, y });
    }
    
    // Add exit
    waypoints.push({ ...exit });
    
    // Interpolate between waypoints to create smooth path
    let current = entrance;
    for (const waypoint of waypoints) {
      const segment = this.interpolatePath(current, waypoint);
      path.push(...segment.slice(1)); // Skip first point (already added)
      current = waypoint;
    }
    
    return path;
  }

  /**
   * Interpolate a straight path between two points
   */
  private interpolatePath(start: PathPoint, end: PathPoint): PathPoint[] {
    const points: PathPoint[] = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: Math.floor(start.x + dx * t),
        y: Math.floor(start.y + dy * t)
      });
    }
    
    return points;
  }

  /**
   * Generate branching paths from the main path (direct version without cluster checking)
   * Creates side trails that wander into the forest
   * @param branchPathDensity - Controls number of branches: 0 = none, 0.5 = moderate, 1.0 = very dense
   */
  private generateBranchingPathsDirect(
    mainPath: PathPoint[],
    clearingSize: number,
    branchPathDensity: number = 0.5
  ): PathPoint[][] {
    const branches: PathPoint[][] = [];
    
    // Calculate number of branches based on density parameter
    // Base range: 1-10 branches, scaled by density
    const minBranches = Math.max(0, Math.floor(branchPathDensity * 3));
    const maxBranches = Math.max(minBranches, Math.floor(branchPathDensity * 10));
    const numBranches = minBranches + this.rng.nextInt(0, maxBranches - minBranches);
    
    if (numBranches === 0) {
      console.log(`[ForestGenerator] Branch path density ${branchPathDensity} - creating no branch paths`);
      return branches;
    }
    
    console.log(`[ForestGenerator] Branch path density ${branchPathDensity.toFixed(2)} - creating ${numBranches} branch paths...`);
    
    for (let i = 0; i < numBranches; i++) {
      // Pick a random point along the main path to branch from (avoid first/last 20%)
      const startIdx = Math.floor(mainPath.length * 0.2) + 
                      this.rng.nextInt(0, Math.floor(mainPath.length * 0.6));
      const branchStart = mainPath[startIdx];
      
      // Determine branch direction (perpendicular to main path direction)
      let directionAngle;
      if (startIdx < mainPath.length - 1) {
        const nextPoint = mainPath[startIdx + 1];
        const pathAngle = Math.atan2(nextPoint.y - branchStart.y, nextPoint.x - branchStart.x);
        // Branch perpendicular (±90 degrees)
        directionAngle = pathAngle + (this.rng.nextInt(0, 1) === 0 ? Math.PI / 2 : -Math.PI / 2);
      } else {
        directionAngle = this.rng.nextFloat(0, Math.PI * 2);
      }
      
      // Create meandering branch path with length affected by density
      const baseBranchLength = 15 + this.rng.nextInt(0, 25); // 15-40 units base
      const branchLength = Math.floor(baseBranchLength * (0.5 + branchPathDensity * 0.75)); // Scale by density
      
      const branch = this.createBranchPathDirect(
        branchStart,
        directionAngle,
        branchLength,
        clearingSize
      );
      
      console.log(`[ForestGenerator] Branch ${i + 1}: ${branch.length} points from (${branchStart.x}, ${branchStart.y})`);
      
      if (branch.length > 0) {
        branches.push(branch);
      }
    }
    
    const totalBranchPoints = branches.reduce((sum, b) => sum + b.length, 0);
    console.log(`[ForestGenerator] Created ${totalBranchPoints} branch path points in ${branches.length} branches`);
    
    return branches;
  }

  /**
   * Create a single meandering branch path (direct version without cluster checking)
   */
  private createBranchPathDirect(
    start: PathPoint,
    initialAngle: number,
    length: number,
    clearingSize: number
  ): PathPoint[] {
    const branch: PathPoint[] = [];
    let currentX = start.x;
    let currentY = start.y;
    let angle = initialAngle;
    
    for (let step = 0; step < length; step++) {
      // Add some randomness to create meandering
      angle += this.rng.nextFloat(-0.3, 0.3); // Vary direction
      
      // Move in current direction
      currentX += Math.cos(angle) * 2;
      currentY += Math.sin(angle) * 2;
      
      // Keep within bounds
      currentX = Math.max(clearingSize, Math.min(this.width - clearingSize, currentX));
      currentY = Math.max(clearingSize, Math.min(this.height - clearingSize, currentY));
      
      const point = {
        x: Math.floor(currentX),
        y: Math.floor(currentY)
      };
      
      branch.push(point);
    }
    
    return branch;
  }

  /**
   * Create grid representation: 0 = clearing, 1 = tree, 2 = path
   */
  private createGridRepresentation(
    trees: Tree[],
    path: PathPoint[],
    treeRadius: number,
    clearingSize: number
  ): number[][] {
    const grid = this.createEmptyGrid(0);
    
    // Mark trees (round coordinates to integers for grid placement)
    for (const tree of trees) {
      const treeX = Math.floor(tree.x);
      const treeY = Math.floor(tree.y);
      const radius = Math.ceil(tree.size || treeRadius);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const x = treeX + dx;
            const y = treeY + dy;
            if (this.inBounds(x, y)) {
              grid[y][x] = 1; // Tree
            }
          }
        }
      }
    }
    
    // Mark path with buffer
    const pathWidth = Math.floor(clearingSize / 2);
    for (const point of path) {
      for (let dy = -pathWidth; dy <= pathWidth; dy++) {
        for (let dx = -pathWidth; dx <= pathWidth; dx++) {
          const x = Math.floor(point.x) + dx;
          const y = Math.floor(point.y) + dy;
          if (this.inBounds(x, y)) {
            grid[y][x] = 2; // Path (overrides trees)
          }
        }
      }
    }
    
    return grid;
  }
}
