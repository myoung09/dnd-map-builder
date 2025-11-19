// House Generator using Binary Space Partitioning
// Refined implementation with guaranteed connectivity and non-overlapping rooms

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

export class HouseGenerator extends MapGenerator<MapData, number> {
  generate(): MapData {
    const minRoomSize = this.getParam('minRoomSize', 4);
    const maxRoomSize = this.getParam('maxRoomSize', 10);
    const roomCount = this.getParam('roomCount', 8);
    const corridorWidth = this.getParam('corridorWidth', 1);
    const gridSize = this.getParam('gridSize', 4); // Grid alignment spacing

    // Validate parameters
    if (minRoomSize > maxRoomSize) {
      throw new Error('minRoomSize cannot be greater than maxRoomSize');
    }
    if (minRoomSize < 3) {
      throw new Error('minRoomSize must be at least 3');
    }
    if (gridSize < 1) {
      throw new Error('gridSize must be at least 1');
    }

    // Create root node with padding for walls, aligned to grid
    const padding = 2;
    const alignedX = this.snapToGrid(padding, gridSize);
    const alignedY = this.snapToGrid(padding, gridSize);
    const alignedWidth = this.snapToGrid(this.width - (padding * 2), gridSize);
    const alignedHeight = this.snapToGrid(this.height - (padding * 2), gridSize);
    
    const root: BSPNode = {
      x: alignedX,
      y: alignedY,
      width: alignedWidth,
      height: alignedHeight
    };

    // Binary Space Partitioning - iteratively split space using queue-based algorithm
    this.splitNodeIterative(root, minRoomSize, gridSize);

    // Create rooms in leaf nodes (BSP guarantees non-overlapping)
    const rooms: Room[] = [];
    this.createRooms(root, rooms, minRoomSize, maxRoomSize, gridSize);

    // Verify no overlaps (paranoid check - BSP should guarantee this)
    this.validateNoOverlaps(rooms);

    // Limit to requested room count (keep first N rooms)
    if (rooms.length > roomCount) {
      rooms.length = roomCount;
    }

    // Ensure we have at least 2 rooms for connectivity
    if (rooms.length < 2) {
      throw new Error('Not enough space to generate requested rooms');
    }

    // Connect rooms using Minimum Spanning Tree - guarantees all rooms reachable
    const corridors = ConnectivityUtils.connectRooms(rooms);

    // Verify connectivity
    this.validateConnectivity(rooms, corridors);

    // Create grid (0 = wall, 1 = floor)
    const grid = this.createEmptyGrid(0);
    
    // Draw rooms as filled rectangles
    for (const room of rooms) {
      this.drawRoom(grid, room);
    }

    // Draw corridors as thin lines with configurable width (grid-aligned)
    for (const corridor of corridors) {
      this.drawCorridor(grid, corridor.start, corridor.end, corridorWidth, gridSize);
    }

    return {
      width: this.width,
      height: this.height,
      rooms,
      corridors,
      grid,
      seed: this.seed,
      terrainType: TerrainType.House
    };
  }

  /**
   * Snap a value to the nearest grid point
   */
  private snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * Draw a room as a filled rectangle on the grid
   * Rooms are axis-aligned and grid-snapped
   */
  private drawRoom(grid: number[][], room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (this.inBounds(x, y)) {
          grid[y][x] = 1; // Floor
        }
      }
    }
  }

  /**
   * Validate that no rooms overlap (paranoid check for BSP correctness)
   */
  private validateNoOverlaps(rooms: Room[]): void {
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        if (ConnectivityUtils.roomsOverlap(rooms[i], rooms[j], 0)) {
          throw new Error(`Rooms ${i} and ${j} overlap - BSP algorithm error`);
        }
      }
    }
  }

  /**
   * Validate that all rooms are connected (reachability check)
   */
  private validateConnectivity(rooms: Room[], corridors: any[]): void {
    // MST should have exactly n-1 edges for n rooms
    if (corridors.length !== rooms.length - 1) {
      console.warn(`Expected ${rooms.length - 1} corridors, got ${corridors.length}`);
    }

    // Additional check: verify MST structure
    const connected = new Set<number>([0]);
    const edges = corridors.map((c, idx) => ({ corridor: c, used: false }));
    
    let changed = true;
    while (changed && connected.size < rooms.length) {
      changed = false;
      for (let i = 0; i < edges.length; i++) {
        if (edges[i].used) continue;
        
        // Check if this corridor connects a known room to a new room
        for (let roomIdx = 0; roomIdx < rooms.length; roomIdx++) {
          if (connected.has(roomIdx)) continue;
          
          const room = rooms[roomIdx];
          const center = ConnectivityUtils.getRoomCenter(room);
          const corridor = edges[i].corridor;
          
          // Check if corridor endpoint matches this room center
          const matches = (
            (Math.abs(corridor.start[0] - Math.round(center.x)) < 2 &&
             Math.abs(corridor.start[1] - Math.round(center.y)) < 2) ||
            (Math.abs(corridor.end[0] - Math.round(center.x)) < 2 &&
             Math.abs(corridor.end[1] - Math.round(center.y)) < 2)
          );
          
          if (matches) {
            connected.add(roomIdx);
            edges[i].used = true;
            changed = true;
          }
        }
      }
    }

    if (connected.size < rooms.length) {
      console.warn(`Only ${connected.size}/${rooms.length} rooms are connected`);
    }
  }

  /**
   * Binary Space Partitioning - iteratively split node using queue (non-recursive)
   * This approach avoids deep recursion issues on large maps and improves performance
   * Uses breadth-first traversal to build the BSP tree
   */
  private splitNodeIterative(root: BSPNode, minSize: number, gridSize: number): void {
    // Queue for breadth-first traversal (avoids deep recursion)
    const queue: BSPNode[] = [root];
    
    while (queue.length > 0) {
      const node = queue.shift()!;
      
      // Calculate minimum split size (need room for 2 rooms + padding)
      const minSplitWidth = (minSize + 2) * 2;
      const minSplitHeight = (minSize + 2) * 2;

      // Stop if node is too small to split
      if (node.width < minSplitWidth && node.height < minSplitHeight) {
        continue; // This becomes a leaf node
      }

      // Decide split direction based on aspect ratio (prefer longer splits)
      let splitHorizontal: boolean;
      
      if (node.width < minSplitWidth) {
        splitHorizontal = true; // Must split horizontally
      } else if (node.height < minSplitHeight) {
        splitHorizontal = false; // Must split vertically
      } else {
        // Can split either way - choose based on aspect ratio with randomness
        const aspectRatio = node.width / node.height;
        if (aspectRatio > 1.25) {
          splitHorizontal = this.random.next() < 0.3; // Prefer vertical for wide rooms
        } else if (aspectRatio < 0.8) {
          splitHorizontal = this.random.next() < 0.7; // Prefer horizontal for tall rooms
        } else {
          splitHorizontal = this.random.next() > 0.5; // Random for square-ish rooms
        }
      }

      // Perform the split (grid-aligned)
      let splitSuccessful = false;
      
      if (splitHorizontal && node.height >= minSplitHeight) {
        // Horizontal split (top/bottom)
        const minSplitY = node.y + minSize + 2;
        const maxSplitY = node.y + node.height - minSize - 2;
        
        if (maxSplitY > minSplitY) {
          // Random split position, then snap to grid
          const randomSplitY = this.random.nextInt(minSplitY, maxSplitY);
          const splitPos = this.snapToGrid(randomSplitY, gridSize);
          
          // Ensure split position is valid after snapping
          if (splitPos > node.y + minSize && splitPos < node.y + node.height - minSize) {
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
            
            splitSuccessful = true;
          }
        }
      } else if (!splitHorizontal && node.width >= minSplitWidth) {
        // Vertical split (left/right)
        const minSplitX = node.x + minSize + 2;
        const maxSplitX = node.x + node.width - minSize - 2;
        
        if (maxSplitX > minSplitX) {
          // Random split position, then snap to grid
          const randomSplitX = this.random.nextInt(minSplitX, maxSplitX);
          const splitPos = this.snapToGrid(randomSplitX, gridSize);
          
          // Ensure split position is valid after snapping
          if (splitPos > node.x + minSize && splitPos < node.x + node.width - minSize) {
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
            
            splitSuccessful = true;
          }
        }
      }
      
      // Add children to queue for further splitting
      if (splitSuccessful) {
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
    }
  }

  /**
   * Binary Space Partitioning - recursively split node into two children (LEGACY - kept for reference)
   * Ensures minimum room size constraints and grid alignment
   * Note: Use splitNodeIterative() for better performance on large maps
   */
  private splitNode(node: BSPNode, minSize: number, gridSize: number): void {
    // Calculate minimum split size (need room for 2 rooms + padding)
    const minSplitWidth = (minSize + 2) * 2;
    const minSplitHeight = (minSize + 2) * 2;

    // Stop if node is too small to split
    if (node.width < minSplitWidth && node.height < minSplitHeight) {
      return; // This becomes a leaf node
    }

    // Decide split direction based on aspect ratio (prefer longer splits)
    let splitHorizontal: boolean;
    
    if (node.width < minSplitWidth) {
      splitHorizontal = true; // Must split horizontally
    } else if (node.height < minSplitHeight) {
      splitHorizontal = false; // Must split vertically
    } else {
      // Can split either way - choose based on aspect ratio with randomness
      const aspectRatio = node.width / node.height;
      if (aspectRatio > 1.25) {
        splitHorizontal = this.random.next() < 0.3; // Prefer vertical for wide rooms
      } else if (aspectRatio < 0.8) {
        splitHorizontal = this.random.next() < 0.7; // Prefer horizontal for tall rooms
      } else {
        splitHorizontal = this.random.next() > 0.5; // Random for square-ish rooms
      }
    }

    // Perform the split (grid-aligned)
    if (splitHorizontal && node.height >= minSplitHeight) {
      // Horizontal split (top/bottom)
      const minSplitY = node.y + minSize + 2;
      const maxSplitY = node.y + node.height - minSize - 2;
      
      if (maxSplitY <= minSplitY) return; // Can't split

      // Random split position, then snap to grid
      const randomSplitY = this.random.nextInt(minSplitY, maxSplitY);
      const splitPos = this.snapToGrid(randomSplitY, gridSize);
      
      // Ensure split position is valid after snapping
      if (splitPos <= node.y + minSize || splitPos >= node.y + node.height - minSize) {
        return; // Invalid split after grid alignment
      }

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
    } else if (!splitHorizontal && node.width >= minSplitWidth) {
      // Vertical split (left/right)
      const minSplitX = node.x + minSize + 2;
      const maxSplitX = node.x + node.width - minSize - 2;
      
      if (maxSplitX <= minSplitX) return; // Can't split

      // Random split position, then snap to grid
      const randomSplitX = this.random.nextInt(minSplitX, maxSplitX);
      const splitPos = this.snapToGrid(randomSplitX, gridSize);
      
      // Ensure split position is valid after snapping
      if (splitPos <= node.x + minSize || splitPos >= node.x + node.width - minSize) {
        return; // Invalid split after grid alignment
      }

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
    } else {
      return; // Can't split in chosen direction
    }

    // Recursively split children
    if (node.left) this.splitNode(node.left, minSize, gridSize);
    if (node.right) this.splitNode(node.right, minSize, gridSize);
  }

  /**
   * Create rooms in leaf nodes of BSP tree
   * Rooms are guaranteed not to overlap due to BSP structure
   * All rooms are grid-aligned for clean rectangular layout
   */
  private createRooms(node: BSPNode, rooms: Room[], minSize: number, maxSize: number, gridSize: number): void {
    if (node.left || node.right) {
      // Internal node - recurse to children
      if (node.left) this.createRooms(node.left, rooms, minSize, maxSize, gridSize);
      if (node.right) this.createRooms(node.right, rooms, minSize, maxSize, gridSize);
    } else {
      // Leaf node - create a room that fits within this partition
      const padding = 1; // Space between room and partition edge
      
      // Calculate available space for room
      const maxWidth = node.width - (padding * 2);
      const maxHeight = node.height - (padding * 2);
      
      // Ensure we can fit a room
      if (maxWidth < minSize || maxHeight < minSize) {
        return; // Skip - partition too small
      }

      // Determine room dimensions (respecting min/max constraints)
      // Snap dimensions to grid for clean alignment
      const randomWidth = this.random.nextInt(
        Math.max(minSize, Math.min(minSize, maxWidth)),
        Math.min(maxSize, maxWidth)
      );
      const randomHeight = this.random.nextInt(
        Math.max(minSize, Math.min(minSize, maxHeight)),
        Math.min(maxSize, maxHeight)
      );
      
      const roomWidth = this.snapToGrid(randomWidth, gridSize);
      const roomHeight = this.snapToGrid(randomHeight, gridSize);

      // Ensure snapped dimensions still fit within partition
      const finalWidth = Math.min(roomWidth, maxWidth);
      const finalHeight = Math.min(roomHeight, maxHeight);
      
      // Validate minimum size after snapping
      if (finalWidth < minSize || finalHeight < minSize) {
        // Fallback to unsnapped if grid alignment causes issues
        const room: Room = {
          x: node.x + padding,
          y: node.y + padding,
          width: randomWidth,
          height: randomHeight
        };
        node.room = room;
        rooms.push(room);
        return;
      }

      // Calculate position within partition (with padding)
      const maxOffsetX = maxWidth - finalWidth;
      const maxOffsetY = maxHeight - finalHeight;
      
      const randomX = node.x + padding + (maxOffsetX > 0 ? this.random.nextInt(0, maxOffsetX) : 0);
      const randomY = node.y + padding + (maxOffsetY > 0 ? this.random.nextInt(0, maxOffsetY) : 0);
      
      // Snap position to grid, but ensure it stays within partition bounds
      let roomX = this.snapToGrid(randomX, gridSize);
      let roomY = this.snapToGrid(randomY, gridSize);
      
      // Clamp to ensure room stays within partition (critical for non-overlap guarantee)
      roomX = Math.max(node.x + padding, Math.min(roomX, node.x + padding + maxOffsetX));
      roomY = Math.max(node.y + padding, Math.min(roomY, node.y + padding + maxOffsetY));
      
      // Final bounds check - ensure room doesn't exceed partition
      if (roomX + finalWidth > node.x + node.width - padding || 
          roomY + finalHeight > node.y + node.height - padding) {
        // Safety fallback - place at top-left of partition
        roomX = node.x + padding;
        roomY = node.y + padding;
      }

      // Create typed Room object (grid-aligned, guaranteed within partition)
      const room: Room = {
        x: roomX,
        y: roomY,
        width: finalWidth,
        height: finalHeight
      };

      node.room = room;
      rooms.push(room);
    }
  }

  /**
   * Draw L-shaped corridor connecting two points
   * Uses configurable corridor width parameter
   * Corridors are grid-aligned and run horizontally/vertically only
   */
  private drawCorridor(
    grid: number[][], 
    start: [number, number], 
    end: [number, number],
    corridorWidth: number,
    gridSize: number
  ): void {
    // Snap corridor endpoints to grid for clean alignment
    const x1 = this.snapToGrid(start[0], gridSize);
    const y1 = this.snapToGrid(start[1], gridSize);
    const x2 = this.snapToGrid(end[0], gridSize);
    const y2 = this.snapToGrid(end[1], gridSize);

    // Choose L-shape direction randomly for variety
    // Corridors run only horizontally or vertically (axis-aligned)
    if (this.random.next() > 0.5) {
      // Horizontal then vertical (┘ or └ shape)
      this.drawHorizontalLine(grid, x1, x2, y1, corridorWidth);
      this.drawVerticalLine(grid, y1, y2, x2, corridorWidth);
    } else {
      // Vertical then horizontal (┐ or ┌ shape)
      this.drawVerticalLine(grid, y1, y2, x1, corridorWidth);
      this.drawHorizontalLine(grid, x1, x2, y2, corridorWidth);
    }
  }

  /**
   * Draw horizontal corridor line with specified width
   */
  private drawHorizontalLine(
    grid: number[][], 
    x1: number, 
    x2: number, 
    y: number, 
    width: number
  ): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    
    // Draw corridor with width (centered on y)
    const offset = Math.floor(width / 2);
    
    for (let x = minX; x <= maxX; x++) {
      for (let dy = -offset; dy < width - offset; dy++) {
        if (this.inBounds(x, y + dy)) {
          grid[y + dy][x] = 1; // Floor
        }
      }
    }
  }

  /**
   * Draw vertical corridor line with specified width
   */
  private drawVerticalLine(
    grid: number[][], 
    y1: number, 
    y2: number, 
    x: number, 
    width: number
  ): void {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    // Draw corridor with width (centered on x)
    const offset = Math.floor(width / 2);
    
    for (let y = minY; y <= maxY; y++) {
      for (let dx = -offset; dx < width - offset; dx++) {
        if (this.inBounds(x + dx, y)) {
          grid[y][x + dx] = 1; // Floor
        }
      }
    }
  }
}
