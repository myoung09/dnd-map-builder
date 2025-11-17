/**
 * Shared Enums for Map Generation
 * 
 * These enums are used across the application and config files.
 * Extracted to avoid circular dependencies.
 */

// Terrain types for map generation
export enum MapTerrainType {
  HOUSE = 'house',
  FOREST = 'forest', 
  CAVE = 'cave',
  TOWN = 'town',
  DUNGEON = 'dungeon'
}

// Subtypes for each terrain
export enum HouseSubtype {
  COTTAGE = 'cottage',
  MANOR = 'manor',
  INN = 'inn',
  CASTLE = 'castle',
  WIZARD_TOWER = 'wizard_tower'
}

export enum ForestSubtype {
  DENSE_FOREST = 'dense_forest',
  ENCHANTED_GROVE = 'enchanted_grove',
  WOODLAND_TRAIL = 'woodland_trail',
  SACRED_GROVE = 'sacred_grove',
  OVERGROWN_RUINS = 'overgrown_ruins'
}

export enum CaveSubtype {
  NATURAL_CAVERN = 'natural_cavern',
  CRYSTAL_CAVE = 'crystal_cave',
  LAVA_TUBES = 'lava_tubes',
  UNDERGROUND_LAKE = 'underground_lake',
  MINE = 'mine'
}

export enum TownSubtype {
  VILLAGE = 'village',
  MARKET_DISTRICT = 'market_district',
  HARBOR_TOWN = 'harbor_town',
  WALLED_CITY = 'walled_city',
  CROSSROADS = 'crossroads'
}

export enum DungeonSubtype {
  CRYPTS = 'crypts',
  PRISON = 'prison',
  TEMPLE = 'temple',
  SEWER = 'sewer',
  ANCIENT_RUINS = 'ancient_ruins'
}

// Multi-story house system
export enum HouseStory {
  BASEMENT = 'basement',
  STORY_1 = 'story_1',
  STORY_2 = 'story_2',
  STORY_3 = 'story_3'
}
