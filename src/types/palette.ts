/**
 * Type definitions for sprite palette system
 */

/**
 * Individual sprite extracted from a spritesheet
 */
export interface Sprite {
  id: string;
  name: string;
  x: number; // Position in source spritesheet
  y: number;
  width: number; // Dimensions in pixels
  height: number;
  imageData: string; // Base64 encoded image data
  category: string; // Category this sprite belongs to
  tags?: string[]; // Optional tags for filtering
  sheetId?: string; // Optional reference to parent spritesheet
}

/**
 * Category for organizing sprites
 */
export interface SpriteCategory {
  id: string;
  name: string;
  color?: string; // Optional color for UI
  order: number; // Display order
}

/**
 * Spritesheet metadata
 */
export interface Spritesheet {
  id: string;
  name: string;
  imageData: string; // Base64 encoded full spritesheet
  spriteWidth: number; // Width of each sprite tile
  spriteHeight: number; // Height of each sprite tile
  columns: number; // Number of columns
  rows: number; // Number of rows
  totalSprites: number;
  uploadedAt: Date;
}

/**
 * Complete palette containing spritesheets and organized sprites
 */
export interface Palette {
  id: string;
  name: string;
  spritesheets: Spritesheet[];
  sprites: Sprite[];
  categories: SpriteCategory[];
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Placed sprite instance on the map
 */
export interface PlacedSprite {
  id: string;
  spriteId: string; // Reference to sprite in palette
  x: number; // Grid coordinates
  y: number;
  scale: number; // Scale factor (1.0 = default)
  rotation: number; // Rotation in degrees
  zIndex: number; // Layer ordering
}

/**
 * Default categories
 */
export const DEFAULT_CATEGORIES: SpriteCategory[] = [
  { id: 'general', name: 'General', color: '#9e9e9e', order: 0 },
  { id: 'forest', name: 'Forest Objects', color: '#4caf50', order: 1 },
  { id: 'dungeon', name: 'Dungeon Objects', color: '#795548', order: 2 },
  { id: 'cave', name: 'Cave Objects', color: '#607d8b', order: 3 },
  { id: 'house', name: 'House Objects', color: '#ff9800', order: 4 },
];
