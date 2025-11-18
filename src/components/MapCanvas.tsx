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
      drawForest(terrainCtx, mapData, cellSize, showTrees);
    } else if (mapData.terrainType === TerrainType.Cave) {
      drawCave(terrainCtx, mapData, cellSize);
    } else if (mapData.terrainType === TerrainType.House || mapData.terrainType === TerrainType.Dungeon) {
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
    [TerrainType.Forest]: '#1a3a1a',
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
  if (!showTrees || !mapData.trees) return;

  for (const tree of mapData.trees) {
    const x = tree.x * cellSize;
    const y = tree.y * cellSize;
    const size = (tree.size || 1) * cellSize;

    // Tree colors based on size
    const colors = ['#2d5016', '#3d6e1f', '#4d8f2a'];
    const colorIndex = Math.min(tree.size || 1, colors.length) - 1;

    ctx.fillStyle = colors[colorIndex];
    
    // Draw tree with slight organic variation
    ctx.fillRect(x, y, size, size);
    
    // Add highlight
    ctx.fillStyle = 'rgba(80, 180, 50, 0.3)';
    ctx.fillRect(x, y, size / 2, size / 2);
  }
}

function drawCave(
  ctx: CanvasRenderingContext2D,
  mapData: MapData,
  cellSize: number
) {
  if (!mapData.grid) return;

  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const cell = mapData.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell === 0) {
        // Floor - cave floor color
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add slight variation
        if (Math.random() > 0.7) {
          ctx.fillStyle = 'rgba(90, 90, 110, 0.3)';
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      } else {
        // Wall - rock wall color
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add organic edge roughening
        if (hasFloorNeighbor(mapData.grid, x, y)) {
          ctx.fillStyle = '#3a3a4a';
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

  const isHouse = mapData.terrainType === TerrainType.House;

  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const cell = mapData.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell === 0) {
        // Floor
        if (showRooms || showCorridors) {
          ctx.fillStyle = isHouse ? '#d4c4a8' : '#6a6a6a';
          ctx.fillRect(px, py, cellSize, cellSize);
          
          // Add texture variation
          if (Math.random() > 0.8) {
            ctx.fillStyle = isHouse ? 'rgba(220, 200, 180, 0.5)' : 'rgba(100, 100, 100, 0.3)';
            ctx.fillRect(px, py, cellSize, cellSize);
          }
        }
      } else {
        // Wall
        ctx.fillStyle = isHouse ? '#8b7355' : '#3a3a3a';
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add depth to walls
        if (hasFloorNeighbor(mapData.grid, x, y)) {
          ctx.fillStyle = isHouse ? '#6d5a45' : '#2a2a2a';
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }

  // Draw room outlines
  if (showRooms && mapData.rooms) {
    ctx.strokeStyle = isHouse ? 'rgba(139, 115, 85, 0.8)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    for (const room of mapData.rooms) {
      ctx.strokeRect(
        room.x * cellSize,
        room.y * cellSize,
        room.width * cellSize,
        room.height * cellSize
      );
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
