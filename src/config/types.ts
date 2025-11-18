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

// Terrain generation algorithms
export enum TerrainAlgorithm {
  BSP = 'bsp',                          // Binary Space Partitioning - for structured layouts (houses, dungeons)
  DRUNKARDS_WALK = 'drunkards_walk',    // Drunkard's Walk - for organic caves
  CELLULAR_AUTOMATA = 'cellular_automata', // Cellular Automata - for organic forests, biomes
  GRID = 'grid',                        // Grid-based - for towns, cities
  VORONOI = 'voronoi'                   // Voronoi diagrams - for natural regions
}

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
  roomPadding: number; // 0.0 to 1.0 - padding inside room boundaries
  corridorWidth: number;
  useBasementColors: boolean;
  gridCellSize?: number; // Grid cell size in pixels (default: 32)
  minRoomSpacing?: number; // Minimum grid cells between rooms (default: 1-3)
  mapWidth?: number; // Map width in grid cells (default: 40)
  mapHeight?: number; // Map height in grid cells (default: 30)
}

// Drunkard's Walk algorithm parameters (for caves)
export interface DrunkardsWalkParams {
  coveragePercent?: number; // Percentage of map to carve (default: varies by subtype)
  resolution?: number; // Sub-grid resolution multiplier (default: 3)
  directionChangeChance?: number; // Probability of changing direction (default: 0.15)
  widerAreaChance?: number; // Probability of carving wider areas (default: 0.02)
  minStepsBeforeChange?: number; // Minimum steps before forced direction change (default: 3)
  maxStepsBeforeChange?: number; // Maximum steps before forced direction change (default: 8)
  displayScale?: number; // Display scale multiplier for viewing fine-grained maps (default: 1.0)
}

// Subtype configuration (e.g., Cottage, Dense Forest, Natural Cavern)
export interface SubtypeConfig {
  subtype: TerrainSubtype;
  name: string;
  description: string;
  roomShape: 'rectangle' | 'circle';
  stories?: StoryConfig[]; // Only for houses
  
  // Algorithm override (optional - if not specified, uses terrain's default algorithm)
  algorithm?: TerrainAlgorithm;
  
  // Generation parameters
  defaultRoomCount?: number;
  minRoomSize?: number;
  maxRoomSize?: number;
  roomPadding?: number;
  corridorWidth?: number;
  gridCellSize?: number; // Grid cell size in pixels - larger = smaller building appearance
  minRoomSpacing?: number; // Minimum grid cells between rooms
  
  // Algorithm-specific parameters
  drunkardsWalk?: DrunkardsWalkParams; // Parameters for Drunkard's Walk algorithm
  
  // Special rendering
  hasBackgroundStructure?: boolean; // e.g., circular towers for Wizard Tower
  backgroundRenderer?: string; // Reference to special background rendering function
}

// Terrain type configuration
export interface TerrainConfig {
  type: MapTerrainType;
  name: string;
  description: string;
  
  // Generation algorithm to use for this terrain type
  algorithm: TerrainAlgorithm;
  
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
