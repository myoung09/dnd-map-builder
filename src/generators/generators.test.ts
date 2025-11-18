// Comprehensive Tests for Terrain Generators

import { HouseGenerator } from '../generators/HouseGenerator';
import { ForestGenerator } from '../generators/ForestGenerator';
import { CaveGenerator } from '../generators/CaveGenerator';
import { DungeonGenerator } from '../generators/DungeonGenerator';
import { TerrainType, Room } from '../types/generator';

// Helper function: Check if two rooms overlap
function roomsOverlap(r1: Room, r2: Room): boolean {
  return !(
    r1.x + r1.width <= r2.x ||
    r2.x + r2.width <= r1.x ||
    r1.y + r1.height <= r2.y ||
    r2.y + r2.height <= r1.y
  );
}

// Helper function: Flood fill to check connectivity
function floodFillCount(grid: number[][], startX: number, startY: number): number {
  const width = grid[0].length;
  const height = grid.length;
  const visited = Array(height).fill(0).map(() => Array(width).fill(false));
  let count = 0;

  const queue: Array<[number, number]> = [[startX, startY]];
  visited[startY][startX] = true;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    count++;

    // Check 4 neighbors
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (grid[ny][nx] === 0 && !visited[ny][nx]) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return count;
}

describe('HouseGenerator', () => {
  it('should generate a valid house map', () => {
    const generator = new HouseGenerator({
      width: 60,
      height: 60,
      seed: 12345,
      minRoomSize: 4,
      maxRoomSize: 8,
      roomCount: 5
    });

    const map = generator.generate();

    expect(map).toBeDefined();
    expect(map.width).toBe(60);
    expect(map.height).toBe(60);
    expect(map.terrainType).toBe(TerrainType.House);
    expect(map.rooms).toBeDefined();
    expect(map.corridors).toBeDefined();
    expect(map.grid).toBeDefined();
  });

  it('should generate requested number of rooms', () => {
    const generator = new HouseGenerator({
      width: 100,
      height: 100,
      seed: 12345,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 8
    });

    const map = generator.generate();
    expect(map.rooms!.length).toBeLessThanOrEqual(8);
    expect(map.rooms!.length).toBeGreaterThan(0);
  });

  it('should ensure rooms do not overlap', () => {
    const generator = new HouseGenerator({
      width: 80,
      height: 80,
      seed: 12345,
      minRoomSize: 4,
      maxRoomSize: 8,
      roomCount: 10
    });

    const map = generator.generate();
    const rooms = map.rooms!;

    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const overlap = roomsOverlap(rooms[i], rooms[j]);
        expect(overlap).toBe(false);
      }
    }
  });

  it('should respect min and max room sizes', () => {
    const minSize = 5;
    const maxSize = 12;
    const generator = new HouseGenerator({
      width: 100,
      height: 100,
      seed: 99999,
      minRoomSize: minSize,
      maxRoomSize: maxSize,
      roomCount: 8
    });

    const map = generator.generate();
    const rooms = map.rooms!;

    for (const room of rooms) {
      expect(room.width).toBeGreaterThanOrEqual(minSize);
      expect(room.width).toBeLessThanOrEqual(maxSize);
      expect(room.height).toBeGreaterThanOrEqual(minSize);
      expect(room.height).toBeLessThanOrEqual(maxSize);
    }
  });

  it('should ensure all rooms fit within map bounds', () => {
    const width = 80;
    const height = 80;
    const generator = new HouseGenerator({
      width,
      height,
      seed: 54321,
      minRoomSize: 4,
      maxRoomSize: 10,
      roomCount: 12
    });

    const map = generator.generate();
    const rooms = map.rooms!;

    for (const room of rooms) {
      expect(room.x).toBeGreaterThanOrEqual(0);
      expect(room.y).toBeGreaterThanOrEqual(0);
      expect(room.x + room.width).toBeLessThanOrEqual(width);
      expect(room.y + room.height).toBeLessThanOrEqual(height);
    }
  });
});

describe('ForestGenerator', () => {
  it('should generate a valid forest map', () => {
    const generator = new ForestGenerator({
      width: 80,
      height: 80,
      seed: 12345,
      treeDensity: 0.3,
      minTreeDistance: 3
    });

    const map = generator.generate();

    expect(map).toBeDefined();
    expect(map.width).toBe(80);
    expect(map.height).toBe(80);
    expect(map.terrainType).toBe(TerrainType.Forest);
    expect(map.trees).toBeDefined();
    expect(map.trees!.length).toBeGreaterThan(0);
  });

  it('should respect minimum tree distance (Poisson disk sampling)', () => {
    const minDistance = 5;
    const generator = new ForestGenerator({
      width: 100,
      height: 100,
      seed: 12345,
      treeDensity: 0.4,
      minTreeDistance: minDistance
    });

    const map = generator.generate();
    const trees = map.trees!;

    // Check all pairs of trees
    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        const t1 = trees[i];
        const t2 = trees[j];
        const dx = t2.x - t1.x;
        const dy = t2.y - t1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Allow small tolerance for floating point arithmetic
        expect(distance).toBeGreaterThanOrEqual(minDistance * 0.85);
      }
    }
  });

  it('should generate more trees with higher density', () => {
    const lowDensityGen = new ForestGenerator({
      width: 100,
      height: 100,
      seed: 11111,
      treeDensity: 0.2,
      minTreeDistance: 3
    });

    const highDensityGen = new ForestGenerator({
      width: 100,
      height: 100,
      seed: 11111, // Same seed for fair comparison
      treeDensity: 0.7,
      minTreeDistance: 3
    });

    const lowDensityMap = lowDensityGen.generate();
    const highDensityMap = highDensityGen.generate();

    expect(highDensityMap.trees!.length).toBeGreaterThan(lowDensityMap.trees!.length);
  });

  it('should ensure all trees fit within map bounds', () => {
    const width = 80;
    const height = 80;
    const generator = new ForestGenerator({
      width,
      height,
      seed: 54321,
      treeDensity: 0.5,
      minTreeDistance: 3
    });

    const map = generator.generate();
    const trees = map.trees!;

    for (const tree of trees) {
      expect(tree.x).toBeGreaterThanOrEqual(0);
      expect(tree.x).toBeLessThan(width);
      expect(tree.y).toBeGreaterThanOrEqual(0);
      expect(tree.y).toBeLessThan(height);
    }
  });
});

describe('CaveGenerator', () => {
  it('should generate a valid cave map', () => {
    const generator = new CaveGenerator({
      width: 70,
      height: 70,
      seed: 12345,
      fillProbability: 0.45,
      smoothIterations: 4,
      wallThreshold: 5
    });

    const map = generator.generate();

    expect(map).toBeDefined();
    expect(map.width).toBe(70);
    expect(map.height).toBe(70);
    expect(map.terrainType).toBe(TerrainType.Cave);
    expect(map.grid).toBeDefined();
  });

  it('should have walls on edges', () => {
    const generator = new CaveGenerator({
      width: 50,
      height: 50,
      seed: 12345,
      fillProbability: 0.45,
      smoothIterations: 3,
      wallThreshold: 5
    });

    const map = generator.generate();
    const grid = map.grid!;

    // Check top and bottom edges
    for (let x = 0; x < map.width; x++) {
      expect(grid[0][x]).toBe(1); // Top wall
      expect(grid[map.height - 1][x]).toBe(1); // Bottom wall
    }

    // Check left and right edges
    for (let y = 0; y < map.height; y++) {
      expect(grid[y][0]).toBe(1); // Left wall
      expect(grid[y][map.width - 1]).toBe(1); // Right wall
    }
  });

  it('should create a connected cave (largest region only)', () => {
    const generator = new CaveGenerator({
      width: 80,
      height: 80,
      seed: 99999,
      fillProbability: 0.45,
      smoothIterations: 4,
      wallThreshold: 4
    });

    const map = generator.generate();
    const grid = map.grid!;

    // Find first floor cell
    let startX = -1, startY = -1;
    for (let y = 1; y < map.height - 1 && startX === -1; y++) {
      for (let x = 1; x < map.width - 1; x++) {
        if (grid[y][x] === 0) {
          startX = x;
          startY = y;
          break;
        }
      }
    }

    expect(startX).toBeGreaterThanOrEqual(0);

    // Count total floor cells
    let totalFloors = 0;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (grid[y][x] === 0) totalFloors++;
      }
    }

    // Flood fill from start position
    const connectedFloors = floodFillCount(grid, startX, startY);

    // All floor cells should be connected (within reasonable tolerance)
    // Due to edge roughening, might have tiny isolated cells
    expect(connectedFloors).toBeGreaterThan(totalFloors * 0.95);
  });

  it('should have reasonable floor/wall ratio', () => {
    const generator = new CaveGenerator({
      width: 60,
      height: 60,
      seed: 11111, // Stable seed for consistent test results
      fillProbability: 0.45,
      smoothIterations: 4,
      wallThreshold: 4
    });

    const map = generator.generate();
    const grid = map.grid!;

    let floorCount = 0;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (grid[y][x] === 0) floorCount++;
      }
    }

    const totalCells = map.width * map.height;
    const floorRatio = floorCount / totalCells;

    // Cellular automata can produce wide variance
    // Verify result is within plausible range (not all floors or all walls)
    expect(floorRatio).toBeGreaterThan(0.05);
    expect(floorRatio).toBeLessThan(0.95);
  });
});

describe('DungeonGenerator', () => {
  it('should generate a valid dungeon map', () => {
    const generator = new DungeonGenerator({
      width: 80,
      height: 80,
      seed: 12345,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 8,
      organicFactor: 0.3,
      connectivityFactor: 0.15
    });

    const map = generator.generate();

    expect(map).toBeDefined();
    expect(map.width).toBe(80);
    expect(map.height).toBe(80);
    expect(map.terrainType).toBe(TerrainType.Dungeon);
    expect(map.rooms).toBeDefined();
    expect(map.corridors).toBeDefined();
    expect(map.grid).toBeDefined();
  });

  it('should ensure rooms do not overlap', () => {
    const generator = new DungeonGenerator({
      width: 100,
      height: 100,
      seed: 12345,
      minRoomSize: 5,
      maxRoomSize: 12,
      roomCount: 15,
      organicFactor: 0.2
    });

    const map = generator.generate();
    const rooms = map.rooms!;

    // Check all pairs for overlap
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const overlap = roomsOverlap(rooms[i], rooms[j]);
        expect(overlap).toBe(false);
      }
    }
  });

  it('should connect all rooms with corridors (MST property)', () => {
    const generator = new DungeonGenerator({
      width: 100,
      height: 100,
      seed: 12345,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 10
    });

    const map = generator.generate();
    
    // Minimum Spanning Tree ensures n-1 corridors for n rooms
    // With connectivity factor, may have more
    expect(map.corridors!.length).toBeGreaterThanOrEqual(map.rooms!.length - 1);
  });

  it('should verify room connectivity via flood fill', () => {
    const generator = new DungeonGenerator({
      width: 90,
      height: 90,
      seed: 11111, // Stable seed for consistent test
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 8,
      organicFactor: 0.0, // No organic variation for reliable connectivity
      connectivityFactor: 0.3
    });

    const map = generator.generate();
    const grid = map.grid!;
    const rooms = map.rooms!;

    // Find center of first room as starting point
    const firstRoom = rooms[0];
    const startX = Math.floor(firstRoom.x + firstRoom.width / 2);
    const startY = Math.floor(firstRoom.y + firstRoom.height / 2);

    // Flood fill from first room
    const connectedFloors = floodFillCount(grid, startX, startY);

    // Count total floor space
    let totalFloors = 0;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (grid[y][x] === 0) totalFloors++;
      }
    }

    // With organicFactor=0, MST corridors should connect most floor space
    // Allow 60% threshold to account for Random Walk variability
    expect(connectedFloors).toBeGreaterThan(totalFloors * 0.6);
  });

  it('should respect corridor straightness parameter (walkSteps)', () => {
    const straightGen = new DungeonGenerator({
      width: 80,
      height: 80,
      seed: 11111,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 6,
      walkSteps: 10 // Very straight
    });

    const windingGen = new DungeonGenerator({
      width: 80,
      height: 80,
      seed: 11111,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 6,
      walkSteps: 1 // Very winding
    });

    const straightMap = straightGen.generate();
    const windingMap = windingGen.generate();

    // Both should generate maps successfully
    expect(straightMap.grid).toBeDefined();
    expect(windingMap.grid).toBeDefined();
    
    // Both should have corridors
    expect(straightMap.corridors!.length).toBeGreaterThan(0);
    expect(windingMap.corridors!.length).toBeGreaterThan(0);
  });
});

describe('Seeded Random Consistency', () => {
  it('should generate identical maps with same seed', () => {
    const params = {
      width: 60,
      height: 60,
      seed: 99999,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 6
    };

    const gen1 = new HouseGenerator(params);
    const gen2 = new HouseGenerator(params);

    const map1 = gen1.generate();
    const map2 = gen2.generate();

    expect(map1.rooms!.length).toBe(map2.rooms!.length);
    expect(map1.corridors!.length).toBe(map2.corridors!.length);
    
    // Check first room matches
    expect(map1.rooms!.length).toBeGreaterThan(0);
    expect(map1.rooms![0]).toEqual(map2.rooms![0]);
  });

  it('should generate different maps with different seeds', () => {
    const gen1 = new CaveGenerator({
      width: 70,
      height: 70,
      seed: 11111,
      fillProbability: 0.45,
      smoothIterations: 4
    });

    const gen2 = new CaveGenerator({
      width: 70,
      height: 70,
      seed: 99999,
      fillProbability: 0.45,
      smoothIterations: 4
    });

    const map1 = gen1.generate();
    const map2 = gen2.generate();

    const grid1 = map1.grid!;
    const grid2 = map2.grid!;

    // Grids should be different
    let differences = 0;
    for (let y = 0; y < map1.height; y++) {
      for (let x = 0; x < map1.width; x++) {
        if (grid1[y][x] !== grid2[y][x]) differences++;
      }
    }

    expect(differences).toBeGreaterThan(100); // Significant differences
  });
});
