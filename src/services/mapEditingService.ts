import { DnDMap, MapObject, Position, TerrainType, ObjectType, Color } from '../types/map';
import { DEFAULT_TERRAIN_COLORS } from '../utils/mapUtils';

// Action types for undo/redo system
export interface EditAction {
  id: string;
  type: 'terrain_paint' | 'object_place' | 'object_move' | 'object_delete' | 'bulk_terrain';
  timestamp: Date;
  data: any;
  inverse: any; // Data needed to undo the action
}

export interface BrushOptions {
  size: number;
  shape: 'square' | 'circle';
  opacity: number;
}

export interface PaintOptions {
  terrainType: TerrainType;
  color?: Color;
  brushOptions: BrushOptions;
}

export interface ObjectPlacementOptions {
  objectType: ObjectType;
  size: { width: number; height: number };
  name: string;
  color?: Color;
}

class MapEditingService {
  private undoStack: EditAction[] = [];
  private redoStack: EditAction[] = [];
  private maxUndoHistory = 50;

  // Get affected tiles based on brush size and shape
  getAffectedTiles(centerPosition: Position, brushOptions: BrushOptions): Position[] {
    const { size, shape } = brushOptions;
    const tiles: Position[] = [];
    const radius = Math.floor(size / 2);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = centerPosition.x + dx;
        const y = centerPosition.y + dy;

        if (shape === 'circle') {
          // Only include tiles within circular brush
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            tiles.push({ x, y });
          }
        } else {
          // Square brush - include all tiles in square
          tiles.push({ x, y });
        }
      }
    }

    return tiles;
  }

  // Paint terrain on the map
  paintTerrain(
    map: DnDMap, 
    position: Position, 
    options: PaintOptions,
    targetLayerId?: string
  ): { success: boolean; updatedMap: DnDMap; action?: EditAction } {
    // Find target layer - use specified layer or first terrain layer
    const terrainLayer = targetLayerId 
      ? map.layers.find(layer => layer.id === targetLayerId && layer.type === 'terrain')
      : map.layers.find(layer => layer.type === 'terrain');
      
    if (!terrainLayer || !terrainLayer.tiles || terrainLayer.isLocked) {
      return { success: false, updatedMap: map };
    }

    const affectedTiles = this.getAffectedTiles(position, options.brushOptions);
    const validTiles = affectedTiles.filter(pos => 
      pos.x >= 0 && pos.x < map.dimensions.width && 
      pos.y >= 0 && pos.y < map.dimensions.height
    );

    if (validTiles.length === 0) {
      return { success: false, updatedMap: map };
    }

    // Store original state for undo
    const originalTiles = validTiles.map(pos => {
      const tile = terrainLayer.tiles!.find(t => t.position.x === pos.x && t.position.y === pos.y);
      return {
        position: pos,
        terrainType: tile?.terrainType || TerrainType.FLOOR,
        color: tile?.color || DEFAULT_TERRAIN_COLORS[TerrainType.FLOOR]
      };
    });

    // Create updated map
    const updatedMap = { ...map };
    const updatedTerrainLayer = { ...terrainLayer };
    const updatedTiles = [...terrainLayer.tiles];

    // Apply changes to affected tiles
    validTiles.forEach(pos => {
      const tileIndex = updatedTiles.findIndex(t => t.position.x === pos.x && t.position.y === pos.y);
      if (tileIndex >= 0) {
        updatedTiles[tileIndex] = {
          ...updatedTiles[tileIndex],
          terrainType: options.terrainType,
          color: options.color || DEFAULT_TERRAIN_COLORS[options.terrainType]
        };
      }
    });

    updatedTerrainLayer.tiles = updatedTiles;
    updatedMap.layers = map.layers.map(layer => 
      layer.id === terrainLayer.id ? updatedTerrainLayer : layer
    );

    // Create action for undo system
    const action: EditAction = {
      id: crypto.randomUUID(),
      type: validTiles.length > 1 ? 'bulk_terrain' : 'terrain_paint',
      timestamp: new Date(),
      data: {
        tiles: validTiles.map(pos => ({
          position: pos,
          terrainType: options.terrainType,
          color: options.color || DEFAULT_TERRAIN_COLORS[options.terrainType]
        }))
      },
      inverse: {
        tiles: originalTiles
      }
    };

    this.addToUndoStack(action);

    return { success: true, updatedMap, action };
  }

  // Erase terrain (set back to default)
  eraseTerrain(
    map: DnDMap, 
    position: Position, 
    brushOptions: BrushOptions,
    targetLayerId?: string
  ): { success: boolean; updatedMap: DnDMap; action?: EditAction } {
    return this.paintTerrain(map, position, {
      terrainType: TerrainType.FLOOR,
      color: DEFAULT_TERRAIN_COLORS[TerrainType.FLOOR],
      brushOptions
    }, targetLayerId);
  }

  // Place an object on the map
  placeObject(
    map: DnDMap,
    position: Position,
    options: ObjectPlacementOptions,
    targetLayerId?: string
  ): { success: boolean; updatedMap: DnDMap; action?: EditAction } {
    // Find target layer - use specified layer or first objects layer
    const objectsLayer = targetLayerId 
      ? map.layers.find(layer => layer.id === targetLayerId && layer.type === 'objects')
      : map.layers.find(layer => layer.type === 'objects');
      
    if (!objectsLayer || objectsLayer.isLocked) {
      return { success: false, updatedMap: map };
    }

    // Check if position is valid
    if (position.x < 0 || position.x >= map.dimensions.width ||
        position.y < 0 || position.y >= map.dimensions.height) {
      return { success: false, updatedMap: map };
    }

    // Create new object
    const newObject: MapObject = {
      id: crypto.randomUUID(),
      type: options.objectType,
      position,
      size: options.size,
      name: options.name,
      color: options.color || { r: 139, g: 69, b: 19 }, // Default brown
      isVisible: true,
      isInteractive: true
    };

    // Create updated map
    const updatedMap = { ...map };
    const updatedObjectsLayer = { ...objectsLayer };
    const updatedObjects = [...(objectsLayer.objects || [])];
    
    updatedObjects.push(newObject);
    updatedObjectsLayer.objects = updatedObjects;
    
    updatedMap.layers = map.layers.map(layer => 
      layer.id === objectsLayer.id ? updatedObjectsLayer : layer
    );

    // Create action for undo system
    const action: EditAction = {
      id: crypto.randomUUID(),
      type: 'object_place',
      timestamp: new Date(),
      data: { object: newObject },
      inverse: { objectId: newObject.id }
    };

    this.addToUndoStack(action);

    return { success: true, updatedMap, action };
  }

  // Move an object
  moveObject(
    map: DnDMap,
    objectId: string,
    newPosition: Position
  ): { success: boolean; updatedMap: DnDMap; action?: EditAction } {
    const objectsLayer = map.layers.find(layer => layer.type === 'objects');
    if (!objectsLayer || !objectsLayer.objects) {
      return { success: false, updatedMap: map };
    }

    const objectIndex = objectsLayer.objects.findIndex(obj => obj.id === objectId);
    if (objectIndex === -1) {
      return { success: false, updatedMap: map };
    }

    const originalPosition = objectsLayer.objects[objectIndex].position;

    // Check if new position is valid
    if (newPosition.x < 0 || newPosition.x >= map.dimensions.width ||
        newPosition.y < 0 || newPosition.y >= map.dimensions.height) {
      return { success: false, updatedMap: map };
    }

    // Create updated map
    const updatedMap = { ...map };
    const updatedObjectsLayer = { ...objectsLayer };
    const updatedObjects = [...objectsLayer.objects];
    
    updatedObjects[objectIndex] = {
      ...updatedObjects[objectIndex],
      position: newPosition
    };
    
    updatedObjectsLayer.objects = updatedObjects;
    updatedMap.layers = map.layers.map(layer => 
      layer.id === objectsLayer.id ? updatedObjectsLayer : layer
    );

    // Create action for undo system
    const action: EditAction = {
      id: crypto.randomUUID(),
      type: 'object_move',
      timestamp: new Date(),
      data: { objectId, newPosition },
      inverse: { objectId, oldPosition: originalPosition }
    };

    this.addToUndoStack(action);

    return { success: true, updatedMap, action };
  }

  // Delete an object
  deleteObject(
    map: DnDMap,
    objectId: string
  ): { success: boolean; updatedMap: DnDMap; action?: EditAction } {
    const objectsLayer = map.layers.find(layer => layer.type === 'objects');
    if (!objectsLayer || !objectsLayer.objects) {
      return { success: false, updatedMap: map };
    }

    const objectIndex = objectsLayer.objects.findIndex(obj => obj.id === objectId);
    if (objectIndex === -1) {
      return { success: false, updatedMap: map };
    }

    const deletedObject = objectsLayer.objects[objectIndex];

    // Create updated map
    const updatedMap = { ...map };
    const updatedObjectsLayer = { ...objectsLayer };
    const updatedObjects = objectsLayer.objects.filter(obj => obj.id !== objectId);
    
    updatedObjectsLayer.objects = updatedObjects;
    updatedMap.layers = map.layers.map(layer => 
      layer.id === objectsLayer.id ? updatedObjectsLayer : layer
    );

    // Create action for undo system
    const action: EditAction = {
      id: crypto.randomUUID(),
      type: 'object_delete',
      timestamp: new Date(),
      data: { objectId },
      inverse: { object: deletedObject }
    };

    this.addToUndoStack(action);

    return { success: true, updatedMap, action };
  }

  // Undo last action
  undo(map: DnDMap): { success: boolean; updatedMap: DnDMap } {
    if (this.undoStack.length === 0) {
      return { success: false, updatedMap: map };
    }

    const action = this.undoStack.pop()!;
    let updatedMap = map;

    try {
      switch (action.type) {
        case 'terrain_paint':
        case 'bulk_terrain':
          updatedMap = this.applyTerrainChanges(map, action.inverse.tiles);
          break;
        case 'object_place':
          updatedMap = this.removeObjectById(map, action.inverse.objectId);
          break;
        case 'object_move':
          const moveResult = this.moveObject(map, action.inverse.objectId, action.inverse.oldPosition);
          updatedMap = moveResult.updatedMap;
          // Remove the undo action created by moveObject since this IS the undo
          this.undoStack.pop();
          break;
        case 'object_delete':
          const restoreResult = this.restoreObject(map, action.inverse.object);
          updatedMap = restoreResult.updatedMap;
          break;
      }

      this.redoStack.push(action);
      return { success: true, updatedMap };
    } catch (error) {
      console.error('Undo failed:', error);
      return { success: false, updatedMap: map };
    }
  }

  // Redo last undone action
  redo(map: DnDMap): { success: boolean; updatedMap: DnDMap } {
    if (this.redoStack.length === 0) {
      return { success: false, updatedMap: map };
    }

    const action = this.redoStack.pop()!;
    let updatedMap = map;

    try {
      switch (action.type) {
        case 'terrain_paint':
        case 'bulk_terrain':
          updatedMap = this.applyTerrainChanges(map, action.data.tiles);
          break;
        case 'object_place':
          const placeResult = this.restoreObject(map, action.data.object);
          updatedMap = placeResult.updatedMap;
          break;
        case 'object_move':
          const moveResult = this.moveObject(map, action.data.objectId, action.data.newPosition);
          updatedMap = moveResult.updatedMap;
          // Remove the undo action created by moveObject since this IS the redo
          this.undoStack.pop();
          break;
        case 'object_delete':
          updatedMap = this.removeObjectById(map, action.data.objectId);
          break;
      }

      this.undoStack.push(action);
      return { success: true, updatedMap };
    } catch (error) {
      console.error('Redo failed:', error);
      return { success: false, updatedMap: map };
    }
  }

  // Helper methods
  private addToUndoStack(action: EditAction) {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack when new action is performed
    
    // Limit undo history
    if (this.undoStack.length > this.maxUndoHistory) {
      this.undoStack.shift();
    }
  }

  private applyTerrainChanges(map: DnDMap, tileChanges: any[]): DnDMap {
    const terrainLayer = map.layers.find(layer => layer.type === 'terrain');
    if (!terrainLayer || !terrainLayer.tiles) {
      return map;
    }

    const updatedMap = { ...map };
    const updatedTerrainLayer = { ...terrainLayer };
    const updatedTiles = [...terrainLayer.tiles];

    tileChanges.forEach(change => {
      const tileIndex = updatedTiles.findIndex(t => 
        t.position.x === change.position.x && t.position.y === change.position.y
      );
      if (tileIndex >= 0) {
        updatedTiles[tileIndex] = {
          ...updatedTiles[tileIndex],
          terrainType: change.terrainType,
          color: change.color
        };
      }
    });

    updatedTerrainLayer.tiles = updatedTiles;
    updatedMap.layers = map.layers.map(layer => 
      layer.id === terrainLayer.id ? updatedTerrainLayer : layer
    );

    return updatedMap;
  }

  private removeObjectById(map: DnDMap, objectId: string): DnDMap {
    const objectsLayer = map.layers.find(layer => layer.type === 'objects');
    if (!objectsLayer || !objectsLayer.objects) {
      return map;
    }

    const updatedMap = { ...map };
    const updatedObjectsLayer = { ...objectsLayer };
    const updatedObjects = objectsLayer.objects.filter(obj => obj.id !== objectId);
    
    updatedObjectsLayer.objects = updatedObjects;
    updatedMap.layers = map.layers.map(layer => 
      layer.id === objectsLayer.id ? updatedObjectsLayer : layer
    );

    return updatedMap;
  }

  private restoreObject(map: DnDMap, object: MapObject): { success: boolean; updatedMap: DnDMap } {
    const objectsLayer = map.layers.find(layer => layer.type === 'objects');
    if (!objectsLayer) {
      return { success: false, updatedMap: map };
    }

    const updatedMap = { ...map };
    const updatedObjectsLayer = { ...objectsLayer };
    const updatedObjects = [...(objectsLayer.objects || [])];
    
    updatedObjects.push(object);
    updatedObjectsLayer.objects = updatedObjects;
    
    updatedMap.layers = map.layers.map(layer => 
      layer.id === objectsLayer.id ? updatedObjectsLayer : layer
    );

    return { success: true, updatedMap };
  }

  // Get undo/redo availability
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Clear history
  clearHistory() {
    this.undoStack = [];
    this.redoStack = [];
  }

  // Get history info
  getHistoryInfo() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      lastAction: this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null
    };
  }
}

// Export singleton instance
export const mapEditingService = new MapEditingService();