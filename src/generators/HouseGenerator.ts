// House Generator using Binary Space Partitioning

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

export class HouseGenerator extends MapGenerator {
  generate(): MapData {
    const minRoomSize = this.getParam('minRoomSize', 4);
    const maxRoomSize = this.getParam('maxRoomSize', 10);
    const roomCount = this.getParam('roomCount', 8);

    // Create root node
    const root: BSPNode = {
      x: 1,
      y: 1,
      width: this.width - 2,
      height: this.height - 2
    };

    // Split recursively
    this.splitNode(root, minRoomSize, maxRoomSize);

    // Create rooms in leaf nodes
    const rooms: Room[] = [];
    this.createRooms(root, rooms, minRoomSize, maxRoomSize);

    // Limit to requested room count
    if (rooms.length > roomCount) {
      rooms.length = roomCount;
    }

    // Connect rooms
    const corridors = ConnectivityUtils.connectRooms(rooms);

    // Create grid
    const grid = this.createEmptyGrid(0);
    
    // Draw rooms
    for (const room of rooms) {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (this.inBounds(x, y)) {
            grid[y][x] = 1; // Floor
          }
        }
      }
    }

    // Draw corridors
    for (const corridor of corridors) {
      this.drawCorridor(grid, corridor.start, corridor.end);
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

  private splitNode(node: BSPNode, minSize: number, maxSize: number): void {
    // Stop if node is too small
    if (node.width < minSize * 2 || node.height < minSize * 2) {
      return;
    }

    // Randomly decide split direction
    const splitHorizontal = this.random.next() > 0.5;

    if (splitHorizontal) {
      if (node.height < minSize * 2) return;
      
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
      if (node.width < minSize * 2) return;
      
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

    // Recursively split children
    if (node.left) this.splitNode(node.left, minSize, maxSize);
    if (node.right) this.splitNode(node.right, minSize, maxSize);
  }

  private createRooms(node: BSPNode, rooms: Room[], minSize: number, maxSize: number): void {
    if (node.left || node.right) {
      // Not a leaf, recurse
      if (node.left) this.createRooms(node.left, rooms, minSize, maxSize);
      if (node.right) this.createRooms(node.right, rooms, minSize, maxSize);
    } else {
      // Leaf node - create room
      const roomWidth = this.random.nextInt(
        Math.min(minSize, node.width - 2),
        Math.min(maxSize, node.width - 2)
      );
      const roomHeight = this.random.nextInt(
        Math.min(minSize, node.height - 2),
        Math.min(maxSize, node.height - 2)
      );

      const roomX = node.x + this.random.nextInt(1, node.width - roomWidth - 1);
      const roomY = node.y + this.random.nextInt(1, node.height - roomHeight - 1);

      node.room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight
      };

      rooms.push(node.room);
    }
  }

  private drawCorridor(grid: number[][], start: [number, number], end: [number, number]): void {
    const [x1, y1] = start;
    const [x2, y2] = end;
    const corridorWidth = this.getParam('corridorWidth', 1);

    // L-shaped corridor
    if (this.random.next() > 0.5) {
      // Horizontal then vertical
      this.drawHorizontalLine(grid, x1, x2, y1, corridorWidth);
      this.drawVerticalLine(grid, y1, y2, x2, corridorWidth);
    } else {
      // Vertical then horizontal
      this.drawVerticalLine(grid, y1, y2, x1, corridorWidth);
      this.drawHorizontalLine(grid, x1, x2, y2, corridorWidth);
    }
  }

  private drawHorizontalLine(grid: number[][], x1: number, x2: number, y: number, width: number): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    
    for (let x = minX; x <= maxX; x++) {
      for (let dy = 0; dy < width; dy++) {
        if (this.inBounds(x, y + dy)) {
          grid[y + dy][x] = 1;
        }
      }
    }
  }

  private drawVerticalLine(grid: number[][], y1: number, y2: number, x: number, width: number): void {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    for (let y = minY; y <= maxY; y++) {
      for (let dx = 0; dx < width; dx++) {
        if (this.inBounds(x + dx, y)) {
          grid[y][x + dx] = 1;
        }
      }
    }
  }
}
