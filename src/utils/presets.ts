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
      connectivityFactor: 0.1
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
      connectivityFactor: 0.2
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
      noiseScale: 0.04
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
      noiseScale: 0.08
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
      wallThreshold: 5
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
      wallThreshold: 4
    }
  }
];

export function getPresetsByTerrain(terrain: TerrainType): Preset[] {
  return PRESETS.filter(p => p.terrainType === terrain);
}

export function getPresetByName(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name);
}
