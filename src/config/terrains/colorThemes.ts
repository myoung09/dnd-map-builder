/**
 * Terrain Color Theme Configurations
 * 
 * Defines color themes for each terrain type, including background colors,
 * path/room colors, and contrast ratios for accessibility.
 */

import { TerrainColorTheme } from '../types';
import { MapTerrainType } from '../../types/enums';

// HOUSE terrain color themes
export const HOUSE_THEMES: TerrainColorTheme[] = [
  {
    name: 'Warm Wood & Dark Halls',
    backgroundColor: { r: 222, g: 184, b: 135 }, // burlywood
    pathColor: { r: 101, g: 67, b: 33 }, // dark brown
    contrastRatio: 4.5
  },
  {
    name: 'Stone & Slate',
    backgroundColor: { r: 105, g: 105, b: 105 }, // dim gray
    pathColor: { r: 47, g: 79, b: 79 }, // dark slate gray
    contrastRatio: 3.2
  },
  {
    name: 'Rich Wood & Light Stone',
    backgroundColor: { r: 139, g: 69, b: 19 }, // saddle brown
    pathColor: { r: 119, g: 136, b: 153 }, // light slate gray
    contrastRatio: 5.1
  }
];

// FOREST terrain color themes
export const FOREST_THEMES: TerrainColorTheme[] = [
  {
    name: 'Deep Forest & Earth Trails',
    backgroundColor: { r: 34, g: 139, b: 34 }, // forest green
    pathColor: { r: 139, g: 115, b: 85 }, // burlywood4
    contrastRatio: 3.8
  },
  {
    name: 'Olive Grove & Peru Paths',
    backgroundColor: { r: 85, g: 107, b: 47 }, // dark olive green
    pathColor: { r: 205, g: 133, b: 63 }, // peru
    contrastRatio: 4.2
  },
  {
    name: 'Meadow & Brown Trails',
    backgroundColor: { r: 107, g: 142, b: 35 }, // olive drab
    pathColor: { r: 93, g: 78, b: 55 }, // dark brown
    contrastRatio: 3.5
  }
];

// CAVE terrain color themes
export const CAVE_THEMES: TerrainColorTheme[] = [
  {
    name: 'Dark Stone & Slate',
    backgroundColor: { r: 47, g: 47, b: 47 }, // dark gray
    pathColor: { r: 112, g: 128, b: 144 }, // slate gray
    contrastRatio: 4.1
  },
  {
    name: 'Deep Cave & Steel Blue',
    backgroundColor: { r: 28, g: 28, b: 28 }, // very dark
    pathColor: { r: 70, g: 130, b: 180 }, // steel blue
    contrastRatio: 6.2
  },
  {
    name: 'Charcoal & Light Steel',
    backgroundColor: { r: 54, g: 69, b: 79 }, // charcoal
    pathColor: { r: 176, g: 196, b: 222 }, // light steel blue
    contrastRatio: 5.8
  }
];

// TOWN terrain color themes
export const TOWN_THEMES: TerrainColorTheme[] = [
  {
    name: 'Green Commons & Tan Streets',
    backgroundColor: { r: 143, g: 188, b: 143 }, // dark sea green
    pathColor: { r: 210, g: 180, b: 140 }, // tan
    contrastRatio: 3.1
  },
  {
    name: 'Forest Green & Wheat Stone',
    backgroundColor: { r: 34, g: 139, b: 34 }, // forest green
    pathColor: { r: 245, g: 222, b: 179 }, // wheat
    contrastRatio: 4.9
  },
  {
    name: 'Lime Green & Sienna Brick',
    backgroundColor: { r: 50, g: 205, b: 50 }, // lime green
    pathColor: { r: 160, g: 82, b: 45 }, // sienna
    contrastRatio: 3.7
  }
];

// DUNGEON terrain color themes (inherits from CAVE but darkened)
export const DUNGEON_THEMES: TerrainColorTheme[] = CAVE_THEMES;

// Map of all color themes by terrain type
export const TERRAIN_COLOR_THEMES = new Map<MapTerrainType, TerrainColorTheme[]>([
  [MapTerrainType.HOUSE, HOUSE_THEMES],
  [MapTerrainType.FOREST, FOREST_THEMES],
  [MapTerrainType.CAVE, CAVE_THEMES],
  [MapTerrainType.TOWN, TOWN_THEMES],
  [MapTerrainType.DUNGEON, DUNGEON_THEMES]
]);

// Helper to get color themes for a terrain type
export function getColorThemes(terrainType: MapTerrainType): TerrainColorTheme[] {
  return TERRAIN_COLOR_THEMES.get(terrainType) || [];
}

// Helper to get a random color theme for a terrain type
export function getRandomColorTheme(terrainType: MapTerrainType): TerrainColorTheme {
  const themes = getColorThemes(terrainType);
  if (themes.length === 0) {
    // Fallback theme
    return {
      name: 'Default',
      backgroundColor: { r: 200, g: 200, b: 200 },
      pathColor: { r: 100, g: 100, b: 100 },
      contrastRatio: 3.0
    };
  }
  return themes[Math.floor(Math.random() * themes.length)];
}
