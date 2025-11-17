import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text, Line } from 'react-konva';
import Konva from 'konva';
import { DnDMap, ToolType, ViewportState, ToolState } from '../../types/map';

interface MapCanvasProps {
  map: DnDMap;
  onMapChange: (map: DnDMap) => void;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  toolState: ToolState;
  selectedObjects: string[];
  onObjectSelection: (objectIds: string[]) => void;
  showGrid?: boolean;
  gridSize?: number;
}

const NewMapCanvas: React.FC<MapCanvasProps> = ({ 
  map,
  onMapChange,
  viewport,
  onViewportChange,
  toolState,
  selectedObjects,
  onObjectSelection,
  showGrid = true,
  gridSize = 32
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle dynamic canvas resizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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

  // Handle click events
  const handleStageClick = useCallback((e: any) => {
    if (toolState.activeTool === ToolType.PAN) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    switch (toolState.activeTool) {
      case ToolType.SELECT:
        // Handle object selection
        const clickedShape = e.target;
        if (clickedShape !== stage) {
          const objectId = clickedShape.getAttr('objectId');
          if (objectId) {
            onObjectSelection([objectId]);
          }
        } else {
          onObjectSelection([]);
        }
        break;
    }
  }, [toolState.activeTool, onObjectSelection]);

  // Render background layer
  const renderBackground = () => {
    return (
      <Rect
        x={0}
        y={0}
        width={map.dimensions.width * gridSize}
        height={map.dimensions.height * gridSize}
        fill={map.backgroundColor ? `rgb(${map.backgroundColor.r}, ${map.backgroundColor.g}, ${map.backgroundColor.b})` : '#f0f0f0'}
      />
    );
  };

  // Render grid
  const renderGrid = () => {
    // Grid is now rendered as an object in layers, not here
    return null;
  };

  // Build a set of terrain cells (rooms and paths)
  const getTerrainCells = (): Set<string> => {
    const terrainCells = new Set<string>();
    
    map.layers.forEach(layer => {
      if (layer.type === 'terrain' && layer.isVisible && layer.objects) {
        layer.objects.forEach(obj => {
          // Add all cells occupied by this object
          for (let dy = 0; dy < obj.size.height; dy++) {
            for (let dx = 0; dx < obj.size.width; dx++) {
              const cellX = obj.position.x + dx;
              const cellY = obj.position.y + dy;
              terrainCells.add(`${cellX},${cellY}`);
            }
          }
        });
      }
    });
    
    return terrainCells;
  };

  // Render map objects
  const renderObjects = () => {
    const allObjects: JSX.Element[] = [];

    map.layers.forEach(layer => {
      if (!layer.isVisible || !layer.objects) return;

      layer.objects.forEach(obj => {
        const x = obj.position.x * gridSize;
        const y = obj.position.y * gridSize;
        const width = obj.size.width * gridSize;
        const height = obj.size.height * gridSize;
        const isSelected = selectedObjects.includes(obj.id);

        // Handle grid objects specially
        if (obj.type === 'grid') {
          const gridLines: JSX.Element[] = [];
          const lineColor = obj.properties?.lineColor || { r: 0, g: 0, b: 0, a: 1.0 };
          const lineWidth = obj.properties?.lineWidth || 1;
          // Use layer opacity (not object opacity) for grid visibility control
          const opacity = layer.opacity !== undefined ? layer.opacity : 1.0;
          
          // Get terrain cells to only draw grid over them
          const terrainCells = getTerrainCells();
          
          // Draw grid lines only over terrain cells
          // For each terrain cell, draw its borders
          terrainCells.forEach(cellKey => {
            const [cellX, cellY] = cellKey.split(',').map(Number);
            const cellScreenX = cellX * gridSize;
            const cellScreenY = cellY * gridSize;
            
            // Top border
            gridLines.push(
              <Rect
                key={`grid-t-${cellX}-${cellY}`}
                x={cellScreenX}
                y={cellScreenY}
                width={gridSize}
                height={lineWidth}
                fill={`rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity})`}
                listening={false}
              />
            );
            
            // Left border
            gridLines.push(
              <Rect
                key={`grid-l-${cellX}-${cellY}`}
                x={cellScreenX}
                y={cellScreenY}
                width={lineWidth}
                height={gridSize}
                fill={`rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity})`}
                listening={false}
              />
            );
            
            // Right border
            gridLines.push(
              <Rect
                key={`grid-r-${cellX}-${cellY}`}
                x={cellScreenX + gridSize - lineWidth}
                y={cellScreenY}
                width={lineWidth}
                height={gridSize}
                fill={`rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity})`}
                listening={false}
              />
            );
            
            // Bottom border
            gridLines.push(
              <Rect
                key={`grid-b-${cellX}-${cellY}`}
                x={cellScreenX}
                y={cellScreenY + gridSize - lineWidth}
                width={gridSize}
                height={lineWidth}
                fill={`rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity})`}
                listening={false}
              />
            );
          });
          
          allObjects.push(
            <Group key={obj.id}>
              {gridLines}
              {/* Selection border for grid object */}
              {isSelected && (
                <Rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  stroke="#0088ff"
                  strokeWidth={2}
                  dash={[5, 5]}
                  fill="transparent"
                  objectId={obj.id}
                />
              )}
            </Group>
          );
          return;
        }

        // Determine how to render this object
        if (obj.properties?.emoji) {
          // Render emoji-based object
          const isCircle = obj.properties?.shape?.type === 'circle';
          
          allObjects.push(
            <Group key={obj.id}>
              {/* Background shape for rooms/paths/towers */}
              {(obj.name.includes('room') || obj.name.includes('path') || obj.name.includes('streets') || obj.name.includes('tower')) && (
                isCircle ? (
                  <Circle
                    x={x + width / 2}
                    y={y + height / 2}
                    radius={Math.min(width, height) / 2}
                    fill={obj.color ? `rgb(${obj.color.r}, ${obj.color.g}, ${obj.color.b})` : '#cccccc'}
                    stroke={isSelected ? '#0088ff' : 'transparent'}
                    strokeWidth={isSelected ? 2 : 0}
                    objectId={obj.id}
                  />
                ) : (
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={obj.color ? `rgb(${obj.color.r}, ${obj.color.g}, ${obj.color.b})` : '#cccccc'}
                    stroke={isSelected ? '#0088ff' : 'transparent'}
                    strokeWidth={isSelected ? 2 : 0}
                    cornerRadius={obj.name.includes('room') ? 4 : 0}
                    objectId={obj.id}
                  />
                )
              )}
              
              {/* Emoji icon */}
              <Text
                x={x + width / 2}
                y={y + height / 2}
                text={obj.properties.emoji}
                fontSize={Math.min(gridSize * 0.8, 24)}
                fontFamily="Arial"
                align="center"
                verticalAlign="middle"
                offsetX={Math.min(gridSize * 0.4, 12)}
                offsetY={Math.min(gridSize * 0.4, 12)}
                objectId={obj.id}
              />
            </Group>
          );
        } else if (obj.properties?.text) {
          // Render text label
          allObjects.push(
            <Text
              key={obj.id}
              x={x}
              y={y}
              text={obj.properties.text}
              fontSize={obj.properties.fontSize || 16}
              fontFamily="Arial"
              fill="black"
              stroke={isSelected ? '#0088ff' : 'transparent'}
              strokeWidth={isSelected ? 1 : 0}
              objectId={obj.id}
            />
          );
        } else if (obj.name.includes('room') || obj.name.includes('path') || obj.name.includes('streets') || obj.name.includes('tower')) {
          // Render room/path/tower shapes
          const fillColor = obj.color ? `rgb(${obj.color.r}, ${obj.color.g}, ${obj.color.b})` : '#cccccc';
          
          // Check if this is an organic curved path
          if (obj.properties?.isOrganic && obj.properties?.pathPoints) {
            // Render organic path as smooth continuous line
            const pathPoints = obj.properties.pathPoints;
            const defaultPathWidth = obj.properties?.width || 2;
            
            // Convert path points to flat array for Konva Line
            const linePoints: number[] = [];
            pathPoints.forEach((point: { x: number; y: number; width?: number }) => {
              linePoints.push(point.x * gridSize);
              linePoints.push(point.y * gridSize);
            });
            
            // Render as smooth line with tension
            allObjects.push(
              <Group key={obj.id}>
                <Line
                  points={linePoints}
                  stroke={fillColor}
                  strokeWidth={defaultPathWidth * gridSize}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.3}
                  listening={false}
                />
                {isSelected && (
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    stroke="#0088ff"
                    strokeWidth={2}
                    fill="transparent"
                    objectId={obj.id}
                  />
                )}
              </Group>
            );
          } else if (obj.properties?.isLShaped && obj.properties?.corridorPoints) {
            // Render L-shaped corridor as individual cells with organic variation
            const defaultPathWidth = obj.properties.width || 2;
            const corridorRects: JSX.Element[] = [];
            
            obj.properties.corridorPoints.forEach((point: { x: number; y: number; width?: number }, idx: number) => {
              const cellWidth = (point.width || defaultPathWidth) * gridSize;
              corridorRects.push(
                <Rect
                  key={`${obj.id}-corridor-${idx}`}
                  x={point.x * gridSize}
                  y={point.y * gridSize}
                  width={cellWidth}
                  height={cellWidth}
                  fill={fillColor}
                  listening={false}
                  cornerRadius={gridSize * 0.1} // Slight rounding for organic feel
                />
              );
            });
            
            allObjects.push(
              <Group key={obj.id}>
                {corridorRects}
                {isSelected && (
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    stroke="#0088ff"
                    strokeWidth={2}
                    fill="transparent"
                    objectId={obj.id}
                  />
                )}
              </Group>
            );
          } else if (obj.properties?.shape?.type === 'organic' && obj.properties?.shape?.points) {
            // Organic shape - render as irregular blob using actual points
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            
            // Convert shape points to absolute coordinates
            const shapePoints: number[] = [];
            obj.properties.shape.points.forEach((point: { x: number; y: number }) => {
              shapePoints.push(centerX + point.x * gridSize);
              shapePoints.push(centerY + point.y * gridSize);
            });
            
            allObjects.push(
              <Line
                key={obj.id}
                points={shapePoints}
                fill={fillColor}
                stroke={isSelected ? '#0088ff' : fillColor}
                strokeWidth={isSelected ? 2 : 1}
                closed={true}
                tension={0.4} // Smooth curves for organic feel
                objectId={obj.id}
              />
            );
          } else {
            // Regular shape - check if circle or rectangle
            const isCorridor = obj.properties?.isCorridor === true;
            const isCircle = obj.properties?.shape?.type === 'circle';
            
            if (isCircle) {
              // Render as circle
              const centerX = x + width / 2;
              const centerY = y + height / 2;
              const radius = Math.min(width, height) / 2;
              
              allObjects.push(
                <Circle
                  key={obj.id}
                  x={centerX}
                  y={centerY}
                  radius={radius}
                  fill={fillColor}
                  stroke={isSelected ? '#0088ff' : '#666666'}
                  strokeWidth={isSelected ? 2 : 1}
                  objectId={obj.id}
                  perfectDrawEnabled={false}
                />
              );
            } else {
              // Regular rectangular shape
              // Corridors should have no stroke to avoid grid lines
              allObjects.push(
                <Rect
                  key={obj.id}
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={fillColor}
                  stroke={isSelected ? '#0088ff' : (isCorridor ? undefined : '#666666')}
                  strokeWidth={isSelected ? 2 : (isCorridor ? 0 : 1)}
                  cornerRadius={obj.name.includes('room') ? 4 : 0}
                  objectId={obj.id}
                  perfectDrawEnabled={false}
                />
              );
            }
          }
        }
      });
    });

    return <Group>{allObjects}</Group>;
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        border: '1px solid #ccc', 
        backgroundColor: '#f5f5f5',
        overflow: 'hidden'
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={viewport.position.x}
        y={viewport.position.y}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        draggable={toolState.activeTool === ToolType.PAN}
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Background */}
          {renderBackground()}
          
          {/* Objects (rooms, paths, items) */}
          {renderObjects()}
          
          {/* Grid - render last so it appears on top */}
          {renderGrid()}
        </Layer>
      </Stage>
    </div>
  );
};

export default NewMapCanvas;