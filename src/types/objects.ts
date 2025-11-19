// Object Placement System Type Definitions

import { TerrainType } from './generator';

/**
 * Represents a sprite from a spritesheet
 */
export interface Sprite {
  id: string;
  name: string;
  sheetId: string; // Reference to parent spritesheet
  x: number; // Position in spritesheet (pixels)
  y: number;
  width: number; // Size in spritesheet (pixels)
  height: number;
  category: ObjectCategory;
  terrainType: TerrainType; // Which terrain this object belongs to
}

/**
 * A placed object instance on the map
 */
export interface PlacedObject {
  id: string; // Unique instance ID
  spriteId: string; // Reference to Sprite
  gridX: number; // Grid position (not pixel position)
  gridY: number;
  scaleX: number; // Scale multiplier (1.0 = normal size)
  scaleY: number;
  rotation: number; // Rotation in degrees (0-360)
  zIndex: number; // Stacking order for overlapping objects
}

/**
 * Categorization for objects within each terrain type
 */
export enum ObjectCategory {
  // Forest objects
  ForestVegetation = 'forest-vegetation', // Bushes, flowers, mushrooms
  ForestStructure = 'forest-structure', // Stumps, logs, rocks
  ForestCreature = 'forest-creature', // Wildlife, insects
  
  // Dungeon objects
  DungeonFurniture = 'dungeon-furniture', // Tables, chairs, beds
  DungeonTrap = 'dungeon-trap', // Spike traps, pressure plates
  DungeonTreasure = 'dungeon-treasure', // Chests, gold piles
  DungeonDecor = 'dungeon-decor', // Torches, banners, statues
  
  // Cave objects
  CaveFormation = 'cave-formation', // Stalagmites, stalactites, crystals
  CaveResource = 'cave-resource', // Ore veins, gems
  CaveCreature = 'cave-creature', // Bats, spiders
  
  // House objects
  HouseFurniture = 'house-furniture', // Tables, chairs, cabinets
  HouseDecor = 'house-decor', // Paintings, rugs, plants
  HouseUtility = 'house-utility', // Doors, windows, stairs
  
  // Universal objects (work on any terrain)
  Universal = 'universal' // Characters, markers, effects
}

/**
 * Spritesheet metadata
 */
export interface SpriteSheet {
  id: string;
  name: string;
  imagePath: string;
  imageData?: HTMLImageElement; // Loaded image
  gridWidth: number; // Number of sprites horizontally
  gridHeight: number; // Number of sprites vertically
  spriteWidth: number; // Width of each sprite in pixels
  spriteHeight: number; // Height of each sprite in pixels
  sprites: Sprite[]; // Extracted sprites from this sheet
}

/**
 * Object palette state
 */
export interface ObjectPalette {
  spritesheets: SpriteSheet[];
  selectedSpriteId: string | null;
  filterTerrainType: TerrainType | null; // Filter by terrain
  filterCategory: ObjectCategory | null; // Filter by category
  visible: boolean; // Show/hide palette
}

/**
 * Object layer rendering options
 */
export interface ObjectLayerOptions {
  visible: boolean; // Show/hide entire object layer
  showGrid: boolean; // Show grid overlay for placement
  snapToGrid: boolean; // Snap objects to grid cells
  showBounds: boolean; // Show bounding boxes for debugging
  opacity: number; // Layer opacity (0-1)
}

/**
 * Utility type for object placement mode
 */
export enum PlacementMode {
  None = 'none', // Default cursor
  Place = 'place', // Placing new object
  Select = 'select', // Selecting existing object
  Move = 'move', // Moving selected object
  Delete = 'delete' // Deleting objects
}

/**
 * Helper function to get category display name
 */
export function getCategoryDisplayName(category: ObjectCategory): string {
  const names: Record<ObjectCategory, string> = {
    [ObjectCategory.ForestVegetation]: 'Vegetation',
    [ObjectCategory.ForestStructure]: 'Structures',
    [ObjectCategory.ForestCreature]: 'Creatures',
    [ObjectCategory.DungeonFurniture]: 'Furniture',
    [ObjectCategory.DungeonTrap]: 'Traps',
    [ObjectCategory.DungeonTreasure]: 'Treasure',
    [ObjectCategory.DungeonDecor]: 'Decorations',
    [ObjectCategory.CaveFormation]: 'Formations',
    [ObjectCategory.CaveResource]: 'Resources',
    [ObjectCategory.CaveCreature]: 'Creatures',
    [ObjectCategory.HouseFurniture]: 'Furniture',
    [ObjectCategory.HouseDecor]: 'Decorations',
    [ObjectCategory.HouseUtility]: 'Utilities',
    [ObjectCategory.Universal]: 'Universal'
  };
  return names[category];
}

/**
 * Get categories for a specific terrain type
 */
export function getCategoriesForTerrain(terrainType: TerrainType): ObjectCategory[] {
  switch (terrainType) {
    case TerrainType.Forest:
      return [
        ObjectCategory.ForestVegetation,
        ObjectCategory.ForestStructure,
        ObjectCategory.ForestCreature,
        ObjectCategory.Universal
      ];
    case TerrainType.Dungeon:
      return [
        ObjectCategory.DungeonFurniture,
        ObjectCategory.DungeonTrap,
        ObjectCategory.DungeonTreasure,
        ObjectCategory.DungeonDecor,
        ObjectCategory.Universal
      ];
    case TerrainType.Cave:
      return [
        ObjectCategory.CaveFormation,
        ObjectCategory.CaveResource,
        ObjectCategory.CaveCreature,
        ObjectCategory.Universal
      ];
    case TerrainType.House:
      return [
        ObjectCategory.HouseFurniture,
        ObjectCategory.HouseDecor,
        ObjectCategory.HouseUtility,
        ObjectCategory.Universal
      ];
    default:
      return [ObjectCategory.Universal];
  }
}
