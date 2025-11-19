// Unit tests for ForestGenerator
// Verifies path generation, tree placement, and cluster distribution

import { ForestGenerator } from './ForestGenerator';
import { TerrainType } from '../types/generator';

describe('ForestGenerator', () => {
  describe('Basic Generation', () => {
    test('generates a valid forest map', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 12345,
        clusterSize: 8,
        clusterRadius: 8,
        clearingSize: 6,
        treeRadius: 2.5,
        minTreeDistance: 2
      });

      const map = generator.generate();

      expect(map).toBeDefined();
      expect(map.width).toBe(100);
      expect(map.height).toBe(100);
      expect(map.terrainType).toBe(TerrainType.Forest);
      expect(map.seed).toBe(12345);
    });

    test('generates trees', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 54321,
        numClusters: 5,
        clusterSize: 10
      });

      const map = generator.generate();

      expect(map.trees).toBeDefined();
      expect(map.trees!.length).toBeGreaterThan(0);
      
      // Verify tree properties
      for (const tree of map.trees!) {
        expect(tree.x).toBeGreaterThanOrEqual(0);
        expect(tree.x).toBeLessThan(100);
        expect(tree.y).toBeGreaterThanOrEqual(0);
        expect(tree.y).toBeLessThan(100);
        expect(tree.size).toBeGreaterThan(0);
      }
    });

    test('generates main path from entrance to exit', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 99999
      });

      const map = generator.generate();

      expect(map.paths).toBeDefined();
      expect(map.paths!.length).toBeGreaterThan(0);
      expect(map.entrance).toBeDefined();
      expect(map.exit).toBeDefined();
    });
  });

  describe('Path and Tree Separation', () => {
    test('paths never intersect tree clusters', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 77777,
        numClusters: 10,
        clusterSize: 12,
        clusterRadius: 8,
        clearingSize: 6,
        treeRadius: 2.5
      });

      const map = generator.generate();

      expect(map.trees).toBeDefined();
      expect(map.paths).toBeDefined();
      
      const pathBuffer = 3; // Minimum distance from path to tree
      
      // Check each tree against all path points
      for (const tree of map.trees!) {
        for (const pathPoint of map.paths!) {
          const dx = tree.x - pathPoint.x;
          const dy = tree.y - pathPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Trees should not be within pathBuffer of any path point
          expect(distance).toBeGreaterThanOrEqual(pathBuffer);
        }
      }
    });

    test('paths never intersect branch paths', () => {
      const generator = new ForestGenerator({
        width: 120,
        height: 120,
        seed: 33333,
        branchPathDensity: 0.8 // High density
      });

      const map = generator.generate();

      expect(map.trees).toBeDefined();
      expect(map.branchPaths).toBeDefined();
      
      if (map.branchPaths && map.branchPaths.length > 0) {
        const pathBuffer = 3;
        
        // Combine all path points
        const allPathPoints = [...map.paths!];
        for (const branch of map.branchPaths) {
          allPathPoints.push(...branch);
        }
        
        // Check each tree against all path points
        for (const tree of map.trees!) {
          for (const pathPoint of allPathPoints) {
            const dx = tree.x - pathPoint.x;
            const dy = tree.y - pathPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            expect(distance).toBeGreaterThanOrEqual(pathBuffer);
          }
        }
      }
    });

    test('trees maintain minimum distance from each other', () => {
      const generator = new ForestGenerator({
        width: 80,
        height: 80,
        seed: 11111,
        numClusters: 5,
        clusterSize: 15,
        minTreeDistance: 3
      });

      const map = generator.generate();

      expect(map.trees).toBeDefined();
      const trees = map.trees!;
      const minDistance = 3;
      
      // Check every pair of trees
      for (let i = 0; i < trees.length; i++) {
        for (let j = i + 1; j < trees.length; j++) {
          const tree1 = trees[i];
          const tree2 = trees[j];
          
          const dx = tree1.x - tree2.x;
          const dy = tree1.y - tree2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          expect(distance).toBeGreaterThanOrEqual(minDistance);
        }
      }
    });
  });

  describe('Entrance and Exit Placement', () => {
    test('entrance is on left edge', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 22222
      });

      const map = generator.generate();

      expect(map.entrance).toBeDefined();
      expect(map.entrance!.x).toBe(0);
      expect(map.entrance!.y).toBeGreaterThanOrEqual(0);
      expect(map.entrance!.y).toBeLessThan(100);
    });

    test('exit is on right edge', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 44444
      });

      const map = generator.generate();

      expect(map.exit).toBeDefined();
      expect(map.exit!.x).toBe(99); // width - 1
      expect(map.exit!.y).toBeGreaterThanOrEqual(0);
      expect(map.exit!.y).toBeLessThan(100);
    });

    test('entrance and exit are on opposite edges', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 55555
      });

      const map = generator.generate();

      expect(map.entrance).toBeDefined();
      expect(map.exit).toBeDefined();
      
      // Entrance should be on left, exit on right
      expect(Math.abs(map.exit!.x - map.entrance!.x)).toBeGreaterThan(90);
    });
  });

  describe('Branch Path Density', () => {
    test('zero density creates no branch paths', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 66666,
        branchPathDensity: 0
      });

      const map = generator.generate();

      expect(map.branchPaths).toBeDefined();
      expect(map.branchPaths!.length).toBe(0);
    });

    test('high density creates many branch paths', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 88888,
        branchPathDensity: 1.0
      });

      const map = generator.generate();

      expect(map.branchPaths).toBeDefined();
      expect(map.branchPaths!.length).toBeGreaterThanOrEqual(5);
    });

    test('moderate density creates some branch paths', () => {
      const generator = new ForestGenerator({
        width: 100,
        height: 100,
        seed: 99990,
        branchPathDensity: 0.5
      });

      const map = generator.generate();

      expect(map.branchPaths).toBeDefined();
      expect(map.branchPaths!.length).toBeGreaterThanOrEqual(1);
      expect(map.branchPaths!.length).toBeLessThanOrEqual(7);
    });
  });

  describe('Grid Representation', () => {
    test('grid correctly represents trees and paths', () => {
      const generator = new ForestGenerator({
        width: 50,
        height: 50,
        seed: 12121,
        numClusters: 3,
        clusterSize: 5
      });

      const map = generator.generate();

      expect(map.grid).toBeDefined();
      expect(map.grid!.length).toBe(50);
      expect(map.grid![0].length).toBe(50);
      
      // Count grid cell types
      let clearingCount = 0;
      let treeCount = 0;
      let pathCount = 0;
      
      for (const row of map.grid!) {
        for (const cell of row) {
          if (cell === 0) clearingCount++;
          else if (cell === 1) treeCount++;
          else if (cell === 2) pathCount++;
        }
      }
      
      // Should have all three types
      expect(clearingCount).toBeGreaterThan(0);
      expect(treeCount).toBeGreaterThan(0);
      expect(pathCount).toBeGreaterThan(0);
    });
  });

  describe('Deterministic Generation', () => {
    test('identical seeds produce identical maps', () => {
      const params = {
        width: 80,
        height: 80,
        seed: 31415,
        numClusters: 5,
        clusterSize: 10,
        branchPathDensity: 0.5
      };

      const generator1 = new ForestGenerator(params);
      const generator2 = new ForestGenerator(params);

      const map1 = generator1.generate();
      const map2 = generator2.generate();

      // Same number of trees
      expect(map1.trees!.length).toBe(map2.trees!.length);
      
      // Trees in same positions
      for (let i = 0; i < map1.trees!.length; i++) {
        expect(map1.trees![i].x).toBe(map2.trees![i].x);
        expect(map1.trees![i].y).toBe(map2.trees![i].y);
        expect(map1.trees![i].size).toBe(map2.trees![i].size);
      }
      
      // Same path length
      expect(map1.paths!.length).toBe(map2.paths!.length);
      
      // Same entrance and exit
      expect(map1.entrance).toEqual(map2.entrance);
      expect(map1.exit).toEqual(map2.exit);
    });

    test('different seeds produce different maps', () => {
      const generator1 = new ForestGenerator({
        width: 80,
        height: 80,
        seed: 10000,
        numClusters: 5
      });

      const generator2 = new ForestGenerator({
        width: 80,
        height: 80,
        seed: 20000,
        numClusters: 5
      });

      const map1 = generator1.generate();
      const map2 = generator2.generate();

      // Different number of trees (very likely)
      const differentTreeCount = map1.trees!.length !== map2.trees!.length;
      
      // Different tree positions (check first few)
      const differentPositions = map1.trees![0].x !== map2.trees![0].x ||
                                  map1.trees![0].y !== map2.trees![0].y;
      
      // At least one should be different
      expect(differentTreeCount || differentPositions).toBe(true);
    });
  });
});
