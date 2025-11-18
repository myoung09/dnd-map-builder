// MapCanvas Component with layered rendering

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MapData, TerrainType } from '../types/generator';

interface MapCanvasProps {
  mapData: MapData | null;
  cellSize?: number;
  showGrid?: boolean;
  showRooms?: boolean;
  showCorridors?: boolean;
  showTrees?: boolean;
}

export interface MapCanvasRef {
  exportToPNG: () => string;
}

export const MapCanvas = forwardRef<MapCanvasRef, MapCanvasProps>(({
  mapData,
  cellSize = 4,
  showGrid = true,
  showRooms = true,
  showCorridors = true,
  showTrees = true
}, ref) => {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Expose export function
  useImperativeHandle(ref, () => ({
    exportToPNG: () => {
      if (!terrainCanvasRef.current) return '';
      return terrainCanvasRef.current.toDataURL('image/png');
    }
  }));

  useEffect(() => {
    if (!mapData) return;

    const backgroundCanvas = backgroundCanvasRef.current;
    const terrainCanvas = terrainCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!backgroundCanvas || !terrainCanvas || !overlayCanvas) return;

    const width = mapData.width * cellSize;
    const height = mapData.height * cellSize;

    // Set canvas sizes
    [backgroundCanvas, terrainCanvas, overlayCanvas].forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
    });

    const bgCtx = backgroundCanvas.getContext('2d');
    const terrainCtx = terrainCanvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');

    if (!bgCtx || !terrainCtx || !overlayCtx) return;

    // Clear all layers
    bgCtx.clearRect(0, 0, width, height);
    terrainCtx.clearRect(0, 0, width, height);
    overlayCtx.clearRect(0, 0, width, height);

    // Draw background
    drawBackground(bgCtx, width, height, mapData.terrainType);

    // Draw grid
    if (showGrid) {
      drawGrid(overlayCtx, mapData.width, mapData.height, cellSize);
    }

    // Draw terrain based on type
    if (mapData.terrainType === TerrainType.Forest) {
      console.log(`[MapCanvas] Rendering Forest terrain`);
      drawForest(terrainCtx, mapData, cellSize, showTrees);
    } else if (mapData.terrainType === TerrainType.Cave) {
      console.log(`[MapCanvas] Rendering Cave terrain`);
      drawCave(terrainCtx, mapData, cellSize);
    } else if (mapData.terrainType === TerrainType.House || mapData.terrainType === TerrainType.Dungeon) {
      console.log(`[MapCanvas] Rendering House/Dungeon terrain`);
      drawDungeon(terrainCtx, mapData, cellSize, showRooms, showCorridors);
    }

  }, [mapData, cellSize, showGrid, showRooms, showCorridors, showTrees]);

  if (!mapData) {
    return (
      <div className="map-canvas-placeholder">
        <p>No map generated. Select terrain and click Generate.</p>
      </div>
    );
  }

  return (
    <div className="map-canvas-container">
      <div className="canvas-stack">
        <canvas ref={backgroundCanvasRef} className="canvas-layer" />
        <canvas ref={terrainCanvasRef} className="canvas-layer" />
        <canvas ref={overlayCanvasRef} className="canvas-layer" />
      </div>
    </div>
  );
});

MapCanvas.displayName = 'MapCanvas';

// Drawing functions

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  terrainType?: TerrainType
) {
  // Background color based on terrain
  const colors: Record<string, string> = {
    [TerrainType.House]: '#2c2c2c',
    [TerrainType.Forest]: '#d4c5a0', // Light brown/tan for forest floor (clearings)
    [TerrainType.Cave]: '#1a1a2e',
    [TerrainType.Dungeon]: '#1a1a1a'
  };

  ctx.fillStyle = colors[terrainType || TerrainType.Dungeon] || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  gridWidth: number,
  gridHeight: number,
  cellSize: number
) {
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= gridWidth; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, gridHeight * cellSize);
    ctx.stroke();
  }

  for (let y = 0; y <= gridHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(gridWidth * cellSize, y * cellSize);
    ctx.stroke();
  }
}

function drawForest(
  ctx: CanvasRenderingContext2D,
  mapData: MapData,
  cellSize: number,
  showTrees: boolean
) {
  console.log(`[drawForest] Called with showTrees=${showTrees}, trees count=${mapData.trees?.length || 0}`);
  console.log(`[drawForest] cellSize=${cellSize}`);
  
  if (!showTrees || !mapData.trees) {
    console.log(`[drawForest] Early return - showTrees=${showTrees}, has trees=${!!mapData.trees}`);
    return;
  }

  console.log(`[drawForest] Drawing ${mapData.trees.length} trees`);
  console.log(`[drawForest] Sample trees:`, mapData.trees.slice(0, 3));

  // Note: Background is already light brown (clearings) - we only draw trees
  for (const tree of mapData.trees) {
    // Calculate center position for circular rendering
    const centerX = tree.x * cellSize;
    const centerY = tree.y * cellSize;
    
    // Tree radius from stored size (already calculated in generator)
    const radius = (tree.size || 1.5) * cellSize;
    
    if (mapData.trees.indexOf(tree) === 0) {
      console.log(`[drawForest] First tree: pos=(${centerX}, ${centerY}), radius=${radius}`);
    }

    // Base tree color (darker green)
    ctx.fillStyle = '#2d5016';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle layer (medium green) - slightly smaller
    ctx.fillStyle = '#3d6e1f';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.75, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight layer (lighter green) - top-left for depth
    ctx.fillStyle = '#4d8f2a';
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.25,
      centerY - radius * 0.25,
      radius * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Subtle outline for better visibility against clearings
    ctx.strokeStyle = 'rgba(20, 40, 10, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCave(
  ctx: CanvasRenderingContext2D,
  mapData: MapData,
  cellSize: number
) {
  if (!mapData.grid) return;

  console.log(`[drawCave] Rendering ${mapData.width}x${mapData.height} cave with cellSize=${cellSize}`);

  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const cell = mapData.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell === 0) {
        // Open space - lighter cave floor color with slight variation
        // Use lighter grays/browns for open areas
        ctx.fillStyle = '#6a6a7a'; // Medium-light gray-blue for open space
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add texture variation to floor
        if (Math.random() > 0.7) {
          ctx.fillStyle = 'rgba(110, 110, 130, 0.4)';
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      } else {
        // Wall - darker rock wall color
        // Use very dark colors for walls to create strong contrast
        ctx.fillStyle = '#1a1a2a'; // Very dark blue-black for walls
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add organic edge roughening for walls adjacent to open space
        if (hasFloorNeighbor(mapData.grid, x, y)) {
          ctx.fillStyle = '#2a2a3a'; // Slightly lighter dark for edge variation
          const offset = Math.random() * cellSize * 0.3;
          ctx.fillRect(px, py, cellSize - offset, cellSize - offset);
        }
      }
    }
  }
}

function drawDungeon(
  ctx: CanvasRenderingContext2D,
  mapData: MapData,
  cellSize: number,
  showRooms: boolean,
  showCorridors: boolean
) {
  if (!mapData.grid) return;

  console.log(`[drawDungeon] Rendering ${mapData.width}x${mapData.height} dungeon with ${mapData.rooms?.length || 0} rooms`);

  const isHouse = mapData.terrainType === TerrainType.House;

  // Draw grid-based terrain (rooms and corridors)
  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const cell = mapData.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell === 0) {
        // Floor - determine if room or corridor
        let isInRoom = false;
        if (mapData.rooms) {
          for (const room of mapData.rooms) {
            if (x >= room.x && x < room.x + room.width &&
                y >= room.y && y < room.y + room.height) {
              isInRoom = true;
              break;
            }
          }
        }

        // Draw floor with different colors for rooms vs corridors
        if (showRooms || showCorridors) {
          if (isInRoom) {
            // Room floor - lighter, more prominent
            ctx.fillStyle = isHouse ? '#d4c4a8' : '#7a7a7a';
          } else {
            // Corridor floor - slightly darker for contrast
            ctx.fillStyle = isHouse ? '#c4b498' : '#6a6a6a';
          }
          ctx.fillRect(px, py, cellSize, cellSize);
          
          // Add texture variation
          if (Math.random() > 0.8) {
            ctx.fillStyle = isInRoom 
              ? (isHouse ? 'rgba(220, 200, 180, 0.5)' : 'rgba(130, 130, 130, 0.4)')
              : (isHouse ? 'rgba(200, 180, 160, 0.5)' : 'rgba(100, 100, 100, 0.3)');
            ctx.fillRect(px, py, cellSize, cellSize);
          }
        }
      } else {
        // Wall - darker for strong contrast
        ctx.fillStyle = isHouse ? '#8b7355' : '#2a2a2a';
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add depth to walls adjacent to floors
        if (hasFloorNeighbor(mapData.grid, x, y)) {
          ctx.fillStyle = isHouse ? '#6d5a45' : '#1a1a1a';
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }

  // Draw room rectangles with outlines for clarity
  if (showRooms && mapData.rooms) {
    ctx.strokeStyle = isHouse ? 'rgba(139, 115, 85, 0.6)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    for (const room of mapData.rooms) {
      ctx.strokeRect(
        room.x * cellSize,
        room.y * cellSize,
        room.width * cellSize,
        room.height * cellSize
      );
    }
  }

  // Draw corridor paths for visualization
  if (showCorridors && mapData.corridors) {
    ctx.strokeStyle = isHouse ? 'rgba(160, 140, 120, 0.4)' : 'rgba(100, 150, 200, 0.3)';
    ctx.lineWidth = Math.max(1, cellSize / 3);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const corridor of mapData.corridors) {
      ctx.beginPath();
      ctx.moveTo(
        corridor.start[0] * cellSize + cellSize / 2,
        corridor.start[1] * cellSize + cellSize / 2
      );
      ctx.lineTo(
        corridor.end[0] * cellSize + cellSize / 2,
        corridor.end[1] * cellSize + cellSize / 2
      );
      ctx.stroke();
    }
  }
}

function hasFloorNeighbor(grid: number[][], x: number, y: number): boolean {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
      if (grid[ny][nx] === 0) return true;
    }
  }
  return false;
}
