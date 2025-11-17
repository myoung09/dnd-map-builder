/**
 * Terrain Configuration Type Definitions
 * 
 * These types define the structure for configuring different terrain types,
 * their subtypes, color themes, and generation parameters.
 */

import { Color } from '../types/map';
import {
  MapTerrainType,
  HouseSubtype,
  ForestSubtype,
  CaveSubtype,
  TownSubtype,
  DungeonSubtype,
  HouseStory
} from '../services/mapGenerationService';

// Union type for all terrain subtypes
export type TerrainSubtype = HouseSubtype | ForestSubtype | CaveSubtype | TownSubtype | DungeonSubtype;

// Color theme for a terrain type
export interface TerrainColorTheme {
  name: string;
  backgroundColor: Color;
  pathColor: Color;
  roomAccentColor?: Color;
  contrastRatio?: number;
}

// Story/floor configuration for multi-story buildings (houses)
export interface StoryConfig {
  story: HouseStory;
  numberOfRooms: number;
  minRoomSize: number;
  maxRoomSize: number;
  roomPadding: number; // 0.0 to 1.0
  corridorWidth: number;
  useBasementColors: boolean;
}

// Subtype configuration (e.g., Cottage, Dense Forest, Natural Cavern)
export interface SubtypeConfig {
  subtype: TerrainSubtype;
  name: string;
  description: string;
  roomShape: 'rectangle' | 'circle';
  stories?: StoryConfig[]; // Only for houses
  
  // Generation parameters
  defaultRoomCount?: number;
  minRoomSize?: number;
  maxRoomSize?: number;
  roomPadding?: number;
  corridorWidth?: number;
  
  // Special rendering
  hasBackgroundStructure?: boolean; // e.g., circular towers for Wizard Tower
  backgroundRenderer?: string; // Reference to special background rendering function
}

// Terrain type configuration
export interface TerrainConfig {
  type: MapTerrainType;
  name: string;
  description: string;
  
  // Available subtypes for this terrain
  subtypes: SubtypeConfig[];
  
  // Color themes available for this terrain
  colorThemes: TerrainColorTheme[];
  
  // Default generation parameters
  defaultOptions: {
    numberOfRooms: number;
    minRoomSize: number;
    maxRoomSize: number;
    organicFactor: number;
    hasEntranceExit: boolean;
  };
}

// Complete terrain configuration registry
export interface TerrainConfigRegistry {
  [MapTerrainType.HOUSE]: TerrainConfig;
  [MapTerrainType.FOREST]: TerrainConfig;
  [MapTerrainType.CAVE]: TerrainConfig;
  [MapTerrainType.TOWN]: TerrainConfig;
  [MapTerrainType.DUNGEON]: TerrainConfig;
}
