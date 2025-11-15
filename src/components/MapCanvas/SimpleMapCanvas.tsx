import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Group } from 'react-konva';
import Konva from 'konva';
import { DnDMap, Position, ToolType, TerrainType, ObjectType, ViewportState, ToolState, MapObject } from '../../types/map';
import { DEFAULT_TERRAIN_COLORS } from '../../utils/mapUtils';
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

  // Render terrain tiles for a specific layer
  const renderTerrainLayer = (layer: any) => {
    if (!layer.tiles || !layer.isVisible) return null;

    return layer.tiles.map((tile: any, index: number) => (
      <Rect
        key={`tile-${layer.id}-${index}`}
        x={tile.position.x * gridSize}
        y={tile.position.y * gridSize}
        width={gridSize}
        height={gridSize}
        fill={tile.color ? `rgb(${tile.color.r}, ${tile.color.g}, ${tile.color.b})` : '#666666'}
        stroke="#222"
        strokeWidth={0.5}
        opacity={layer.opacity || 1}
      />
    ));
  };

  // Render objects for a specific layer
  const renderObjectsLayer = (layer: any) => {
    if (!layer.objects || !layer.isVisible) return null;

    return layer.objects.map((obj: MapObject) => {
      const isSelected = selectedObjects.includes(obj.id);
      
      return (
        <Group key={`object-${obj.id}`} opacity={layer.opacity || 1}>
          <Rect
            x={obj.position.x * gridSize}
            y={obj.position.y * gridSize}
            width={obj.size.width * gridSize}
            height={obj.size.height * gridSize}
            fill={obj.color ? `rgb(${obj.color.r}, ${obj.color.g}, ${obj.color.b})` : '#8B4513'}
            stroke={isSelected ? "#00ff00" : "#666"}
            strokeWidth={isSelected ? 2 : 1}
            opacity={0.8}
          />
          {/* Object type indicator */}
          <Circle
            x={obj.position.x * gridSize + 8}
            y={obj.position.y * gridSize + 8}
            radius={4}
            fill="#fff"
            opacity={0.8}
          />
        </Group>
      );
    });
  };

  // Render all layers in order
  const renderLayers = () => {
    return map.layers.map(layer => {
      switch (layer.type) {
        case 'terrain':
          return renderTerrainLayer(layer);
        case 'objects':
          return renderObjectsLayer(layer);
        default:
          return null;
      }
    });
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