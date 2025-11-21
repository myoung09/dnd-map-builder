/**
 * Simplified sprite palette - extracts all non-blank sprites from each sheet
 * This approach auto-detects sprites and filters out blanks
 */

import { Palette, Sprite, SpriteCategory, Spritesheet } from '../types/palette';

export const SIMPLE_CATEGORIES: SpriteCategory[] = [
  { id: 'characters', name: 'Characters (rogues.png)', color: '#2196f3', order: 0 },
  { id: 'monsters', name: 'Monsters (monsters.png)', color: '#f44336', order: 1 },
  { id: 'animals', name: 'Animals (animals.png)', color: '#4caf50', order: 2 },
  { id: 'items', name: 'Items & Equipment (items.png)', color: '#ff9800', order: 3 },
  { id: 'environment', name: 'Environment (animated-tiles.png)', color: '#009688', order: 4 },
];

/**
 * Check if a sprite tile is blank (all transparent or all one color)
 */
function isSpriteBlank(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  let totalAlpha = 0;
  let pixelCount = 0;
  
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      const index = (py * imageData.width + px) * 4;
      const alpha = imageData.data[index + 3];
      totalAlpha += alpha;
      pixelCount++;
    }
  }
  
  // If average alpha is very low, consider it blank
  const avgAlpha = totalAlpha / pixelCount;
  return avgAlpha < 10; // Less than ~4% opacity = blank
}

/**
 * Extract all non-blank sprites from a sprite sheet
 */
export function extractSpritesFromSheet(
  imageData: string,
  sheetId: string,
  categoryId: string,
  spriteWidth: number = 32,
  spriteHeight: number = 32
): Promise<Sprite[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      
      const sprites: Sprite[] = [];
      const columns = Math.floor(img.width / spriteWidth);
      const rows = Math.floor(img.height / spriteHeight);
      
      let spriteIndex = 0;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const x = col * spriteWidth;
          const y = row * spriteHeight;
          
          // Check if this sprite is blank
          if (!isSpriteBlank(imgData, x, y, spriteWidth, spriteHeight)) {
            // Extract sprite
            const spriteCanvas = document.createElement('canvas');
            spriteCanvas.width = spriteWidth;
            spriteCanvas.height = spriteHeight;
            const spriteCtx = spriteCanvas.getContext('2d');
            
            if (spriteCtx) {
              spriteCtx.drawImage(
                img,
                x, y, spriteWidth, spriteHeight,
                0, 0, spriteWidth, spriteHeight
              );
              
              sprites.push({
                id: `${sheetId}_${spriteIndex}`,
                name: `${categoryId} ${spriteIndex + 1}`,
                x,
                y,
                width: spriteWidth,
                height: spriteHeight,
                imageData: spriteCanvas.toDataURL('image/png'),
                category: categoryId,
                tags: [categoryId],
                sheetId,
              });
              
              spriteIndex++;
            }
          }
        }
      }
      
      console.log(`[SimplePalette] Extracted ${sprites.length} non-blank sprites from ${sheetId}`);
      resolve(sprites);
    };
    
    img.onerror = reject;
    img.src = imageData;
  });
}

/**
 * Create a simple palette by auto-detecting sprites from all sheets
 */
export async function createSimplePalette(
  roguesImg: string,
  monstersImg: string,
  animalsImg: string,
  itemsImg: string,
  animatedTilesImg: string
): Promise<Palette> {
  console.log('[SimplePalette] Starting sprite extraction...');
  
  // Load and convert all images
  const imageToBase64 = (imgSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };
  
  const [roguesData, monstersData, animalsData, itemsData, tilesData] = await Promise.all([
    imageToBase64(roguesImg),
    imageToBase64(monstersImg),
    imageToBase64(animalsImg),
    imageToBase64(itemsImg),
    imageToBase64(animatedTilesImg),
  ]);
  
  // Extract sprites from each sheet
  const [
    characterSprites,
    monsterSprites,
    animalSprites,
    itemSprites,
    envSprites,
  ] = await Promise.all([
    extractSpritesFromSheet(roguesData, 'rogues', 'characters'),
    extractSpritesFromSheet(monstersData, 'monsters', 'monsters'),
    extractSpritesFromSheet(animalsData, 'animals', 'animals'),
    extractSpritesFromSheet(itemsData, 'items', 'items'),
    extractSpritesFromSheet(tilesData, 'animated-tiles', 'environment'),
  ]);
  
  // Create spritesheets metadata
  const spritesheets: Spritesheet[] = [
    {
      id: 'rogues',
      name: 'Character Sprites',
      imageData: roguesData,
      spriteWidth: 32,
      spriteHeight: 32,
      columns: 8,
      rows: 8,
      totalSprites: characterSprites.length,
      uploadedAt: new Date(),
    },
    {
      id: 'monsters',
      name: 'Monster Sprites',
      imageData: monstersData,
      spriteWidth: 32,
      spriteHeight: 32,
      columns: 10,
      rows: 15,
      totalSprites: monsterSprites.length,
      uploadedAt: new Date(),
    },
    {
      id: 'animals',
      name: 'Animal Sprites',
      imageData: animalsData,
      spriteWidth: 32,
      spriteHeight: 32,
      columns: 8,
      rows: 20,
      totalSprites: animalSprites.length,
      uploadedAt: new Date(),
    },
    {
      id: 'items',
      name: 'Items and Equipment',
      imageData: itemsData,
      spriteWidth: 32,
      spriteHeight: 32,
      columns: 12,
      rows: 30,
      totalSprites: itemSprites.length,
      uploadedAt: new Date(),
    },
    {
      id: 'animated-tiles',
      name: 'Environment Objects',
      imageData: tilesData,
      spriteWidth: 32,
      spriteHeight: 32,
      columns: 12,
      rows: 3,
      totalSprites: envSprites.length,
      uploadedAt: new Date(),
    },
  ];
  
  const allSprites = [
    ...characterSprites,
    ...monsterSprites,
    ...animalSprites,
    ...itemSprites,
    ...envSprites,
  ];
  
  console.log(`[SimplePalette] Total sprites extracted: ${allSprites.length}`);
  
  return {
    id: 'simple-32rogues',
    name: '32Rogues Sprite Pack',
    spritesheets,
    sprites: allSprites,
    categories: SIMPLE_CATEGORIES,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };
}
