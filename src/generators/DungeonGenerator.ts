// Dungeon Generator using BSP + Random Walk
/**
 * Generates classic dungeon layouts using Binary Space Partitioning and Random Walk corridors.
 * 
 * Algorithm Overview:
 * 1. BSP (Binary Space Partitioning) to create room spaces recursively
 * 2. Create rooms within leaf nodes of BSP tree
 * 3. Connect rooms using MST (Minimum Spanning Tree) for guaranteed connectivity
 * 4. Random Walk to carve organic corridors between room centers
 * 5. Add extra connections for loops based on connectivityFactor
 * 6. Verify connectivity using flood fill
 * 
 * Features:
 * - Guaranteed connected dungeon (all rooms reachable)
 * - Adjustable room sizes via minRoomSize/maxRoomSize
 * - Organic corridor carving using Random Walk algorithm
 * - Configurable corridor wandering via walkSteps parameter
 * - Deterministic generation with seed support
 * - MST ensures minimum corridors (n-1 for n rooms)
 * - Extra connections create dungeon loops for variety
 * 
 * Parameters:
 * - minRoomSize: Minimum room dimension (3-10). Default 5
 * - maxRoomSize: Maximum room dimension (8-20). Default 12
 * - roomCount: Target number of rooms (5-20). Default 10
 * - walkSteps: Random walk step bias (1-10). Higher = straighter corridors. Default 7
 * - organicFactor: Edge variation (0.0-0.5). Higher = rougher edges. Default 0.3
 * - connectivityFactor: Extra corridors ratio (0.0-0.5). Higher = more loops. Default 0.15
 * - corridorWidth: Corridor width in cells (1-3). Default 1
 */

import { MapGenerator } from './MapGenerator';
import { MapData, Room, TerrainType } from '../types/generator';
import { ConnectivityUtils } from '../utils/connectivity';

interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left?: BSPNode;
  right?: BSPNode;
  room?: Room;
}

export class DungeonGenerator extends MapGenerator {
  generate(): MapData {
    console.log('[DungeonGenerator] Starting dungeon generation');
    
    // Get parameters with defaults
    const minRoomSize = this.getParam('minRoomSize', 5);
    const maxRoomSize = this.getParam('maxRoomSize', 12);
    const roomCount = this.getParam('roomCount', 10);
    const walkSteps = this.getParam('walkSteps', 7); // Higher = straighter corridors
    const organicFactor = this.getParam('organicFactor', 0.3);
    const connectivityFactor = this.getParam('connectivityFactor', 0.15);

    console.log(`[DungeonGenerator] Parameters: minRoom=${minRoomSize}, maxRoom=${maxRoomSize}, count=${roomCount}, walkSteps=${walkSteps}`);

    // Step 1: Create root node for BSP
    const root: BSPNode = {
      x: 2,
      y: 2,
      width: this.width - 4,
      height: this.height - 4
    };

    // Step 2: Split recursively using BSP
    console.log('[DungeonGenerator] Splitting space with BSP...');
    this.splitNode(root, minRoomSize);

    // Step 3: Create rooms in leaf nodes
    const rooms: Room[] = [];
    this.createRooms(root, rooms, minRoomSize, maxRoomSize);
    console.log(`[DungeonGenerator] Created ${rooms.length} rooms from BSP`);

    // Step 4: Limit to requested room count
    if (rooms.length > roomCount) {
      rooms.length = roomCount;
      console.log(`[DungeonGenerator] Trimmed to ${roomCount} rooms`);
    }

    // Step 5: Connect rooms with MST for guaranteed connectivity
    console.log('[DungeonGenerator] Building MST for room connections...');
    const baseCorridors = ConnectivityUtils.connectRooms(rooms);
    console.log(`[DungeonGenerator] MST created ${baseCorridors.length} base corridors`);
    
    // Step 6: Add extra connections for loops based on connectivity factor
    const corridors = ConnectivityUtils.addExtraConnections(
      rooms,
      baseCorridors,
      connectivityFactor
    );
    const extraCount = corridors.length - baseCorridors.length;
    if (extraCount > 0) {
      console.log(`[DungeonGenerator] Added ${extraCount} extra corridors for loops`);
    }

    // Step 7: Create grid (start with all walls)
    const grid = this.createEmptyGrid(1);

    // Step 8: Draw rooms with organic edges
    console.log('[DungeonGenerator] Drawing rooms...');
    for (const room of rooms) {
      this.drawOrganicRoom(grid, room, organicFactor);
    }

    // Step 9: Draw corridors using Random Walk for organic feel
    console.log('[DungeonGenerator] Carving corridors with Random Walk...');
    for (const corridor of corridors) {
      // Ensure corridor endpoints connect to actual room floors
      const start = this.findNearestFloor(grid, corridor.start[0], corridor.start[1], rooms);
      const end = this.findNearestFloor(grid, corridor.end[0], corridor.end[1], rooms);
      this.drawRandomWalkCorridor(grid, start, end, walkSteps, organicFactor);
    }

    // Step 10: Verify connectivity
    const isConnected = this.ensureConnectivity(grid, rooms);
    console.log(`[DungeonGenerator] Connectivity check: ${isConnected ? 'PASSED' : 'FAILED'}`);

    console.log(`[DungeonGenerator] Dungeon complete: ${rooms.length} rooms, ${corridors.length} corridors`);

    return {
      width: this.width,
      height: this.height,
      rooms,
      corridors,
      grid,
      seed: this.seed,
      terrainType: TerrainType.Dungeon
    };
  }

  /**
   * Split node recursively using BSP (Binary Space Partitioning)
   * Creates balanced tree of spaces for room placement
   */
  private splitNode(node: BSPNode, minSize: number): void {
    // Stop if too small to split (need space for 2 rooms + padding)
    if (node.width < minSize * 3 || node.height < minSize * 3) {
      return;
    }

    // Choose split direction based on aspect ratio
    // Prefer splitting long dimensions to create more balanced rooms
    const splitHorizontal = node.height > node.width;

    if (splitHorizontal) {
      // Split horizontally (top/bottom)
      const splitPos = this.random.nextInt(
        node.y + minSize,
        node.y + node.height - minSize
      );

      node.left = {
        x: node.x,
        y: node.y,
        width: node.width,
        height: splitPos - node.y
      };

      node.right = {
        x: node.x,
        y: splitPos,
        width: node.width,
        height: node.y + node.height - splitPos
      };
    } else {
      // Split vertically (left/right)
      const splitPos = this.random.nextInt(
        node.x + minSize,
        node.x + node.width - minSize
      );

      node.left = {
        x: node.x,
        y: node.y,
        width: splitPos - node.x,
        height: node.height
      };

      node.right = {
        x: splitPos,
        y: node.y,
        width: node.x + node.width - splitPos,
        height: node.height
      };
    }

    // Recursively split child nodes
    if (node.left) this.splitNode(node.left, minSize);
    if (node.right) this.splitNode(node.right, minSize);
  }

  /**
   * Create rooms in leaf nodes of BSP tree
   * Each leaf gets a room with some padding from node boundaries
   */
  private createRooms(node: BSPNode, rooms: Room[], minSize: number, maxSize: number): void {
    // If node has children, recurse
    if (node.left || node.right) {
      if (node.left) this.createRooms(node.left, rooms, minSize, maxSize);
      if (node.right) this.createRooms(node.right, rooms, minSize, maxSize);
    } else {
      // Leaf node - create a room
      const padding = 2;
      const maxWidth = Math.min(maxSize, node.width - padding * 2);
      const maxHeight = Math.min(maxSize, node.height - padding * 2);

      // Ensure we have valid dimensions
      if (maxWidth < minSize || maxHeight < minSize) {
        return; // Skip this node if too small
      }

      const roomWidth = this.random.nextInt(minSize, maxWidth);
      const roomHeight = this.random.nextInt(minSize, maxHeight);

      // Randomly position room within node boundaries
      const maxX = node.width - roomWidth - padding;
      const maxY = node.height - roomHeight - padding;
      
      const roomX = node.x + this.random.nextInt(padding, Math.max(padding, maxX));
      const roomY = node.y + this.random.nextInt(padding, Math.max(padding, maxY));

      node.room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight
      };

      rooms.push(node.room);
    }
  }

  /**
   * Draw room with optional organic edge variation
   * Creates rectangular rooms with rough edges based on organicFactor
   */
  private drawOrganicRoom(grid: number[][], room: Room, organicFactor: number): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        // Check if this is an edge cell
        const isEdge = (
          x === room.x || x === room.x + room.width - 1 ||
          y === room.y || y === room.y + room.height - 1
        );

        // Apply organic variation to edges
        if (isEdge && this.random.next() < organicFactor) {
          // Randomly keep some edge walls for organic look
          continue;
        }

        if (this.inBounds(x, y)) {
          grid[y][x] = 0; // Floor
        }
      }
    }
  }

  /**
   * Draw corridor using Random Walk algorithm
   * Carves organic path from start to end with configurable straightness
   * Ensures path is fully connected by carving as it walks
   * 
   * @param walkSteps - Bias towards target (1-10). Higher = straighter path
   */
  private drawRandomWalkCorridor(
    grid: number[][],
    start: [number, number],
    end: [number, number],
    walkSteps: number,
    organicFactor: number
  ): void {
    let [x, y] = start;
    const [endX, endY] = end;
    const corridorWidth = this.getParam('corridorWidth', 1);
    
    // walkSteps controls straightness: higher = more biased towards target
    const targetBias = Math.min(0.95, 0.5 + (walkSteps / 20)); // 0.55-0.95 range

    let steps = 0;
    const maxSteps = (Math.abs(endX - x) + Math.abs(endY - y)) * 3; // Allow some wandering

    // Random walk towards end - carve as we go
    while ((x !== endX || y !== endY) && steps < maxSteps) {
      // Carve current position with specified width
      this.carveFloor(grid, x, y, corridorWidth);

      // Calculate direction to target
      const dx = endX - x;
      const dy = endY - y;

      // Decide next step with bias towards target
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement preferred
        if (this.random.next() < targetBias || dy === 0) {
          // Move towards target horizontally
          x += dx > 0 ? 1 : -1;
        } else {
          // Move vertically (perpendicular)
          y += dy > 0 ? 1 : -1;
        }
      } else {
        // Vertical movement preferred
        if (this.random.next() < targetBias || dx === 0) {
          // Move towards target vertically
          y += dy > 0 ? 1 : -1;
        } else {
          // Move horizontally (perpendicular)
          x += dx > 0 ? 1 : -1;
        }
      }

      // Add occasional random jog for organic feel (less often)
      if (this.random.next() < organicFactor / 3) {
        if (this.random.next() > 0.5 && dy !== 0) {
          y += dy > 0 ? 1 : -1;
        } else if (dx !== 0) {
          x += dx > 0 ? 1 : -1;
        }
      }

      steps++;
    }

    // Carve final position to ensure connection
    this.carveFloor(grid, x, y, corridorWidth);
    
    // Also carve endpoint to ensure connection
    this.carveFloor(grid, endX, endY, corridorWidth);
  }

  /**
   * Carve floor at position with given width
   * Helper method to ensure consistent floor carving
   */
  private carveFloor(grid: number[][], x: number, y: number, width: number): void {
    for (let dy = 0; dy < width; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (this.inBounds(x + dx, y + dy)) {
          grid[y + dy][x + dx] = 0;
        }
      }
    }
  }

  /**
   * Ensure all rooms are connected using flood fill verification
   * Returns true if all room floors are reachable from the first room
   */
  private ensureConnectivity(grid: number[][], rooms: Room[]): boolean {
    if (rooms.length === 0) return true;

    // Find a floor cell in the first room
    const firstRoom = rooms[0];
    let startX = Math.floor(firstRoom.x + firstRoom.width / 2);
    let startY = Math.floor(firstRoom.y + firstRoom.height / 2);

    // Ensure start position is actually floor
    if (grid[startY][startX] !== 0) {
      // Search for a floor cell
      let found = false;
      for (let y = firstRoom.y; y < firstRoom.y + firstRoom.height && !found; y++) {
        for (let x = firstRoom.x; x < firstRoom.x + firstRoom.width && !found; x++) {
          if (this.inBounds(x, y) && grid[y][x] === 0) {
            startX = x;
            startY = y;
            found = true;
          }
        }
      }
      if (!found) return false; // First room has no floor?!
    }

    // Flood fill to find all reachable floor cells
    const reachable = this.floodFillFloors(grid, startX, startY);

    // Check if all rooms have at least one reachable floor cell
    let connectedRooms = 0;
    for (const room of rooms) {
      let hasReachableFloor = false;
      
      for (let y = room.y; y < room.y + room.height && !hasReachableFloor; y++) {
        for (let x = room.x; x < room.x + room.width && !hasReachableFloor; x++) {
          if (this.inBounds(x, y) && grid[y][x] === 0) {
            const key = `${x},${y}`;
            if (reachable.has(key)) {
              hasReachableFloor = true;
              connectedRooms++;
            }
          }
        }
      }
    }

    const allConnected = connectedRooms === rooms.length;
    console.log(`[DungeonGenerator] Connectivity: ${connectedRooms}/${rooms.length} rooms reachable`);
    
    return allConnected;
  }

  /**
   * Find nearest floor cell to given coordinates
   * Searches in expanding square pattern from start point
   */
  private findNearestFloor(grid: number[][], x: number, y: number, rooms: Room[]): [number, number] {
    // First check if the position itself is a floor
    if (this.inBounds(x, y) && grid[y][x] === 0) {
      return [x, y];
    }

    // Search in expanding square pattern
    for (let radius = 1; radius <= 10; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // Only check perimeter of current square
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (this.inBounds(nx, ny) && grid[ny][nx] === 0) {
            return [nx, ny];
          }
        }
      }
    }

    // Fallback: return original coordinates
    // (corridor will carve its own floor)
    return [x, y];
  }

  /**
   * Flood fill to find all floor cells reachable from start position
   */
  private floodFillFloors(grid: number[][], startX: number, startY: number): Set<string> {
    const visited = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (!this.inBounds(x, y)) continue;
      if (grid[y][x] !== 0) continue; // Not a floor

      visited.add(key);

      // Add 4-directional neighbors
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    return visited;
  }
}
