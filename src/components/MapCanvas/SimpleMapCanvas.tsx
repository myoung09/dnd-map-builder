import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Group, Text, Path } from 'react-konva';
import Konva from 'konva';
import { DnDMap, Position, ToolType, TerrainType, ViewportState, ToolState, MapObject, ObjectType, LayerType } from '../../types/map';
import { mapEditingService, BrushOptions, PaintOptions, ObjectPlacementOptions } from '../../services/mapEditingService';

interface MapCanvasProps {
  map: DnDMap;
  onMapChange: (map: DnDMap) => void;
  width: number;
  height: number;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  toolState: ToolState;
  selectedObjects: string[];
  onObjectSelection: (objectIds: string[]) => void;
  showGrid?: boolean;
  gridSize?: number;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  map,
  onMapChange,
  width, 
  height,
  viewport,
  onViewportChange,
  toolState,
  selectedObjects,
  onObjectSelection,
  showGrid = true,
  gridSize = 32
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);

  // Handle stage drag for panning
  const handleStageDragStart = useCallback(() => {
    if (toolState.activeTool === ToolType.PAN) {
      setIsDragging(true);
    }
  }, [toolState.activeTool]);

  const handleStageDragEnd = useCallback((e: any) => {
    if (isDragging && toolState.activeTool === ToolType.PAN) {
      const newPosition = e.currentTarget.position();
      onViewportChange({
        ...viewport,
        position: { x: newPosition.x, y: newPosition.y }
      });
      setIsDragging(false);
    }
  }, [isDragging, toolState.activeTool, viewport, onViewportChange]);

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number): Position => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point({ x: screenX, y: screenY });
    
    return {
      x: Math.floor(pos.x / gridSize),
      y: Math.floor(pos.y / gridSize)
    };
  }, [gridSize]);

  // Handle mouse/pointer events for drawing and interaction
  const handlePointerDown = useCallback((e: any) => {
    if (toolState.activeTool === ToolType.PAN) return;

    const gridPos = screenToGrid(e.evt.layerX, e.evt.layerY);
    
    switch (toolState.activeTool) {
      case ToolType.BRUSH:
        setIsDrawing(true);
        const brushOptions: BrushOptions = {
          size: toolState.brushSize,
          shape: 'square',
          opacity: 1
        };
        const paintOptions: PaintOptions = {
          terrainType: toolState.selectedTerrainType,
          color: toolState.selectedColor,
          brushOptions
        };
        const result = mapEditingService.paintTerrain(map, gridPos, paintOptions, toolState.selectedLayer);
        if (result.success) {
          onMapChange(result.updatedMap);
        }
        break;

      case ToolType.ERASER:
        setIsDrawing(true);
        const eraseResult = mapEditingService.eraseTerrain(map, gridPos, {
          size: toolState.brushSize,
          shape: 'square',
          opacity: 1
        }, toolState.selectedLayer);
        if (eraseResult.success) {
          onMapChange(eraseResult.updatedMap);
        }
        break;

      case ToolType.OBJECT_PLACE:
        const placementOptions: ObjectPlacementOptions = {
          objectType: toolState.selectedObjectType,
          size: { width: 1, height: 1 },
          name: `${toolState.selectedObjectType} Object`,
          color: toolState.selectedColor
        };
        const placeResult = mapEditingService.placeObject(map, gridPos, placementOptions, toolState.selectedLayer);
        if (placeResult.success) {
          onMapChange(placeResult.updatedMap);
        }
        break;

      case ToolType.SELECT:
        // Handle object selection
        const objectsLayer = map.layers.find(layer => layer.type === 'objects');
        if (objectsLayer?.objects) {
          const clickedObject = objectsLayer.objects.find(obj => 
            obj.position.x === gridPos.x && obj.position.y === gridPos.y
          );
          if (clickedObject) {
            const isSelected = selectedObjects.includes(clickedObject.id);
            if (e.evt.ctrlKey || e.evt.metaKey) {
              // Multi-select with Ctrl/Cmd
              if (isSelected) {
                onObjectSelection(selectedObjects.filter(id => id !== clickedObject.id));
              } else {
                onObjectSelection([...selectedObjects, clickedObject.id]);
              }
            } else {
              // Single select
              onObjectSelection(isSelected ? [] : [clickedObject.id]);
            }
            setDragStart(gridPos);
          } else {
            onObjectSelection([]);
          }
        }
        break;
    }
  }, [toolState, map, onMapChange, screenToGrid, selectedObjects, onObjectSelection]);

  const handlePointerMove = useCallback((e: any) => {
    if (!isDrawing) return;

    const gridPos = screenToGrid(e.evt.layerX, e.evt.layerY);

    switch (toolState.activeTool) {
      case ToolType.BRUSH:
        const brushOptions: BrushOptions = {
          size: toolState.brushSize,
          shape: 'square',
          opacity: 1
        };
        const paintOptions: PaintOptions = {
          terrainType: toolState.selectedTerrainType,
          color: toolState.selectedColor,
          brushOptions
        };
        const result = mapEditingService.paintTerrain(map, gridPos, paintOptions, toolState.selectedLayer);
        if (result.success) {
          onMapChange(result.updatedMap);
        }
        break;

      case ToolType.ERASER:
        const eraseResult = mapEditingService.eraseTerrain(map, gridPos, {
          size: toolState.brushSize,
          shape: 'square',
          opacity: 1
        }, toolState.selectedLayer);
        if (eraseResult.success) {
          onMapChange(eraseResult.updatedMap);
        }
        break;

      case ToolType.SELECT:
        // Handle object dragging
        if (dragStart && selectedObjects.length > 0) {
          const deltaX = gridPos.x - dragStart.x;
          const deltaY = gridPos.y - dragStart.y;
          
          if (deltaX !== 0 || deltaY !== 0) {
            let updatedMap = map;
            selectedObjects.forEach(objectId => {
              const objectsLayer = map.layers.find(layer => layer.type === 'objects');
              const obj = objectsLayer?.objects?.find(o => o.id === objectId);
              if (obj) {
                const newPos = {
                  x: obj.position.x + deltaX,
                  y: obj.position.y + deltaY
                };
                const moveResult = mapEditingService.moveObject(updatedMap, objectId, newPos);
                if (moveResult.success) {
                  updatedMap = moveResult.updatedMap;
                }
              }
            });
            onMapChange(updatedMap);
            setDragStart(gridPos);
          }
        }
        break;
    }
  }, [isDrawing, toolState, map, onMapChange, screenToGrid, dragStart, selectedObjects]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setDragStart(null);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    onViewportChange({
      ...viewport,
      zoom: clampedScale,
      position: newPos
    });
  }, [viewport, onViewportChange]);

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const gridColor = '#333333';
    const numColumns = Math.ceil(width / gridSize) + 2;
    const numRows = Math.ceil(height / gridSize) + 2;

    // Vertical lines
    for (let i = 0; i < numColumns; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, numRows * gridSize]}
          stroke={gridColor}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i < numRows; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, numColumns * gridSize, i * gridSize]}
          stroke={gridColor}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }

    return lines;
  };

  // Get terrain display for rendering (matching legend icons)
  const getTerrainDisplay = (terrainType: TerrainType | ObjectType, environmentType: string = 'dungeon') => {
    const terrainDisplays: Record<string, Record<TerrainType | ObjectType, { icon: string; backgroundColor: string; borderRadius?: number; isOrganic?: boolean }>> = {
      dungeon: {
        [TerrainType.WALL]: { icon: '🧱', backgroundColor: '#37474f', isOrganic: true },
        [TerrainType.FLOOR]: { icon: '⬜', backgroundColor: '#eceff1', isOrganic: true },
        [TerrainType.DOOR]: { icon: '🚪', backgroundColor: '#6d4c41' },
        [TerrainType.WATER]: { icon: '💧', backgroundColor: '#1976d2', isOrganic: true },
        [TerrainType.GRASS]: { icon: '🌱', backgroundColor: '#8bc34a', isOrganic: true },
        [TerrainType.STONE]: { icon: '🗿', backgroundColor: '#616161', isOrganic: true },
        [TerrainType.DIRT]: { icon: '🟤', backgroundColor: '#8d6e63', isOrganic: true },
        [TerrainType.SAND]: { icon: '🏜️', backgroundColor: '#ffcc02', isOrganic: true },
        [TerrainType.LAVA]: { icon: '🌋', backgroundColor: '#f44336', isOrganic: true },
        [TerrainType.ICE]: { icon: '🧊', backgroundColor: '#00bcd4', isOrganic: true },
        [TerrainType.WOOD]: { icon: '🪵', backgroundColor: '#795548' },
        [TerrainType.METAL]: { icon: '⚙️', backgroundColor: '#607d8b' },
        [TerrainType.TRAP]: { icon: '⚠️', backgroundColor: '#ff9800' },
        [TerrainType.DIFFICULT_TERRAIN]: { icon: '🌲', backgroundColor: '#1b5e20', isOrganic: true },
        [TerrainType.IMPASSABLE]: { icon: '⛔', backgroundColor: '#424242' },
        // Objects
        [ObjectType.FURNITURE]: { icon: '🪑', backgroundColor: '#8b4513' },
        [ObjectType.DECORATION]: { icon: '🎨', backgroundColor: '#ddd' },
        [ObjectType.INTERACTIVE]: { icon: '🔧', backgroundColor: '#95a5a6' },
        [ObjectType.CREATURE]: { icon: '🐲', backgroundColor: '#e74c3c' },
        [ObjectType.TREASURE]: { icon: '💰', backgroundColor: '#f1c40f' },
        [ObjectType.HAZARD]: { icon: '⚡', backgroundColor: '#e67e22' },
        [ObjectType.LIGHT_SOURCE]: { icon: '💡', backgroundColor: '#f39c12' },
        [ObjectType.MARKER]: { icon: '📍', backgroundColor: '#9b59b6' },
        [ObjectType.TEXT_LABEL]: { icon: '📝', backgroundColor: '#34495e' }
      },
      forest: {
        [TerrainType.DIFFICULT_TERRAIN]: { icon: '🌲', backgroundColor: '#1b5e20', isOrganic: true },
        [TerrainType.FLOOR]: { icon: '🌿', backgroundColor: '#66bb6a', isOrganic: true },
        [TerrainType.GRASS]: { icon: '🌱', backgroundColor: '#8bc34a', isOrganic: true },
        [TerrainType.WALL]: { icon: '🪨', backgroundColor: '#37474f', isOrganic: true },
        [TerrainType.DOOR]: { icon: '🚪', backgroundColor: '#6d4c41' },
        [TerrainType.WATER]: { icon: '🏞️', backgroundColor: '#1976d2', isOrganic: true },
        [TerrainType.STONE]: { icon: '🗿', backgroundColor: '#616161', isOrganic: true },
        [TerrainType.DIRT]: { icon: '🟤', backgroundColor: '#8d6e63', isOrganic: true },
        [TerrainType.SAND]: { icon: '🏜️', backgroundColor: '#ffcc02', isOrganic: true },
        [TerrainType.LAVA]: { icon: '🌋', backgroundColor: '#f44336', isOrganic: true },
        [TerrainType.ICE]: { icon: '🧊', backgroundColor: '#00bcd4', isOrganic: true },
        [TerrainType.WOOD]: { icon: '🪵', backgroundColor: '#795548' },
        [TerrainType.METAL]: { icon: '⚙️', backgroundColor: '#607d8b' },
        [TerrainType.TRAP]: { icon: '⚠️', backgroundColor: '#ff9800' },
        [TerrainType.IMPASSABLE]: { icon: '⛔', backgroundColor: '#424242' },
        // Objects
        [ObjectType.FURNITURE]: { icon: '🏕️', backgroundColor: '#8b4513' },
        [ObjectType.DECORATION]: { icon: '🌺', backgroundColor: '#ddd' },
        [ObjectType.INTERACTIVE]: { icon: '🔧', backgroundColor: '#95a5a6' },
        [ObjectType.CREATURE]: { icon: '🦌', backgroundColor: '#8bc34a' },
        [ObjectType.TREASURE]: { icon: '🎁', backgroundColor: '#f1c40f' },
        [ObjectType.HAZARD]: { icon: '🕷️', backgroundColor: '#e67e22' },
        [ObjectType.LIGHT_SOURCE]: { icon: '🔥', backgroundColor: '#f39c12' },
        [ObjectType.MARKER]: { icon: '🌳', backgroundColor: '#27ae60' },
        [ObjectType.TEXT_LABEL]: { icon: '🏷️', backgroundColor: '#34495e' }
      },
      tavern: {
        [TerrainType.WALL]: { icon: '🪵', backgroundColor: '#3e2723' },
        [TerrainType.FLOOR]: { icon: '🪵', backgroundColor: '#bcaaa4', isOrganic: true },
        [TerrainType.DOOR]: { icon: '🚪', backgroundColor: '#6d4c41' },
        [TerrainType.WATER]: { icon: '💧', backgroundColor: '#1976d2', isOrganic: true },
        [TerrainType.GRASS]: { icon: '🌱', backgroundColor: '#8bc34a', isOrganic: true },
        [TerrainType.STONE]: { icon: '🗿', backgroundColor: '#616161', isOrganic: true },
        [TerrainType.DIRT]: { icon: '🟤', backgroundColor: '#8d6e63', isOrganic: true },
        [TerrainType.SAND]: { icon: '🏜️', backgroundColor: '#ffcc02', isOrganic: true },
        [TerrainType.LAVA]: { icon: '🌋', backgroundColor: '#f44336', isOrganic: true },
        [TerrainType.ICE]: { icon: '🧊', backgroundColor: '#00bcd4', isOrganic: true },
        [TerrainType.WOOD]: { icon: '🪵', backgroundColor: '#795548' },
        [TerrainType.METAL]: { icon: '⚙️', backgroundColor: '#607d8b' },
        [TerrainType.TRAP]: { icon: '⚠️', backgroundColor: '#ff9800' },
        [TerrainType.DIFFICULT_TERRAIN]: { icon: '🌲', backgroundColor: '#1b5e20', isOrganic: true },
        [TerrainType.IMPASSABLE]: { icon: '⛔', backgroundColor: '#424242' },
        // Objects
        [ObjectType.FURNITURE]: { icon: '🍺', backgroundColor: '#8b4513' },
        [ObjectType.DECORATION]: { icon: '🖼️', backgroundColor: '#ddd' },
        [ObjectType.INTERACTIVE]: { icon: '🔔', backgroundColor: '#95a5a6' },
        [ObjectType.CREATURE]: { icon: '👨‍🍳', backgroundColor: '#e74c3c' },
        [ObjectType.TREASURE]: { icon: '🪙', backgroundColor: '#f1c40f' },
        [ObjectType.HAZARD]: { icon: '🔥', backgroundColor: '#e67e22' },
        [ObjectType.LIGHT_SOURCE]: { icon: '🕯️', backgroundColor: '#f39c12' },
        [ObjectType.MARKER]: { icon: '🏠', backgroundColor: '#9b59b6' },
        [ObjectType.TEXT_LABEL]: { icon: '📋', backgroundColor: '#34495e' }
      }
    };

    const envDisplay = terrainDisplays[environmentType] || terrainDisplays.dungeon;
    return envDisplay[terrainType] || { icon: '❓', backgroundColor: '#666666' };
  };

  // Get environment type from map (simplified version)
  const getMapEnvironmentType = () => {
    const tags = map.metadata.tags || [];
    const environmentTags = ['dungeon', 'forest', 'tavern', 'home', 'temple', 'city'];
    for (const tag of tags) {
      if (environmentTags.includes(tag.toLowerCase())) {
        return tag.toLowerCase();
      }
    }
    return 'dungeon'; // default
  };

  // Generate organic path for natural terrain
  const generateOrganicPath = (x: number, y: number, size: number) => {
    const variance = size * 0.15; // 15% variance for organic shape
    const points = [];
    
    // Generate points around the perimeter with slight random variations
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const baseX = x + size / 2 + Math.cos(angle) * (size / 2);
      const baseY = y + size / 2 + Math.sin(angle) * (size / 2);
      
      // Add slight random variation (deterministic based on position)
      const seedX = (x * 1234 + y * 5678) % 1000;
      const seedY = (y * 9012 + x * 3456) % 1000;
      const offsetX = (Math.sin(seedX + i) * variance) - (variance / 2);
      const offsetY = (Math.cos(seedY + i) * variance) - (variance / 2);
      
      points.push([baseX + offsetX, baseY + offsetY]);
    }
    
    // Create smooth path using bezier curves
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const next = points[(i + 1) % points.length];
      const controlX = (curr[0] + next[0]) / 2;
      const controlY = (curr[1] + next[1]) / 2;
      path += ` Q ${curr[0]} ${curr[1]} ${controlX} ${controlY}`;
    }
    path += ' Z';
    
    return path;
  };

  // Render terrain tiles for a specific layer
  const renderTerrainLayer = (layer: any) => {
    if (!layer.tiles || !layer.isVisible) return null;
    
    const environmentType = getMapEnvironmentType();

    return layer.tiles.map((tile: any, index: number) => {
      const terrainDisplay = getTerrainDisplay(tile.terrainType, environmentType);
      const x = tile.position.x * gridSize;
      const y = tile.position.y * gridSize;
      
      // Create organic shapes for certain terrain types
      const useOrganicShape = terrainDisplay.isOrganic && gridSize > 20;
      
      return (
        <Group key={`tile-${layer.id}-${index}`}>
          {/* Base shape - organic or rectangular */}
          {useOrganicShape ? (
            <Path
              data={generateOrganicPath(x, y, gridSize)}
              fill={terrainDisplay.backgroundColor}
              stroke="#333333"
              strokeWidth={1}
              opacity={layer.opacity || 1}
            />
          ) : (
            <Rect
              x={x}
              y={y}
              width={gridSize}
              height={gridSize}
              fill={terrainDisplay.backgroundColor}
              stroke="#333333"
              strokeWidth={1}
              opacity={layer.opacity || 1}
              cornerRadius={terrainDisplay.borderRadius || 0}
            />
          )}
          
          {/* Emoji icon overlay */}
          <Text
            x={x + gridSize / 2}
            y={y + gridSize / 2}
            text={terrainDisplay.icon}
            fontSize={Math.min(gridSize * 0.6, 24)}
            fontFamily="Arial"
            fill="rgba(0, 0, 0, 0.7)"
            align="center"
            verticalAlign="middle"
            offsetX={Math.min(gridSize * 0.3, 12)}
            offsetY={Math.min(gridSize * 0.3, 12)}
            opacity={layer.opacity || 1}
          />
        </Group>
      );
    });
  };

  // Render objects for a specific layer
  const renderObjectsLayer = (layer: any) => {
    if (!layer.objects || !layer.isVisible) return null;
    const environmentType = getMapEnvironmentType();

    return layer.objects.map((obj: MapObject) => {
      const isSelected = selectedObjects.includes(obj.id);
      const objectDisplay = getTerrainDisplay(obj.type, environmentType);
      const x = obj.position.x * gridSize;
      const y = obj.position.y * gridSize;
      const width = obj.size.width * gridSize;
      const height = obj.size.height * gridSize;
      
      return (
        <Group key={`object-${obj.id}`} opacity={layer.opacity || 1}>
          {/* Base rectangle */}
          <Rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={objectDisplay.backgroundColor}
            stroke={isSelected ? "#00ff00" : "#666"}
            strokeWidth={isSelected ? 2 : 1}
            opacity={0.8}
            cornerRadius={3}
          />
          
          {/* Object icon */}
          <Text
            x={x + width / 2}
            y={y + height / 2}
            text={objectDisplay.icon}
            fontSize={Math.min(Math.min(width, height) * 0.6, 24)}
            fontFamily="Arial"
            fill="rgba(0, 0, 0, 0.8)"
            align="center"
            verticalAlign="middle"
            offsetX={Math.min(Math.min(width, height) * 0.3, 12)}
            offsetY={Math.min(Math.min(width, height) * 0.3, 12)}
            opacity={1}
          />
        </Group>
      );
    });
  };

  // Render all layers in order with proper layering
  const renderLayers = () => {
    const environmentType = getMapEnvironmentType();
    
    // Separate terrain and object layers
    const terrainLayers = map.layers.filter(layer => 
      (layer.type === LayerType.BACKGROUND || layer.type === LayerType.TERRAIN) && layer.isVisible
    );
    const objectLayers = map.layers.filter(layer => 
      layer.type === LayerType.OBJECTS && layer.isVisible
    );
    
    // Create a tile map for proper layering - later layers override earlier ones
    const tileMap = new Map<string, { tile: any; layer: any; display: any }>();
    
    // Process terrain layers in order
    for (const layer of terrainLayers) {
      if (layer.tiles) {
        for (const tile of layer.tiles) {
          const key = `${tile.position.x},${tile.position.y}`;
          const terrainDisplay = getTerrainDisplay(tile.terrainType, environmentType);
          tileMap.set(key, { tile, layer, display: terrainDisplay });
        }
      }
    }
    
    // Render consolidated terrain tiles
    const terrainElements = Array.from(tileMap.values()).map(({ tile, layer, display }, index) => {
      const x = tile.position.x * gridSize;
      const y = tile.position.y * gridSize;
      const useOrganicShape = display.isOrganic && gridSize > 20;
      
      return (
        <Group key={`consolidated-tile-${index}`}>
          {/* Base shape - organic or rectangular */}
          {useOrganicShape ? (
            <Path
              data={generateOrganicPath(x, y, gridSize)}
              fill={display.backgroundColor}
              stroke="#333333"
              strokeWidth={1}
              opacity={layer.opacity || 1}
            />
          ) : (
            <Rect
              x={x}
              y={y}
              width={gridSize}
              height={gridSize}
              fill={display.backgroundColor}
              stroke="#333333"
              strokeWidth={1}
              opacity={layer.opacity || 1}
              cornerRadius={display.borderRadius || 0}
            />
          )}
          
          {/* Emoji icon overlay */}
          <Text
            x={x + gridSize / 2}
            y={y + gridSize / 2}
            text={display.icon}
            fontSize={Math.min(gridSize * 0.6, 24)}
            fontFamily="Arial"
            fill="rgba(0, 0, 0, 0.7)"
            align="center"
            verticalAlign="middle"
            offsetX={Math.min(gridSize * 0.3, 12)}
            offsetY={Math.min(gridSize * 0.3, 12)}
            opacity={layer.opacity || 1}
          />
        </Group>
      );
    });
    
    // Render object layers separately (on top)
    const objectElements = objectLayers.map(layer => renderObjectsLayer(layer));
    
    return [...terrainElements, ...objectElements];
  };

  // Update stage transform when viewport changes
  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      stage.x(viewport.position.x);
      stage.y(viewport.position.y);
      stage.scaleX(viewport.zoom);
      stage.scaleY(viewport.zoom);
    }
  }, [viewport]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Stage 
        ref={stageRef}
        width={width} 
        height={height}
        draggable={toolState.activeTool === ToolType.PAN}
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={map.dimensions.width * gridSize}
            height={map.dimensions.height * gridSize}
            fill="#1a1a1a"
          />
          
          {/* Grid */}
          {renderGrid()}
          
          {/* All Layers in Order */}
          {renderLayers()}
        </Layer>
      </Stage>
    </div>
  );
};

export default MapCanvas;