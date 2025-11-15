import { v4 as uuidv4 } from 'uuid';
import {
  DnDMap,
  MapLayer,
  MapTile,
  MapObject,
  MapMetadata,
  GridConfig,
  LayerType,
  TerrainType,
  Position,
  Size,
  Color,
  MapExportData,
  AssetReference
} from '../types/map';

// Default colors for different terrain types
export const DEFAULT_TERRAIN_COLORS: Record<TerrainType, Color> = {
  [TerrainType.WALL]: { r: 64, g: 64, b: 64 },
  [TerrainType.FLOOR]: { r: 139, g: 126, b: 102 },
  [TerrainType.DOOR]: { r: 101, g: 67, b: 33 },
  [TerrainType.WATER]: { r: 65, g: 105, b: 225 },
  [TerrainType.GRASS]: { r: 34, g: 139, b: 34 },
  [TerrainType.STONE]: { r: 105, g: 105, b: 105 },
  [TerrainType.DIRT]: { r: 139, g: 90, b: 43 },
  [TerrainType.SAND]: { r: 238, g: 203, b: 173 },
  [TerrainType.LAVA]: { r: 255, g: 69, b: 0 },
  [TerrainType.ICE]: { r: 176, g: 224, b: 230 },
  [TerrainType.WOOD]: { r: 160, g: 82, b: 45 },
  [TerrainType.METAL]: { r: 192, g: 192, b: 192 },
  [TerrainType.TRAP]: { r: 255, g: 20, b: 147 },
  [TerrainType.DIFFICULT_TERRAIN]: { r: 255, g: 140, b: 0 },
  [TerrainType.IMPASSABLE]: { r: 25, g: 25, b: 25 }
};

// Create a new empty map
export function createNewMap(name: string, dimensions: Size): DnDMap {
  const mapId = uuidv4();
  
  const metadata: MapMetadata = {
    id: mapId,
    name,
    author: 'DnD Map Builder User',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    tags: [],
    isPublic: false,
    generationHistory: []
  };

  const gridConfig: GridConfig = {
    cellSize: 32,
    showGrid: true,
    gridColor: { r: 128, g: 128, b: 128, a: 0.5 },
    snapToGrid: true,
    gridType: 'square'
  };

  // Create default layers
  const layers: MapLayer[] = [
    {
      id: uuidv4(),
      name: 'Background',
      type: LayerType.BACKGROUND,
      isVisible: true,
      isLocked: false,
      opacity: 1,
      tiles: [],
      objects: []
    },
    {
      id: uuidv4(),
      name: 'Terrain',
      type: LayerType.TERRAIN,
      isVisible: true,
      isLocked: false,
      opacity: 1,
      tiles: initializeEmptyTiles(dimensions),
      objects: []
    },
    {
      id: uuidv4(),
      name: 'Objects',
      type: LayerType.OBJECTS,
      isVisible: true,
      isLocked: false,
      opacity: 1,
      tiles: [],
      objects: []
    },
    {
      id: uuidv4(),
      name: 'Overlay',
      type: LayerType.OVERLAY,
      isVisible: true,
      isLocked: false,
      opacity: 0.8,
      tiles: [],
      objects: []
    }
  ];

  return {
    metadata,
    dimensions,
    gridConfig,
    layers,
    backgroundColor: { r: 34, g: 34, b: 34 }
  };
}

// Initialize empty tiles for a layer
function initializeEmptyTiles(dimensions: Size): MapTile[] {
  const tiles: MapTile[] = [];
  
  for (let x = 0; x < dimensions.width; x++) {
    for (let y = 0; y < dimensions.height; y++) {
      tiles.push({
        id: uuidv4(),
        position: { x, y },
        terrainType: TerrainType.FLOOR,
        color: DEFAULT_TERRAIN_COLORS[TerrainType.FLOOR],
        isVisible: true,
        isExplored: true
      });
    }
  }
  
  return tiles;
}

// Get tile at specific position
export function getTileAt(map: DnDMap, layerId: string, position: Position): MapTile | undefined {
  const layer = map.layers.find(l => l.id === layerId);
  if (!layer || !layer.tiles) return undefined;
  
  return layer.tiles.find(tile => 
    tile.position.x === position.x && tile.position.y === position.y
  );
}

// Set terrain type for a tile
export function setTileTerrainType(
  map: DnDMap, 
  layerId: string, 
  position: Position, 
  terrainType: TerrainType
): DnDMap {
  const newMap = { ...map };
  const layer = newMap.layers.find(l => l.id === layerId);
  
  if (!layer || !layer.tiles) return map;
  
  const tileIndex = layer.tiles.findIndex(tile => 
    tile.position.x === position.x && tile.position.y === position.y
  );
  
  if (tileIndex === -1) return map;
  
  layer.tiles[tileIndex] = {
    ...layer.tiles[tileIndex],
    terrainType,
    color: DEFAULT_TERRAIN_COLORS[terrainType]
  };
  
  return newMap;
}

// Add object to map
export function addObjectToMap(map: DnDMap, layerId: string, object: MapObject): DnDMap {
  const newMap = { ...map };
  const layer = newMap.layers.find(l => l.id === layerId);
  
  if (!layer) return map;
  
  if (!layer.objects) {
    layer.objects = [];
  }
  
  layer.objects.push({ ...object });
  
  return newMap;
}

// Remove object from map
export function removeObjectFromMap(map: DnDMap, objectId: string): DnDMap {
  const newMap = { ...map };
  
  newMap.layers.forEach(layer => {
    if (layer.objects) {
      layer.objects = layer.objects.filter(obj => obj.id !== objectId);
    }
  });
  
  return newMap;
}

// Get layer by type
export function getLayerByType(map: DnDMap, layerType: LayerType): MapLayer | undefined {
  return map.layers.find(layer => layer.type === layerType);
}

// Convert grid position to pixel position
export function gridToPixel(gridPos: Position, cellSize: number): Position {
  return {
    x: gridPos.x * cellSize,
    y: gridPos.y * cellSize
  };
}

// Convert pixel position to grid position
export function pixelToGrid(pixelPos: Position, cellSize: number): Position {
  return {
    x: Math.floor(pixelPos.x / cellSize),
    y: Math.floor(pixelPos.y / cellSize)
  };
}

// Check if position is within map bounds
export function isPositionValid(position: Position, dimensions: Size): boolean {
  return position.x >= 0 && 
         position.x < dimensions.width && 
         position.y >= 0 && 
         position.y < dimensions.height;
}

// Export map to JSON
export function exportMapToJSON(map: DnDMap, includeAssets: boolean = false): string {
  const exportData: MapExportData = {
    formatVersion: '1.0.0',
    exportedAt: new Date(),
    map: {
      ...map,
      metadata: {
        ...map.metadata,
        updatedAt: new Date()
      }
    }
  };

  // TODO: Add asset collection if includeAssets is true
  if (includeAssets) {
    exportData.assets = [];
  }

  return JSON.stringify(exportData, null, 2);
}

// Import map from JSON
export function importMapFromJSON(jsonString: string): DnDMap {
  try {
    const exportData: MapExportData = JSON.parse(jsonString);
    
    // Validate format version compatibility
    if (!exportData.formatVersion || exportData.formatVersion !== '1.0.0') {
      throw new Error('Unsupported map format version');
    }
    
    // Convert date strings back to Date objects
    if (exportData.map.metadata.createdAt) {
      exportData.map.metadata.createdAt = new Date(exportData.map.metadata.createdAt);
    }
    if (exportData.map.metadata.updatedAt) {
      exportData.map.metadata.updatedAt = new Date(exportData.map.metadata.updatedAt);
    }
    
    return exportData.map;
  } catch (error) {
    throw new Error(`Failed to import map: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Calculate map bounds in pixels
export function calculateMapBounds(map: DnDMap): Size {
  return {
    width: map.dimensions.width * map.gridConfig.cellSize,
    height: map.dimensions.height * map.gridConfig.cellSize
  };
}

// Create a deep copy of the map (for undo/redo functionality)
export function cloneMap(map: DnDMap): DnDMap {
  return JSON.parse(JSON.stringify(map));
}

// Validate map data integrity
export function validateMap(map: DnDMap): string[] {
  const errors: string[] = [];
  
  if (!map.metadata || !map.metadata.id) {
    errors.push('Map must have valid metadata with ID');
  }
  
  if (!map.dimensions || map.dimensions.width <= 0 || map.dimensions.height <= 0) {
    errors.push('Map must have valid dimensions');
  }
  
  if (!map.layers || map.layers.length === 0) {
    errors.push('Map must have at least one layer');
  }
  
  // Check for duplicate layer IDs
  const layerIds = map.layers.map(l => l.id);
  if (new Set(layerIds).size !== layerIds.length) {
    errors.push('Map layers must have unique IDs');
  }
  
  return errors;
}