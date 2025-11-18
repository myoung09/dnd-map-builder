// Preset configurations for different map types

import { Preset, TerrainType } from '../types/generator';

export const PRESETS: Preset[] = [
  {
    name: 'Small House',
    terrainType: TerrainType.House,
    parameters: {
      width: 60,
      height: 60,
      minRoomSize: 4,
      maxRoomSize: 8,
      roomCount: 5,
      corridorWidth: 1,
      gridSize: 4
    }
  },
  {
    name: 'Large Manor',
    terrainType: TerrainType.House,
    parameters: {
      width: 100,
      height: 100,
      minRoomSize: 6,
      maxRoomSize: 15,
      roomCount: 12,
      corridorWidth: 2,
      gridSize: 4
    }
  },
  {
    name: 'Small Dungeon',
    terrainType: TerrainType.Dungeon,
    parameters: {
      width: 80,
      height: 80,
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 8,
      corridorWidth: 1,
      gridSize: 4,
      organicFactor: 0.2,
      connectivityFactor: 0.1,
      walkSteps: 7 // Balanced corridor straightness
    }
  },
  {
    name: 'Large Dungeon',
    terrainType: TerrainType.Dungeon,
    parameters: {
      width: 120,
      height: 120,
      minRoomSize: 6,
      maxRoomSize: 14,
      roomCount: 15,
      corridorWidth: 2,
      gridSize: 4,
      organicFactor: 0.4,
      connectivityFactor: 0.2,
      walkSteps: 6 // Slightly more wandering for larger dungeon
    }
  },
  {
    name: 'Winding Dungeon',
    terrainType: TerrainType.Dungeon,
    parameters: {
      width: 100,
      height: 100,
      minRoomSize: 5,
      maxRoomSize: 12,
      roomCount: 12,
      corridorWidth: 1,
      gridSize: 4,
      organicFactor: 0.5,
      connectivityFactor: 0.25,
      walkSteps: 4 // Very organic, winding corridors
    }
  },
  {
    name: 'Sparse Forest',
    terrainType: TerrainType.Forest,
    parameters: {
      width: 100,
      height: 100,
      treeDensity: 0.2,
      minTreeDistance: 5,
      noiseScale: 0.04,
      treeRadius: 1.8
    }
  },
  {
    name: 'Dense Forest',
    terrainType: TerrainType.Forest,
    parameters: {
      width: 100,
      height: 100,
      treeDensity: 0.6,
      minTreeDistance: 2,
      noiseScale: 0.08,
      treeRadius: 1.2
    }
  },
  {
    name: 'Small Cave',
    terrainType: TerrainType.Cave,
    parameters: {
      width: 70,
      height: 70,
      fillProbability: 0.45,
      smoothIterations: 4,
      wallThreshold: 4,
      caveRoughness: 1.0 // Balanced cave with moderate roughness
    }
  },
  {
    name: 'Sprawling Cave',
    terrainType: TerrainType.Cave,
    parameters: {
      width: 120,
      height: 120,
      fillProbability: 0.42,
      smoothIterations: 5,
      wallThreshold: 4,
      caveRoughness: 0.9 // Slightly smoother for larger caves
    }
  },
  {
    name: 'Rough Cavern',
    terrainType: TerrainType.Cave,
    parameters: {
      width: 80,
      height: 80,
      fillProbability: 0.48,
      smoothIterations: 3,
      wallThreshold: 4,
      caveRoughness: 1.4 // Rougher, more jagged walls
    }
  }
];

export function getPresetsByTerrain(terrain: TerrainType): Preset[] {
  return PRESETS.filter(p => p.terrainType === terrain);
}

export function getPresetByName(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name);
}
