/**
 * Utility functions for spritesheet slicing and sprite management
 */

import { Sprite, Spritesheet } from '../types/palette';

/**
 * Slice a spritesheet into individual sprites
 */
export async function sliceSpritesheet(
  imageFile: File,
  spriteWidth: number,
  spriteHeight: number,
  sheetName: string
): Promise<{ spritesheet: Spritesheet; sprites: Sprite[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate grid
          const columns = Math.floor(img.width / spriteWidth);
          const rows = Math.floor(img.height / spriteHeight);
          const totalSprites = columns * rows;

          console.log(`[SpriteUtils] Slicing ${sheetName}: ${columns}x${rows} = ${totalSprites} sprites`);

          // Create spritesheet metadata
          const spritesheet: Spritesheet = {
            id: `spritesheet_${Date.now()}`,
            name: sheetName,
            imageData: e.target?.result as string,
            spriteWidth,
            spriteHeight,
            columns,
            rows,
            totalSprites,
            uploadedAt: new Date(),
          };

          // Slice into individual sprites
          const sprites: Sprite[] = [];
          let spriteIndex = 0;

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              const x = col * spriteWidth;
              const y = row * spriteHeight;

              // Extract sprite
              canvas.width = spriteWidth;
              canvas.height = spriteHeight;
              ctx.clearRect(0, 0, spriteWidth, spriteHeight);
              ctx.drawImage(
                img,
                x, y, spriteWidth, spriteHeight,
                0, 0, spriteWidth, spriteHeight
              );

              // Convert to base64
              const imageData = canvas.toDataURL('image/png');

              const sprite: Sprite = {
                id: `sprite_${Date.now()}_${spriteIndex}`,
                name: `${sheetName}_${spriteIndex}`,
                x,
                y,
                width: spriteWidth,
                height: spriteHeight,
                imageData,
                category: 'general', // Default to general category
                tags: [],
              };

              sprites.push(sprite);
              spriteIndex++;
            }
          }

          console.log(`[SpriteUtils] Successfully sliced ${sprites.length} sprites`);
          resolve({ spritesheet, sprites });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(imageFile);
  });
}

/**
 * Draw a preview of how the spritesheet will be sliced
 */
export function drawSpritesheetPreview(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  spriteWidth: number,
  spriteHeight: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size to match image
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw the image
  ctx.drawImage(image, 0, 0);

  // Draw grid overlay
  const columns = Math.floor(image.width / spriteWidth);
  const rows = Math.floor(image.height / spriteHeight);

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  // Draw vertical lines
  for (let col = 0; col <= columns; col++) {
    const x = col * spriteWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rows * spriteHeight);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let row = 0; row <= rows; row++) {
    const y = row * spriteHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(columns * spriteWidth, y);
    ctx.stroke();
  }

  // Draw info text
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, 10, 200, 60);
  ctx.fillStyle = '#00ff00';
  ctx.font = '14px monospace';
  ctx.fillText(`Grid: ${columns} x ${rows}`, 20, 30);
  ctx.fillText(`Sprites: ${columns * rows}`, 20, 50);
  ctx.fillText(`Size: ${spriteWidth}x${spriteHeight}px`, 20, 70);
}

/**
 * Scale sprite to fit grid cell
 */
export function calculateSpriteScale(
  spriteWidth: number,
  spriteHeight: number,
  cellSize: number,
  maxCells: number = 2
): number {
  const targetSize = cellSize * maxCells;
  const scale = Math.min(
    targetSize / spriteWidth,
    targetSize / spriteHeight
  );
  return scale;
}

/**
 * Convert image file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
