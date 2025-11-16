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
    if (!showGrid) return null;

    const lines: JSX.Element[] = [];
    const totalWidth = map.dimensions.width * gridSize;
    const totalHeight = map.dimensions.height * gridSize;

    // Vertical lines
    for (let i = 0; i <= map.dimensions.width; i++) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * gridSize}
          y={0}
          width={1}
          height={totalHeight}
          fill="rgba(200, 200, 200, 0.3)"
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= map.dimensions.height; i++) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={0}
          y={i * gridSize}
          width={totalWidth}
          height={1}
          fill="rgba(200, 200, 200, 0.3)"
        />
      );
    }

    return <Group>{lines}</Group>;
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
          
          if (obj.properties?.shape?.type === 'organic' && obj.properties?.shape?.points) {
            // Organic shape - approximate with multiple small rectangles
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