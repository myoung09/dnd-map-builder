import React, { useState, useCallback, useRef } from 'react';
import { Stage, Layer, Rect, Group, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { DnDMap, ToolType, ViewportState, ToolState } from '../../types/map';

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

const NewMapCanvas: React.FC<MapCanvasProps> = ({ 
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
          const gridCellSize = (obj.properties?.cellSize || 1) * gridSize;
          const gridLines: JSX.Element[] = [];
          const lineColor = obj.properties?.lineColor || { r: 200, g: 200, b: 200, a: 0.3 };
          const lineWidth = obj.properties?.lineWidth || 1;
          const opacity = obj.opacity || 0.3;
          
          // Vertical lines
          for (let i = 0; i <= obj.size.width; i++) {
            gridLines.push(
              <Rect
                key={`grid-v-${i}`}
                x={x + i * gridCellSize}
                y={y}
                width={lineWidth}
                height={height}
                fill={`rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity})`}
                listening={false}
              />
            );
          }

          // Horizontal lines
          for (let i = 0; i <= obj.size.height; i++) {
            gridLines.push(
              <Rect
                key={`grid-h-${i}`}
                x={x}
                y={y + i * gridCellSize}
                width={width}
                height={lineWidth}
                fill={`rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity})`}
                listening={false}
              />
            );
          }
          
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
          allObjects.push(
            <Group key={obj.id}>
              {/* Background shape for rooms/paths */}
              {(obj.name.includes('room') || obj.name.includes('path') || obj.name.includes('streets')) && (
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
        } else if (obj.name.includes('room') || obj.name.includes('path') || obj.name.includes('streets')) {
          // Render room/path shapes
          const fillColor = obj.color ? `rgb(${obj.color.r}, ${obj.color.g}, ${obj.color.b})` : '#cccccc';
          
          // Check if this is an L-shaped corridor
          if (obj.properties?.isLShaped && obj.properties?.corridorPoints) {
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
            // Organic shape - approximate with circle
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            
            allObjects.push(
              <Circle
                key={obj.id}
                x={centerX}
                y={centerY}
                radius={Math.min(width, height) / 2}
                fill={fillColor}
                stroke={isSelected ? '#0088ff' : '#666666'}
                strokeWidth={isSelected ? 2 : 1}
                objectId={obj.id}
              />
            );
          } else {
            // Regular rectangular shape
            allObjects.push(
              <Rect
                key={obj.id}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fillColor}
                stroke={isSelected ? '#0088ff' : '#666666'}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={obj.name.includes('room') ? 4 : 0}
                objectId={obj.id}
              />
            );
          }
        }
      });
    });

    return <Group>{allObjects}</Group>;
  };

  return (
    <div style={{ border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
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
          
          {/* Grid */}
          {renderGrid()}
          
          {/* Objects (rooms, paths, items) */}
          {renderObjects()}
        </Layer>
      </Stage>
    </div>
  );
};

export default NewMapCanvas;