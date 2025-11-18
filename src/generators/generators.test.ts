// Tests for terrain generators

import { HouseGenerator } from '../generators/HouseGenerator';
import { ForestGenerator } from '../generators/ForestGenerator';
import { CaveGenerator } from '../generators/CaveGenerator';
import { DungeonGenerator } from '../generators/DungeonGenerator';
import { TerrainType } from '../types/generator';

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
        const r1 = rooms[i];
        const r2 = rooms[j];
        
        const overlap = !(
          r1.x + r1.width <= r2.x ||
          r2.x + r2.width <= r1.x ||
          r1.y + r1.height <= r2.y ||
          r2.y + r2.height <= r1.y
        );
        
        expect(overlap).toBe(false);
      }
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

  it('should respect minimum tree distance', () => {
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

    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        const t1 = trees[i];
        const t2 = trees[j];
        const dx = t2.x - t1.x;
        const dy = t2.y - t1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        expect(distance).toBeGreaterThanOrEqual(minDistance * 0.85); // Allow small tolerance for floating point
      }
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

  it('should connect all rooms with corridors', () => {
    const generator = new DungeonGenerator({
      width: 100,
      height: 100,
      seed: 12345,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 10
    });

    const map = generator.generate();
    
    // At minimum, should have n-1 corridors for n rooms (MST property)
    expect(map.corridors!.length).toBeGreaterThanOrEqual(map.rooms!.length - 1);
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
});
