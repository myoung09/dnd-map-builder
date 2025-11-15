import React, { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

interface SimpleMapCanvasProps {
  width: number;
  height: number;
}

const SimpleMapCanvas: React.FC<SimpleMapCanvasProps> = ({ width, height }) => {
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Stage 
        width={width} 
        height={height}
        draggable
        x={stagePos.x}
        y={stagePos.y}
        onDragEnd={(e) => {
          setStagePos(e.currentTarget.position());
        }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={600}
            height={400}
            fill="darkgreen"
          />
          <Rect
            x={50}
            y={50}
            width={100}
            height={100}
            fill="red"
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default SimpleMapCanvas;