/**
 * House Terrain Subtype Configurations
 * 
 * Defines all house subtypes (Cottage, Manor, Inn, Castle, Wizard Tower)
 * with their multi-story configurations, room sizes, and special properties.
 */

import { SubtypeConfig, TerrainAlgorithm } from '../types';
import { HouseSubtype, HouseStory } from '../../types/enums';

export const COTTAGE_CONFIG: SubtypeConfig = {
  subtype: HouseSubtype.COTTAGE,
  name: 'Cottage',
  description: 'Small, cozy home',
  roomShape: 'rectangle',
  algorithm: TerrainAlgorithm.BSP, // Use Binary Space Partitioning for structured layout
  gridCellSize: 48, // Larger grid = smaller building appearance
  minRoomSpacing: 1, // Very close together (1 grid cell between rooms)
  stories: [
    {
      story: HouseStory.BASEMENT,
      numberOfRooms: 2,
      minRoomSize: 4,
      maxRoomSize: 4,
      roomPadding: 0.2,
      corridorWidth: 1,
      useBasementColors: true,
      gridCellSize: 48,
      minRoomSpacing: 1,
      mapWidth: 24,
      mapHeight: 18
    },
    {
      story: HouseStory.STORY_1,
      numberOfRooms: 4,
      minRoomSize: 5,
      maxRoomSize: 5,
      roomPadding: 0.25,
      corridorWidth: 1,
      useBasementColors: false,
      gridCellSize: 48,
      minRoomSpacing: 1,
      mapWidth: 24,
      mapHeight: 18
    },
    {
      story: HouseStory.STORY_2,
      numberOfRooms: 3,
      minRoomSize: 4,
      maxRoomSize: 4,
      roomPadding: 0.2,
      corridorWidth: 1,
      useBasementColors: false,
      gridCellSize: 48,
      minRoomSpacing: 1,
      mapWidth: 24,
      mapHeight: 18
    }
  ]
};

export const MANOR_CONFIG: SubtypeConfig = {
  subtype: HouseSubtype.MANOR,
  name: 'Manor',
  description: 'Large estate with multiple wings',
  roomShape: 'rectangle',
  algorithm: TerrainAlgorithm.BSP,
  gridCellSize: 32, // Standard grid size for larger buildings
  minRoomSpacing: 1, // Close together for interior feel
  stories: [
    {
      story: HouseStory.BASEMENT,
      numberOfRooms: 6,
      minRoomSize: 6,
      maxRoomSize: 6,
      roomPadding: 0.3,
      corridorWidth: 2,
      useBasementColors: true,
      gridCellSize: 32,
      minRoomSpacing: 1,
      mapWidth: 32,
      mapHeight: 24
    },
    {
      story: HouseStory.STORY_1,
      numberOfRooms: 8,
      minRoomSize: 7,
      maxRoomSize: 7,
      roomPadding: 0.3,
      corridorWidth: 2,
      useBasementColors: false,
      gridCellSize: 32,
      minRoomSpacing: 1,
      mapWidth: 32,
      mapHeight: 24
    },
    {
      story: HouseStory.STORY_2,
      numberOfRooms: 7,
      minRoomSize: 6,
      maxRoomSize: 6,
      roomPadding: 0.25,
      corridorWidth: 2,
      useBasementColors: false,
      gridCellSize: 32,
      minRoomSpacing: 1,
      mapWidth: 32,
      mapHeight: 24
    },
    {
      story: HouseStory.STORY_3,
      numberOfRooms: 4,
      minRoomSize: 5,
      maxRoomSize: 5,
      roomPadding: 0.2,
      corridorWidth: 1,
      useBasementColors: false,
      gridCellSize: 32,
      minRoomSpacing: 1,
      mapWidth: 32,
      mapHeight: 24
    }
  ]
};

export const INN_CONFIG: SubtypeConfig = {
  subtype: HouseSubtype.INN,
  name: 'Inn & Tavern',
  description: 'Common room with guest quarters',
  roomShape: 'rectangle',
  algorithm: TerrainAlgorithm.BSP,
  gridCellSize: 36, // Slightly larger than manor, smaller than cottage
  minRoomSpacing: 1, // Close together
  stories: [
    {
      story: HouseStory.BASEMENT,
      numberOfRooms: 3,
      minRoomSize: 5,
      maxRoomSize: 5,
      roomPadding: 0.25,
      corridorWidth: 1,
      useBasementColors: true,
      gridCellSize: 36,
      minRoomSpacing: 1,
      mapWidth: 28,
      mapHeight: 21
    },
    {
      story: HouseStory.STORY_1,
      numberOfRooms: 5,
      minRoomSize: 7,
      maxRoomSize: 7,
      roomPadding: 0.3,
      corridorWidth: 2,
      useBasementColors: false,
      gridCellSize: 36,
      minRoomSpacing: 1,
      mapWidth: 28,
      mapHeight: 21
    },
    {
      story: HouseStory.STORY_2,
      numberOfRooms: 8,
      minRoomSize: 4,
      maxRoomSize: 4,
      roomPadding: 0.15,
      corridorWidth: 2,
      useBasementColors: false,
      gridCellSize: 36,
      minRoomSpacing: 1,
      mapWidth: 28,
      mapHeight: 21
    }
  ]
};

export const CASTLE_CONFIG: SubtypeConfig = {
  subtype: HouseSubtype.CASTLE,
  name: 'Castle',
  description: 'Fortified structure with thick walls',
  roomShape: 'rectangle',
  algorithm: TerrainAlgorithm.BSP,
  gridCellSize: 24, // Smallest grid = largest building appearance
  minRoomSpacing: 2, // Slightly more space (thick walls)
  stories: [
    {
      story: HouseStory.BASEMENT,
      numberOfRooms: 8,
      minRoomSize: 6,
      maxRoomSize: 6,
      roomPadding: 0.35,
      corridorWidth: 2,
      useBasementColors: true,
      gridCellSize: 24,
      minRoomSpacing: 2,
      mapWidth: 40,
      mapHeight: 30
    },
    {
      story: HouseStory.STORY_1,
      numberOfRooms: 10,
      minRoomSize: 9,
      maxRoomSize: 9,
      roomPadding: 0.35,
      corridorWidth: 3,
      useBasementColors: false,
      gridCellSize: 24,
      minRoomSpacing: 2,
      mapWidth: 40,
      mapHeight: 30
    },
    {
      story: HouseStory.STORY_2,
      numberOfRooms: 8,
      minRoomSize: 7,
      maxRoomSize: 7,
      roomPadding: 0.3,
      corridorWidth: 2,
      useBasementColors: false,
      gridCellSize: 24,
      minRoomSpacing: 2,
      mapWidth: 40,
      mapHeight: 30
    },
    {
      story: HouseStory.STORY_3,
      numberOfRooms: 6,
      minRoomSize: 6,
      maxRoomSize: 6,
      roomPadding: 0.25,
      corridorWidth: 2,
      useBasementColors: false,
      gridCellSize: 24,
      minRoomSpacing: 2,
      mapWidth: 40,
      mapHeight: 30
    }
  ]
};

export const WIZARD_TOWER_CONFIG: SubtypeConfig = {
  subtype: HouseSubtype.WIZARD_TOWER,
  name: 'Wizard Tower',
  description: 'Vertical tower with circular structure',
  roomShape: 'rectangle', // Rooms are rectangular, tower structure is circular
  algorithm: TerrainAlgorithm.BSP,
  hasBackgroundStructure: true,
  backgroundRenderer: 'wizardTower', // Reference to special rendering
  gridCellSize: 40, // Medium-large grid for mystical tower
  minRoomSpacing: 1, // Compact interior
  stories: [
    {
      story: HouseStory.BASEMENT,
      numberOfRooms: 3,
      minRoomSize: 6,
      maxRoomSize: 6,
      roomPadding: 0.3,
      corridorWidth: 1,
      useBasementColors: true,
      gridCellSize: 40,
      minRoomSpacing: 1,
      mapWidth: 30,
      mapHeight: 30
    },
    {
      story: HouseStory.STORY_1,
      numberOfRooms: 3,
      minRoomSize: 6,
      maxRoomSize: 6,
      roomPadding: 0.25,
      corridorWidth: 1,
      useBasementColors: false,
      gridCellSize: 40,
      minRoomSpacing: 1,
      mapWidth: 30,
      mapHeight: 30
    },
    {
      story: HouseStory.STORY_2,
      numberOfRooms: 3,
      minRoomSize: 5,
      maxRoomSize: 5,
      roomPadding: 0.2,
      corridorWidth: 1,
      useBasementColors: false,
      gridCellSize: 40,
      minRoomSpacing: 1,
      mapWidth: 30,
      mapHeight: 30
    },
    {
      story: HouseStory.STORY_3,
      numberOfRooms: 2,
      minRoomSize: 5,
      maxRoomSize: 5,
      roomPadding: 0.15,
      corridorWidth: 1,
      useBasementColors: false,
      gridCellSize: 40,
      minRoomSpacing: 1,
      mapWidth: 30,
      mapHeight: 30
    }
  ]
};

// Map of all house subtypes
export const HOUSE_SUBTYPES = new Map<HouseSubtype, SubtypeConfig>([
  [HouseSubtype.COTTAGE, COTTAGE_CONFIG],
  [HouseSubtype.MANOR, MANOR_CONFIG],
  [HouseSubtype.INN, INN_CONFIG],
  [HouseSubtype.CASTLE, CASTLE_CONFIG],
  [HouseSubtype.WIZARD_TOWER, WIZARD_TOWER_CONFIG]
]);

// Helper to get house config by subtype
export function getHouseConfig(subtype: HouseSubtype): SubtypeConfig | undefined {
  return HOUSE_SUBTYPES.get(subtype);
}
