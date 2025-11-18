// Tests for utility functions

import { ConnectivityUtils } from '../utils/connectivity';
import { SeededRandom } from '../utils/random';
import { PerlinNoise } from '../utils/noise';
import { PoissonDiskSampling } from '../utils/poisson';
import { Room } from '../types/generator';

describe('ConnectivityUtils', () => {
  it('should build MST for rooms', () => {
    const rooms: Room[] = [
      { x: 10, y: 10, width: 5, height: 5 },
      { x: 30, y: 10, width: 5, height: 5 },
      { x: 10, y: 30, width: 5, height: 5 },
      { x: 30, y: 30, width: 5, height: 5 }
    ];

    const edges = ConnectivityUtils.buildMST(rooms);
    
    // Should have n-1 edges for n rooms
    expect(edges.length).toBe(rooms.length - 1);
  });

  it('should connect all rooms', () => {
    const rooms: Room[] = [
      { x: 5, y: 5, width: 5, height: 5 },
      { x: 20, y: 5, width: 5, height: 5 },
      { x: 5, y: 20, width: 5, height: 5 }
    ];

    const corridors = ConnectivityUtils.connectRooms(rooms);
    
    expect(corridors.length).toBe(rooms.length - 1);
    corridors.forEach(corridor => {
      expect(corridor.start).toBeDefined();
      expect(corridor.end).toBeDefined();
      expect(corridor.start.length).toBe(2);
      expect(corridor.end.length).toBe(2);
    });
  });

  it('should detect room overlap', () => {
    const room1: Room = { x: 10, y: 10, width: 5, height: 5 };
    const room2: Room = { x: 12, y: 12, width: 5, height: 5 };
    const room3: Room = { x: 20, y: 20, width: 5, height: 5 };

    expect(ConnectivityUtils.roomsOverlap(room1, room2)).toBe(true);
    expect(ConnectivityUtils.roomsOverlap(room1, room3)).toBe(false);
  });
});

describe('SeededRandom', () => {
  it('should generate consistent random numbers with same seed', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const values1 = Array(10).fill(0).map(() => rng1.next());
    const values2 = Array(10).fill(0).map(() => rng2.next());

    expect(values1).toEqual(values2);
  });

  it('should generate different numbers with different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    const value1 = rng1.next();
    const value2 = rng2.next();

    expect(value1).not.toBe(value2);
  });

  it('should generate integers in range', () => {
    const rng = new SeededRandom(12345);
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('PerlinNoise', () => {
  it('should generate consistent noise with same seed', () => {
    const noise1 = new PerlinNoise(12345);
    const noise2 = new PerlinNoise(12345);

    const value1 = noise1.noise(5.5, 3.2);
    const value2 = noise2.noise(5.5, 3.2);

    expect(value1).toBe(value2);
  });

  it('should generate smooth continuous values', () => {
    const noise = new PerlinNoise(12345);
    
    const val1 = noise.noise(0, 0);
    const val2 = noise.noise(0.1, 0);
    const val3 = noise.noise(0.2, 0);

    // Adjacent values should be relatively close
    expect(Math.abs(val2 - val1)).toBeLessThan(0.5);
    expect(Math.abs(val3 - val2)).toBeLessThan(0.5);
  });
});

describe('PoissonDiskSampling', () => {
  it('should generate points within bounds', () => {
    const width = 100;
    const height = 100;
    const poisson = new PoissonDiskSampling(width, height, 5, 12345);
    const points = poisson.generate();

    points.forEach(point => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThan(width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThan(height);
    });
  });

  it('should respect minimum distance between points', () => {
    const minDistance = 10;
    const poisson = new PoissonDiskSampling(100, 100, minDistance, 12345);
    const points = poisson.generate();

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        expect(distance).toBeGreaterThanOrEqual(minDistance * 0.95); // Allow small tolerance
      }
    }
  });
});
