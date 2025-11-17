/**
 * Cave Terrain Subtype Configurations
 * 
 * Defines all cave subtypes (Natural Cavern, Crystal Cave, Lava Tubes, Underground Lake, Mine)
 * with their generation parameters, room characteristics, and visual properties.
 */

import { SubtypeConfig } from '../types';
import { CaveSubtype } from '../../types/enums';

export const NATURAL_CAVERN_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.NATURAL_CAVERN,
  name: 'Natural Cavern',
  description: 'Organic cave system formed by natural erosion',
  roomShape: 'rectangle', // Will use organic shapes during generation
  
  // Generation parameters
  defaultRoomCount: 8,
  minRoomSize: 5,
  maxRoomSize: 12,
  roomPadding: 0.1, // Minimal padding for natural feel
  corridorWidth: 2, // Wider, irregular passages
  gridCellSize: 32,
  minRoomSpacing: 2 // More space between caverns
};

export const CRYSTAL_CAVE_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.CRYSTAL_CAVE,
  name: 'Crystal Cave',
  description: 'Glittering underground caverns with crystal formations',
  roomShape: 'rectangle', // Angular for crystalline structures
  
  // Generation parameters
  defaultRoomCount: 6,
  minRoomSize: 6,
  maxRoomSize: 10,
  roomPadding: 0.2, // More defined spaces for crystal chambers
  corridorWidth: 2,
  gridCellSize: 36, // Slightly larger for magical feel
  minRoomSpacing: 2
};

export const LAVA_TUBES_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.LAVA_TUBES,
  name: 'Lava Tubes',
  description: 'Volcanic tunnels with flowing magma channels',
  roomShape: 'rectangle', // Long, tubular chambers
  
  // Generation parameters
  defaultRoomCount: 10,
  minRoomSize: 4,
  maxRoomSize: 8,
  roomPadding: 0.15,
  corridorWidth: 3, // Wide lava channels
  gridCellSize: 28, // Smaller for extensive tube network
  minRoomSpacing: 1 // Tubes are close together
};

export const UNDERGROUND_LAKE_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.UNDERGROUND_LAKE,
  name: 'Underground Lake',
  description: 'Flooded caverns with water-filled chambers',
  roomShape: 'rectangle', // Irregular water-filled spaces
  
  // Generation parameters
  defaultRoomCount: 5,
  minRoomSize: 8,
  maxRoomSize: 15,
  roomPadding: 0.1, // Open water areas
  corridorWidth: 2,
  gridCellSize: 40, // Larger for vast underground lake
  minRoomSpacing: 3 // Large gaps between chambers (water)
};

export const MINE_CONFIG: SubtypeConfig = {
  subtype: CaveSubtype.MINE,
  name: 'Mine',
  description: 'Carved tunnels with structural supports',
  roomShape: 'rectangle', // Squared-off, man-made chambers
  
  // Generation parameters
  defaultRoomCount: 12,
  minRoomSize: 4,
  maxRoomSize: 6,
  roomPadding: 0.3, // Structural supports and equipment
  corridorWidth: 1, // Narrow mine shafts
  gridCellSize: 32,
  minRoomSpacing: 2 // Regular spacing for mine layout
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
