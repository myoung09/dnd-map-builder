// MapCanvas Component with layered rendering, organic edge roughening, and export controls

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { MapData, TerrainType } from '../types/generator';
import { ExportUtils } from '../utils/export';
import { PerlinNoise } from '../utils/noise';

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

// Terrain color palette - distinct colors for each element type
const TERRAIN_COLORS = {
  // Rooms/Buildings - warm brown tones
  room: '#8b7355',
  roomStroke: '#6a5a45',
  
  // Corridors - neutral gray
  corridor: '#6a6a6a',
  corridorStroke: '#5a5a5a',
  
  // Trees - dark forest green
  tree: '#2d5016',
  treeStroke: '#1f3810',
  
  // Cave walls - very dark blue-black
  wall: '#1a1a2a',
  wallEdge: '#2a2a3a',
  
  // Cave floors - medium light gray
  floor: '#6a6a7a',
  floorVariation: 'rgba(110, 110, 130, 0.4)',
  
  // Background colors by terrain type
  background: {
    forest: '#e8f5e9',
    cave: '#1a1a1a',
    dungeon: '#2a2a2a',
    house: '#f5f5dc'
  }
};

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
  const [showExportButtons, setShowExportButtons] = useState(true);

  // Perlin noise instance for edge roughening (seeded for consistency)
  const noiseRef = useRef<PerlinNoise>(new PerlinNoise(12345));

  // Expose export function
  useImperativeHandle(ref, () => ({
    exportToPNG: () => {
      if (!terrainCanvasRef.current) return '';
      return terrainCanvasRef.current.toDataURL('image/png');
    }
  }));

  // Handle PNG export
  const handleExportPNG = () => {
    if (!mapData || !terrainCanvasRef.current) return;
    const dataUrl = terrainCanvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `map-${mapData.terrainType}-${mapData.seed || 'unknown'}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Handle JSON export
  const handleExportJSON = () => {
    if (!mapData) return;
    ExportUtils.exportMapToJSON(mapData, `map-${mapData.terrainType}-${mapData.seed || 'unknown'}.json`);
  };

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

    // Draw terrain based on type (pass noise instance for edge roughening)
    if (mapData.terrainType === TerrainType.Forest) {
      console.log(`[MapCanvas] Rendering Forest terrain`);
      drawForest(terrainCtx, mapData, cellSize, showTrees, noiseRef.current);
    } else if (mapData.terrainType === TerrainType.Cave) {
      console.log(`[MapCanvas] Rendering Cave terrain`);
      drawCave(terrainCtx, mapData, cellSize, noiseRef.current);
    } else if (mapData.terrainType === TerrainType.House || mapData.terrainType === TerrainType.Dungeon) {
      console.log(`[MapCanvas] Rendering House/Dungeon terrain`);
      drawDungeon(terrainCtx, mapData, cellSize, showRooms, showCorridors, noiseRef.current);
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
      
      {/* Export controls overlay */}
      {showExportButtons && (
        <div className="export-controls" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '8px',
          zIndex: 10
        }}>
          <button 
            onClick={handleExportPNG}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            📷 Export PNG
          </button>
          <button 
            onClick={handleExportJSON}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0b7dda'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
          >
            💾 Export JSON
          </button>
          <button 
            onClick={() => setShowExportButtons(false)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#da190b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Show export controls button when hidden */}
      {!showExportButtons && (
        <button
          onClick={() => setShowExportButtons(true)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '8px 12px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          📤
        </button>
      )}
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
  // Background color based on terrain - use TERRAIN_COLORS
  const colors: Record<string, string> = {
    [TerrainType.House]: TERRAIN_COLORS.background.house,
    [TerrainType.Forest]: TERRAIN_COLORS.background.forest,
    [TerrainType.Cave]: TERRAIN_COLORS.background.cave,
    [TerrainType.Dungeon]: TERRAIN_COLORS.background.dungeon
  };

  ctx.fillStyle = colors[terrainType || TerrainType.Dungeon] || TERRAIN_COLORS.background.dungeon;
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
  showTrees: boolean,
  noise: PerlinNoise
) {
  console.log(`[drawForest] Called with showTrees=${showTrees}, trees count=${mapData.trees?.length || 0}`);
  console.log(`[drawForest] cellSize=${cellSize}`);
  
  if (!showTrees || !mapData.trees) {
    console.log(`[drawForest] Early return - showTrees=${showTrees}, has trees=${!!mapData.trees}`);
    return;
  }

  console.log(`[drawForest] Drawing ${mapData.trees.length} trees`);
  console.log(`[drawForest] Sample trees:`, mapData.trees.slice(0, 3));

  // Note: Background is already light green (clearings) - we only draw trees
  for (const tree of mapData.trees) {
    // Calculate center position for circular rendering
    const centerX = tree.x * cellSize;
    const centerY = tree.y * cellSize;
    
    // Tree radius from stored size (already calculated in generator)
    const baseRadius = (tree.size || 1.5) * cellSize;
    
    // Apply noise-based variation for organic tree shapes
    const noiseValue = noise.octaveNoise(tree.x * 0.1, tree.y * 0.1, 2, 0.5);
    const radius = baseRadius * (1 + noiseValue * 0.15);
    
    if (mapData.trees.indexOf(tree) === 0) {
      console.log(`[drawForest] First tree: pos=(${centerX}, ${centerY}), radius=${radius}`);
    }

    // Base tree color (dark forest green from palette)
    ctx.fillStyle = TERRAIN_COLORS.tree;
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

    // Subtle outline from palette
    ctx.strokeStyle = TERRAIN_COLORS.treeStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCave(
  ctx: CanvasRenderingContext2D,
  mapData: MapData,
  cellSize: number,
  noise: PerlinNoise
) {
  if (!mapData.grid) return;

  console.log(`[drawCave] Rendering ${mapData.width}x${mapData.height} cave with cellSize=${cellSize}`);

  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const cell = mapData.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell === 0) {
        // Open space - cave floor from palette
        ctx.fillStyle = TERRAIN_COLORS.floor;
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add texture variation to floor
        if (Math.random() > 0.7) {
          ctx.fillStyle = TERRAIN_COLORS.floorVariation;
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      } else {
        // Wall - dark rock wall from palette
        ctx.fillStyle = TERRAIN_COLORS.wall;
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add organic edge roughening for walls adjacent to open space
        if (hasFloorNeighbor(mapData.grid, x, y)) {
          ctx.fillStyle = TERRAIN_COLORS.wallEdge;
          // Use noise for organic edge variation
          const roughness = noise.octaveNoise(x * 0.3, y * 0.3, 2, 0.5);
          const offset = Math.abs(roughness) * cellSize * 0.4;
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
  showCorridors: boolean,
  noise: PerlinNoise
) {
  if (!mapData.grid) return;

  console.log(`[drawDungeon] Rendering ${mapData.width}x${mapData.height} dungeon with ${mapData.rooms?.length || 0} rooms`);

  const isHouse = mapData.terrainType === TerrainType.House;

  // Draw grid-based terrain (rooms and corridors) with organic edge roughening
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

        // Draw floor with different colors for rooms vs corridors using palette
        if (showRooms || showCorridors) {
          if (isInRoom) {
            // Room floor - use room color from palette
            ctx.fillStyle = isHouse ? TERRAIN_COLORS.room : '#7a7a7a';
          } else {
            // Corridor floor - use corridor color from palette
            ctx.fillStyle = isHouse ? '#c4b498' : TERRAIN_COLORS.corridor;
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
        // Wall - darker for strong contrast with organic roughening
        ctx.fillStyle = isHouse ? TERRAIN_COLORS.roomStroke : TERRAIN_COLORS.wall;
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Add depth and organic variation to walls adjacent to floors
        if (hasFloorNeighbor(mapData.grid, x, y)) {
          ctx.fillStyle = isHouse ? '#6d5a45' : TERRAIN_COLORS.wallEdge;
          // Apply noise-based organic edge roughening
          const roughness = noise.octaveNoise(x * 0.2, y * 0.2, 2, 0.5);
          const offset = Math.abs(roughness) * cellSize * 0.25;
          ctx.fillRect(px + offset, py + offset, cellSize - offset * 2, cellSize - offset * 2);
        }
      }
    }
  }

  // Draw room rectangles with outlines for clarity
  if (showRooms && mapData.rooms) {
    ctx.strokeStyle = isHouse ? TERRAIN_COLORS.roomStroke : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    for (const room of mapData.rooms) {
      // Apply subtle noise-based variation to room outlines for organic feel
      const noiseOffset = noise.octaveNoise(room.x * 0.1, room.y * 0.1, 1, 0.5);
      const lineVariation = 1 + noiseOffset * 0.2;
      ctx.lineWidth = 2 * lineVariation;
      
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
    ctx.strokeStyle = isHouse ? 'rgba(160, 140, 120, 0.4)' : TERRAIN_COLORS.corridorStroke;
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
