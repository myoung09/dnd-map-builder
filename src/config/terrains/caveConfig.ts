/**
 * Cave Terrain Subtype Configurations
 * 
 * Defines all cave subtypes (Natural Cavern, Crystal Cave, Lava Tubes, Underground Lake, Mine)
 * with their generation parameters, room characteristics, and visual properties.
 */

import { SubtypeConfig, TerrainAlgorithm } from '../types';
import { CaveSubtype } from '../../types/enums';

export const NATURAL_CAVERN_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.NATURAL_CAVERN,
  name: 'Natural Cavern',
  description: 'Organic cave system formed by natural erosion',
  roomShape: 'rectangle', // Will use organic shapes during generation
  algorithm: TerrainAlgorithm.DRUNKARDS_WALK, // Drunkard's Walk for organic caves
  
  // Generation parameters
  defaultRoomCount: 8,
  minRoomSize: 5,
  maxRoomSize: 12,
  roomPadding: 0.1, // Minimal padding for natural feel
  corridorWidth: 2, // Wider, irregular passages
  gridCellSize: 32,
  minRoomSpacing: 2, // More space between caverns
  
  // Drunkard's Walk parameters
  drunkardsWalk: {
    coveragePercent: 20, // 20% of map is cave
    resolution: 4, // 4x sub-grid resolution
    directionChangeChance: 0.25, // 15% chance to change direction
    widerAreaChance: 0.10, // 10% chance for wider areas
    minStepsBeforeChange: 3,
    maxStepsBeforeChange: 8
  }
};

export const CRYSTAL_CAVE_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.CRYSTAL_CAVE,
  name: 'Crystal Cave',
  description: 'Glittering underground caverns with crystal formations',
  roomShape: 'rectangle', // Angular for crystalline structures
  algorithm: TerrainAlgorithm.DRUNKARDS_WALK,
  
  // Generation parameters
  defaultRoomCount: 6,
  minRoomSize: 6,
  maxRoomSize: 10,
  roomPadding: 0.2, // More defined spaces for crystal chambers
  corridorWidth: 2,
  gridCellSize: 36, // Slightly larger for magical feel
  minRoomSpacing: 2,
  
  // Drunkard's Walk parameters
  drunkardsWalk: {
    coveragePercent: 18, // 18% coverage - more structured
    resolution: 3,
    directionChangeChance: 0.07, // Straighter passages
    widerAreaChance: 0.04, // More chamber-like areas
    minStepsBeforeChange: 4,
    maxStepsBeforeChange: 10
  }
};

export const LAVA_TUBES_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.LAVA_TUBES,
  name: 'Lava Tubes',
  description: 'Volcanic tunnels with flowing magma channels',
  roomShape: 'rectangle', // Long, tubular chambers
  algorithm: TerrainAlgorithm.DRUNKARDS_WALK,
  
  // Generation parameters
  defaultRoomCount: 10,
  minRoomSize: 4,
  maxRoomSize: 8,
  roomPadding: 0.15,
  corridorWidth: 3, // Wide lava channels
  gridCellSize: 28, // Smaller for extensive tube network
  minRoomSpacing: 1, // Tubes are close together
  
  // Drunkard's Walk parameters
  drunkardsWalk: {
    coveragePercent: 10, // 10% - narrow tubes
    resolution: 4, // Higher resolution for thin tubes
    directionChangeChance: 0.10, // Long, straight tubes
    widerAreaChance: 0.01, // Rare wider areas
    minStepsBeforeChange: 5,
    maxStepsBeforeChange: 12
  }
};

export const UNDERGROUND_LAKE_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.UNDERGROUND_LAKE,
  name: 'Underground Lake',
  description: 'Flooded caverns with water-filled chambers',
  roomShape: 'rectangle', // Irregular water-filled spaces
  algorithm: TerrainAlgorithm.DRUNKARDS_WALK,
  
  // Generation parameters
  defaultRoomCount: 5,
  minRoomSize: 8,
  maxRoomSize: 15,
  roomPadding: 0.1, // Open water areas
  corridorWidth: 2,
  gridCellSize: 40, // Larger for vast underground lake
  minRoomSpacing: 3, // Large gaps between chambers (water)
  
  // Drunkard's Walk parameters
  drunkardsWalk: {
    coveragePercent: 25, // 25% - large open water areas
    resolution: 2, // Lower resolution for larger chambers
    directionChangeChance: 0.40, // More irregular shoreline
    widerAreaChance: 0.10, // Frequent wide areas (lake chambers)
    minStepsBeforeChange: 2,
    maxStepsBeforeChange: 6
  }
};

export const MINE_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.MINE,
  name: 'Mine',
  description: 'Carved tunnels with structural supports',
  roomShape: 'rectangle', // Squared-off, man-made chambers
  algorithm: TerrainAlgorithm.DRUNKARDS_WALK, // Even mines can use organic walk but with constraints
  
  // Generation parameters
  defaultRoomCount: 12,
  minRoomSize: 4,
  maxRoomSize: 6,
  roomPadding: 0.3, // Structural supports and equipment
  corridorWidth: 1, // Narrow mine shafts
  gridCellSize: 32,
  minRoomSpacing: 2, // Regular spacing for mine layout
  
  // Drunkard's Walk parameters
  drunkardsWalk: {
    coveragePercent: 12, // 12% - compact mine shafts
    resolution: 4, // Higher resolution for narrow shafts
    directionChangeChance: 0.08, // Very straight passages (man-made)
    widerAreaChance: 0.02, // Occasional work areas
    minStepsBeforeChange: 6,
    maxStepsBeforeChange: 15
  }
};

// Map of all cave subtypes
export const CAVE_SUBTYPES = new Map<CaveSubtype, SubtypeConfig>([
  [CaveSubtype.NATURAL_CAVERN, NATURAL_CAVERN_CONFIG],
  [CaveSubtype.CRYSTAL_CAVE, CRYSTAL_CAVE_CONFIG],
  [CaveSubtype.LAVA_TUBES, LAVA_TUBES_CONFIG],
  [CaveSubtype.UNDERGROUND_LAKE, UNDERGROUND_LAKE_CONFIG],
  [CaveSubtype.MINE, MINE_CONFIG]
]);

// Helper to get cave config by subtype
export function getCaveConfig(subtype: CaveSubtype): SubtypeConfig | undefined {
  return CAVE_SUBTYPES.get(subtype);
}
