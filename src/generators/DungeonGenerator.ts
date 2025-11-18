// Dungeon Generator using BSP + Random Walk

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
    const minRoomSize = this.getParam('minRoomSize', 5);
    const maxRoomSize = this.getParam('maxRoomSize', 12);
    const roomCount = this.getParam('roomCount', 10);
    const organicFactor = this.getParam('organicFactor', 0.3);
    const connectivityFactor = this.getParam('connectivityFactor', 0.15);

    // Create root node for BSP
    const root: BSPNode = {
      x: 2,
      y: 2,
      width: this.width - 4,
      height: this.height - 4
    };

    // Split recursively
    this.splitNode(root, minRoomSize);

    // Create rooms in leaf nodes
    const rooms: Room[] = [];
    this.createRooms(root, rooms, minRoomSize, maxRoomSize);

    // Limit to requested room count
    if (rooms.length > roomCount) {
      rooms.length = roomCount;
    }

    // Connect rooms with MST
    const baseCorridors = ConnectivityUtils.connectRooms(rooms);
    
    // Add extra connections for loops
    const corridors = ConnectivityUtils.addExtraConnections(
      rooms,
      baseCorridors,
      connectivityFactor
    );

    // Create grid
    const grid = this.createEmptyGrid(1); // Start with all walls

    // Draw rooms with organic edges
    for (const room of rooms) {
      this.drawOrganicRoom(grid, room, organicFactor);
    }

    // Draw corridors with random walk for organic feel
    for (const corridor of corridors) {
      this.drawOrganicCorridor(grid, corridor.start, corridor.end, organicFactor);
    }

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

  private splitNode(node: BSPNode, minSize: number): void {
    // Stop if too small
    if (node.width < minSize * 3 || node.height < minSize * 3) {
      return;
    }

    // Choose split direction based on aspect ratio
    const splitHorizontal = node.height > node.width;

    if (splitHorizontal) {
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

    if (node.left) this.splitNode(node.left, minSize);
    if (node.right) this.splitNode(node.right, minSize);
  }

  private createRooms(node: BSPNode, rooms: Room[], minSize: number, maxSize: number): void {
    if (node.left || node.right) {
      if (node.left) this.createRooms(node.left, rooms, minSize, maxSize);
      if (node.right) this.createRooms(node.right, rooms, minSize, maxSize);
    } else {
      // Create room with some padding
      const padding = 2;
      const maxWidth = Math.min(maxSize, node.width - padding * 2);
      const maxHeight = Math.min(maxSize, node.height - padding * 2);

      const roomWidth = this.random.nextInt(minSize, maxWidth);
      const roomHeight = this.random.nextInt(minSize, maxHeight);

      const roomX = node.x + this.random.nextInt(padding, node.width - roomWidth - padding);
      const roomY = node.y + this.random.nextInt(padding, node.height - roomHeight - padding);

      node.room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight
      };

      rooms.push(node.room);
    }
  }

  private drawOrganicRoom(grid: number[][], room: Room, organicFactor: number): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        // Add organic variation to edges
        const isEdge = (
          x === room.x || x === room.x + room.width - 1 ||
          y === room.y || y === room.y + room.height - 1
        );

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

  private drawOrganicCorridor(
    grid: number[][],
    start: [number, number],
    end: [number, number],
    organicFactor: number
  ): void {
    let [x, y] = start;
    const [endX, endY] = end;
    const corridorWidth = this.getParam('corridorWidth', 1);

    // Random walk towards end
    while (x !== endX || y !== endY) {
      // Carve current position
      for (let dy = 0; dy < corridorWidth; dy++) {
        for (let dx = 0; dx < corridorWidth; dx++) {
          if (this.inBounds(x + dx, y + dy)) {
            grid[y + dy][x + dx] = 0;
          }
        }
      }

      // Decide next step
      const dx = endX - x;
      const dy = endY - y;

      // Bias towards end but allow some wandering
      if (Math.abs(dx) > Math.abs(dy)) {
        if (this.random.next() < 0.7) {
          x += dx > 0 ? 1 : -1;
        } else if (dy !== 0) {
          y += dy > 0 ? 1 : -1;
        }
      } else {
        if (this.random.next() < 0.7) {
          y += dy > 0 ? 1 : -1;
        } else if (dx !== 0) {
          x += dx > 0 ? 1 : -1;
        }
      }

      // Add occasional random jog for organic feel
      if (this.random.next() < organicFactor) {
        if (this.random.next() > 0.5 && dy !== 0) {
          y += dy > 0 ? 1 : -1;
        } else if (dx !== 0) {
          x += dx > 0 ? 1 : -1;
        }
      }
    }

    // Carve final position
    for (let dy = 0; dy < corridorWidth; dy++) {
      for (let dx = 0; dx < corridorWidth; dx++) {
        if (this.inBounds(x + dx, y + dy)) {
          grid[y + dy][x + dx] = 0;
        }
      }
    }
  }
}
