// Forest Generator with Clustered Trees and Guaranteed Walkable Paths
// Creates natural-looking tree clumps with clear walkable areas and entrance/exit paths

import { MapGenerator } from './MapGenerator';
import { MapData, Tree, PathPoint, TerrainType } from '../types/generator';
import { PerlinNoise } from '../utils/noise';
import { SeededRandom } from '../utils/random';

interface Cluster {
  id: number;
  centerX: number;
  centerY: number;
  radius: number;
  treeCount: number;
}

export class ForestGenerator extends MapGenerator {
  private noise: PerlinNoise;
  private rng: SeededRandom; // Renamed from 'random' to avoid conflict
  
  constructor(params: any) {
    super(params);
    this.noise = new PerlinNoise(this.seed);
    this.rng = new SeededRandom(this.seed);
  }

  generate(): MapData {
    // Get parameters with defaults
    const clusterSize = this.getParam('clusterSize', 8); // Trees per cluster
    const clusterRadius = this.getParam('clusterRadius', 8); // Cluster radius
    const clearingSize = this.getParam('clearingSize', 6); // Min clearing width
    const treeRadius = this.getParam('treeRadius', 2.5); // Individual tree size (increased from 1.5)
    const minTreeDistance = this.getParam('minTreeDistance', 2); // Min spacing
    
    // Auto-calculate number of clusters based on map size
    const mapArea = this.width * this.height;
    const clusterArea = Math.PI * clusterRadius * clusterRadius;
    const numClusters = this.getParam('numClusters', Math.floor(mapArea / (clusterArea * 4)));
    
    console.log(`[ForestGenerator] Starting clustered forest generation`);
    console.log(`[ForestGenerator] Map: ${this.width}x${this.height}, Clusters: ${numClusters}`);
    console.log(`[ForestGenerator] Cluster size: ${clusterSize}, radius: ${clusterRadius}`);
    console.log(`[ForestGenerator] Clearing size: ${clearingSize}, tree radius: ${treeRadius}`);

    // Step 1: Generate cluster centers using Perlin noise for natural distribution
    const clusters = this.generateClusterCenters(numClusters, clusterRadius, clearingSize);
    console.log(`[ForestGenerator] Generated ${clusters.length} cluster centers`);

    // Step 2: Generate entrance and exit points
    const entrance = this.generateEntrancePoint();
    const exit = this.generateExitPoint();
    console.log(`[ForestGenerator] Entrance: (${entrance.x}, ${entrance.y})`);
    console.log(`[ForestGenerator] Exit: (${exit.x}, ${exit.y})`);

    // Step 3: Generate walkable path from entrance to exit
    const mainPath = this.generatePath(entrance, exit, clusters, clearingSize);
    console.log(`[ForestGenerator] Generated main path with ${mainPath.length} points`);

    // Step 3.5: Generate branching paths from the main path
    const branches = this.generateBranchingPaths(mainPath, clusters, clearingSize);

    // Combine all paths for tree placement (main + branches)
    const allPaths = [...mainPath];
    for (const branch of branches) {
      allPaths.push(...branch);
    }

    // Step 4: Populate clusters with trees, avoiding all paths
    const trees = this.populateClusters(
      clusters,
      clusterSize,
      clusterRadius,
      treeRadius,
      minTreeDistance,
      allPaths,
      clearingSize
    );
    console.log(`[ForestGenerator] Placed ${trees.length} trees in ${clusters.length} clusters`);

    // Step 5: Create grid representation
    const grid = this.createGridRepresentation(trees, allPaths, treeRadius, clearingSize);

    console.log(`[ForestGenerator] Forest generation complete`);

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
   * Generate cluster centers using Perlin noise for natural placement
   */
  private generateClusterCenters(
    numClusters: number,
    clusterRadius: number,
    clearingSize: number
  ): Cluster[] {
    const clusters: Cluster[] = [];
    const minDistance = clusterRadius * 2 + clearingSize;
    const maxAttempts = numClusters * 20; // More attempts for better coverage
    
    // Track attempts for adaptive threshold
    let attempts = 0;
    let noiseThreshold = 0.4; // Start with moderate threshold
    let attemptsSinceLastCluster = 0;
    
    console.log(`[ForestGenerator] Generating ${numClusters} cluster centers...`);
    
    while (clusters.length < numClusters && attempts < maxAttempts) {
      attempts++;
      attemptsSinceLastCluster++;
      
      // Adaptively lower noise threshold if we're struggling to place clusters
      if (attemptsSinceLastCluster > 50 && noiseThreshold > 0.2) {
        noiseThreshold -= 0.05;
        attemptsSinceLastCluster = 0;
        console.log(`[ForestGenerator] Lowering noise threshold to ${noiseThreshold.toFixed(2)}`);
      }
      
      // Generate random position with noise-based bias
      const x = this.rng.nextInt(clusterRadius, this.width - clusterRadius);
      const y = this.rng.nextInt(clusterRadius, this.height - clusterRadius);
      
      // Use Perlin noise to bias cluster placement (create natural patterns)
      const noiseValue = this.noise.octaveNoise(
        x * 0.02,
        y * 0.02,
        3,
        0.5
      );
      const normalizedNoise = (noiseValue + 1) / 2;
      
      // Skip if noise value is too low (creates natural gaps)
      if (normalizedNoise < noiseThreshold) continue;
      
      // Check distance from existing clusters
      const tooClose = clusters.some(cluster => {
        const dx = cluster.centerX - x;
        const dy = cluster.centerY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < minDistance;
      });
      
      if (!tooClose) {
        clusters.push({
          id: clusters.length,
          centerX: x,
          centerY: y,
          radius: clusterRadius,
          treeCount: 0
        });
        attemptsSinceLastCluster = 0;
      }
    }
    
    console.log(`[ForestGenerator] Created ${clusters.length} clusters after ${attempts} attempts (target: ${numClusters})`);
    
    return clusters;
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
   * Generate a walkable path from entrance to exit using A* algorithm
   */
  private generatePath(
    entrance: PathPoint,
    exit: PathPoint,
    clusters: Cluster[],
    clearingSize: number
  ): PathPoint[] {
    // Simple path generation using waypoints and interpolation
    const path: PathPoint[] = [];
    
    // Add entrance
    path.push({ ...entrance });
    
    // Generate waypoints that avoid clusters
    const numWaypoints = 3 + this.rng.nextInt(0, 3);
    const waypoints: PathPoint[] = [];
    
    for (let i = 0; i < numWaypoints; i++) {
      const progress = (i + 1) / (numWaypoints + 1);
      const baseX = Math.floor(entrance.x + (exit.x - entrance.x) * progress);
      const baseY = Math.floor(entrance.y + (exit.y - entrance.y) * progress);
      
      // Offset waypoint to create meandering path
      const offsetX = this.rng.nextInt(-15, 15);
      const offsetY = this.rng.nextInt(-15, 15);
      
      let x = Math.max(0, Math.min(this.width - 1, baseX + offsetX));
      let y = Math.max(0, Math.min(this.height - 1, baseY + offsetY));
      
      // Move waypoint away from clusters
      for (let attempt = 0; attempt < 5; attempt++) {
        let currentX = x;
        let currentY = y;
        
        const nearCluster = clusters.find(cluster => {
          const dx = cluster.centerX - currentX;
          const dy = cluster.centerY - currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < cluster.radius + clearingSize;
        });
        
        if (!nearCluster) break;
        
        // Move perpendicular to cluster center
        const dx = currentX - nearCluster.centerX;
        const dy = currentY - nearCluster.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          x += Math.floor((dx / dist) * clearingSize);
          y += Math.floor((dy / dist) * clearingSize);
          x = Math.max(0, Math.min(this.width - 1, x));
          y = Math.max(0, Math.min(this.height - 1, y));
        }
      }
      
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
   * Generate branching paths from the main path
   * Creates side trails that wander into the forest
   */
  private generateBranchingPaths(
    mainPath: PathPoint[],
    clusters: Cluster[],
    clearingSize: number
  ): PathPoint[][] {
    const branches: PathPoint[][] = [];
    const numBranches = 3 + this.rng.nextInt(0, 4); // 3-7 branches
    
    console.log(`[ForestGenerator] Creating ${numBranches} branch paths...`);
    
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
      
      // Create meandering branch path
      const branchLength = 15 + this.rng.nextInt(0, 25); // 15-40 units
      const branch = this.createBranchPath(
        branchStart,
        directionAngle,
        branchLength,
        clusters,
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
   * Create a single meandering branch path
   */
  private createBranchPath(
    start: PathPoint,
    initialAngle: number,
    length: number,
    clusters: Cluster[],
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
      
      // Check if we're too close to a cluster center (avoid dead-ending in trees)
      const tooCloseToCluster = clusters.some(cluster => {
        const dx = cluster.centerX - point.x;
        const dy = cluster.centerY - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < cluster.radius * 0.5; // Stop if getting too deep into a cluster
      });
      
      if (tooCloseToCluster) {
        break; // End this branch here
      }
      
      branch.push(point);
    }
    
    return branch;
  }

  /**
   * Populate each cluster with trees using Poisson disk sampling
   */
  private populateClusters(
    clusters: Cluster[],
    clusterSize: number,
    clusterRadius: number,
    treeRadius: number,
    minTreeDistance: number,
    path: PathPoint[],
    clearingSize: number
  ): Tree[] {
    const trees: Tree[] = [];
    const pathBuffer = clearingSize / 2;
    
    for (const cluster of clusters) {
      const clusterTrees: Tree[] = [];
      const attempts = clusterSize * 5;
      
      for (let i = 0; i < attempts && clusterTrees.length < clusterSize; i++) {
        // Generate random position within cluster radius
        const angle = this.rng.nextFloat(0, Math.PI * 2);
        const dist = this.rng.nextFloat(0, clusterRadius);
        const x = Math.floor(cluster.centerX + Math.cos(angle) * dist);
        const y = Math.floor(cluster.centerY + Math.sin(angle) * dist);
        
        // Check bounds
        if (!this.inBounds(x, y)) continue;
        
        // Check distance from path
        const tooCloseToPath = path.some(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < pathBuffer;
        });
        if (tooCloseToPath) continue;
        
        // Check distance from other trees
        const tooCloseToTree = trees.some(t => {
          const dx = t.x - x;
          const dy = t.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minTreeDistance;
        });
        if (tooCloseToTree) continue;
        
        const tooCloseInCluster = clusterTrees.some((t: Tree) => {
          const dx = t.x - x;
          const dy = t.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minTreeDistance;
        });
        if (tooCloseInCluster) continue;
        
        // Add tree with size variation
        const sizeVariation = 0.8 + this.rng.nextFloat(0, 0.4);
        clusterTrees.push({
          x,
          y,
          size: Math.round(treeRadius * sizeVariation * 10) / 10,
          clusterId: cluster.id
        });
      }
      
      cluster.treeCount = clusterTrees.length;
      trees.push(...clusterTrees);
    }
    
    return trees;
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
    
    // Mark trees
    for (const tree of trees) {
      const radius = Math.ceil(tree.size || treeRadius);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const x = tree.x + dx;
            const y = tree.y + dy;
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
          const x = point.x + dx;
          const y = point.y + dy;
          if (this.inBounds(x, y)) {
            grid[y][x] = 2; // Path (overrides trees)
          }
        }
      }
    }
    
    return grid;
  }
}
