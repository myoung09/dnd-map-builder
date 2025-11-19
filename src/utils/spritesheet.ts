/**
 * SpriteSheet Manager Utility
 * Handles loading, parsing, and managing spritesheets for object placement
 */

import { SpriteSheet, Sprite, ObjectCategory } from '../types/objects';
import { TerrainType } from '../types/generator';

/**
 * Load an image from a URL
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = url;
  });
}

/**
 * Create a spritesheet from an image with automatic grid extraction
 */
export async function createSpriteSheet(
  id: string,
  name: string,
  imagePath: string,
  spriteWidth: number,
  spriteHeight: number,
  terrainType: TerrainType,
  defaultCategory: ObjectCategory
): Promise<SpriteSheet> {
  const imageData = await loadImage(imagePath);
  
  const gridWidth = Math.floor(imageData.width / spriteWidth);
  const gridHeight = Math.floor(imageData.height / spriteHeight);
  
  const sprites: Sprite[] = [];
  
  // Extract all sprites from the grid
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const spriteId = `${id}_${row}_${col}`;
      sprites.push({
        id: spriteId,
        name: `Sprite ${row}-${col}`,
        sheetId: id,
        x: col * spriteWidth,
        y: row * spriteHeight,
        width: spriteWidth,
        height: spriteHeight,
        category: defaultCategory,
        terrainType: terrainType
      });
    }
  }
  
  return {
    id,
    name,
    imagePath,
    imageData,
    gridWidth,
    gridHeight,
    spriteWidth,
    spriteHeight,
    sprites
  };
}

/**
 * Create a spritesheet with manual sprite definitions
 */
export async function createSpriteSheetManual(
  id: string,
  name: string,
  imagePath: string,
  spriteDefinitions: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    category: ObjectCategory;
    terrainType: TerrainType;
  }>
): Promise<SpriteSheet> {
  const imageData = await loadImage(imagePath);
  
  const sprites: Sprite[] = spriteDefinitions.map(def => ({
    ...def,
    sheetId: id
  }));
  
  // Calculate grid dimensions (for uniform sheets)
  const maxX = Math.max(...sprites.map(s => s.x + s.width));
  const maxY = Math.max(...sprites.map(s => s.y + s.height));
  const spriteWidth = sprites.length > 0 ? sprites[0].width : 0;
  const spriteHeight = sprites.length > 0 ? sprites[0].height : 0;
  
  return {
    id,
    name,
    imagePath,
    imageData,
    gridWidth: Math.ceil(maxX / spriteWidth),
    gridHeight: Math.ceil(maxY / spriteHeight),
    spriteWidth,
    spriteHeight,
    sprites
  };
}

/**
 * Render a sprite to a canvas context
 */
export function renderSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  sheet: SpriteSheet,
  destX: number,
  destY: number,
  scaleX: number = 1,
  scaleY: number = 1,
  rotation: number = 0
): void {
  if (!sheet.imageData) return;
  
  ctx.save();
  
  // Apply transformations
  ctx.translate(destX, destY);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  
  const width = sprite.width * scaleX;
  const height = sprite.height * scaleY;
  
  ctx.drawImage(
    sheet.imageData,
    sprite.x,
    sprite.y,
    sprite.width,
    sprite.height,
    -width / 2, // Center the sprite
    -height / 2,
    width,
    height
  );
  
  ctx.restore();
}

/**
 * Get sprite by ID from a collection of spritesheets
 */
export function getSpriteById(
  spriteId: string,
  spritesheets: SpriteSheet[]
): { sprite: Sprite; sheet: SpriteSheet } | null {
  for (const sheet of spritesheets) {
    const sprite = sheet.sprites.find(s => s.id === spriteId);
    if (sprite) {
      return { sprite, sheet };
    }
  }
  return null;
}

/**
 * Filter sprites by terrain type and/or category
 */
export function filterSprites(
  spritesheets: SpriteSheet[],
  terrainType?: TerrainType,
  category?: ObjectCategory
): Sprite[] {
  const allSprites = spritesheets.flatMap(sheet => sheet.sprites);
  
  return allSprites.filter(sprite => {
    const matchesTerrain = !terrainType || sprite.terrainType === terrainType || sprite.category === ObjectCategory.Universal;
    const matchesCategory = !category || sprite.category === category;
    return matchesTerrain && matchesCategory;
  });
}

/**
 * Create a thumbnail canvas for a sprite
 */
export function createSpriteThumbnail(
  sprite: Sprite,
  sheet: SpriteSheet,
  size: number = 64
): HTMLCanvasElement | null {
  if (!sheet.imageData) return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  // Calculate scale to fit within thumbnail
  const scale = Math.min(size / sprite.width, size / sprite.height);
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;
  
  // Clear background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, size, size);
  
  // Draw sprite
  ctx.drawImage(
    sheet.imageData,
    sprite.x,
    sprite.y,
    sprite.width,
    sprite.height,
    x,
    y,
    width,
    height
  );
  
  return canvas;
}

/**
 * Example: Create default spritesheets (placeholder until real assets are added)
 */
export async function createDefaultSpritesheets(): Promise<SpriteSheet[]> {
  // This would load real spritesheet images in production
  // For now, we'll create placeholder data structures
  
  const sheets: SpriteSheet[] = [];
  
  // Note: In production, replace these with actual asset paths
  // Example: '/assets/spritesheets/forest-objects.png'
  
  return sheets;
}

/**
 * Generate a placeholder sprite image (for development/testing)
 */
export function generatePlaceholderSprite(
  width: number,
  height: number,
  color: string,
  label: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Draw colored rectangle
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // Draw label
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, width / 2, height / 2);
  }
  
  return canvas;
}
