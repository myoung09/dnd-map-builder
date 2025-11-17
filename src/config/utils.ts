/**
 * Configuration utility functions
 */

import { MapTerrainType } from '../types/enums';
import { TerrainAlgorithm, TerrainSubtype } from './types';
import { getHouseConfig } from './terrains/houseConfig';
import { getCaveConfig } from './terrains/caveConfig';

/**
 * Get the terrain generation algorithm for a specific terrain type and subtype
 * 
 * @param terrainType - The terrain type (HOUSE, CAVE, etc.)
 * @param subtype - Optional subtype (Cottage, Natural Cavern, etc.)
 * @returns The terrain algorithm to use, or undefined if not found
 */
export function getTerrainAlgorithm(
  terrainType: MapTerrainType,
  subtype?: TerrainSubtype
): TerrainAlgorithm | undefined {
  let config;
  
  // Get configuration based on terrain type
  switch (terrainType) {
    case MapTerrainType.HOUSE:
      if (subtype) {
        config = getHouseConfig(subtype as any);
      }
      break;
    case MapTerrainType.CAVE:
      if (subtype) {
        config = getCaveConfig(subtype as any);
      }
      break;
    case MapTerrainType.FOREST:
      // TODO: Implement forest config
      return TerrainAlgorithm.CELLULAR_AUTOMATA;
    case MapTerrainType.TOWN:
      // TODO: Implement town config
      return TerrainAlgorithm.GRID;
    case MapTerrainType.DUNGEON:
      // TODO: Implement dungeon config
      return TerrainAlgorithm.BSP;
    default:
      return undefined;
  }
  
  // Return algorithm from config, or default to BSP
  return config?.algorithm || TerrainAlgorithm.BSP;
}
