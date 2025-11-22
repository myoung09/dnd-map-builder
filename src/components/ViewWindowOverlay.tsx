// ViewWindowOverlay Component - Renders and controls the player viewport rectangle on DM map

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ViewWindow } from '../types/dm';
import { Box } from '@mui/material';

interface ViewWindowOverlayProps {
  viewWindow: ViewWindow;
  onViewWindowChange: (viewWindow: ViewWindow) => void;
  mapWidth: number;
  mapHeight: number;
  cellSize: number;
  dmZoom?: number;
  dmPanX?: number;
  dmPanY?: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export const ViewWindowOverlay: React.FC<ViewWindowOverlayProps> = ({
  viewWindow,
  onViewWindowChange,
  mapWidth,
  mapHeight,
  cellSize,
  dmZoom = 1,
  dmPanX = 0,
  dmPanY = 0,
}) => {
  console.log('[ViewWindowOverlay] Rendering with:', { viewWindow, mapWidth, mapHeight, cellSize, dmZoom, dmPanX, dmPanY });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; windowX: number; windowY: number } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ 
    x: number; 
    y: number; 
    windowX: number; 
    windowY: number;
    windowWidth: number;
    windowHeight: number;
  } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const maxWidth = mapWidth * cellSize;
  const maxHeight = mapHeight * cellSize;

  // Handle mouse down on the view window body (for dragging)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) return; // Don't drag when clicking resize handles
    
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      windowX: viewWindow.x,
      windowY: viewWindow.y,
    });
  }, [viewWindow]);

  // Handle mouse down on resize handles
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (e.button !== 0) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      windowX: viewWindow.x,
      windowY: viewWindow.y,
      windowWidth: viewWindow.width,
      windowHeight: viewWindow.height,
    });
  }, [viewWindow]);

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStart) {
        // Convert screen-space delta to canvas-space delta (account for zoom)
        const dx = (e.clientX - dragStart.x) / dmZoom;
        const dy = (e.clientY - dragStart.y) / dmZoom;
        
        let newX = dragStart.windowX + dx;
        let newY = dragStart.windowY + dy;
        
        // Constrain to map bounds
        newX = Math.max(0, Math.min(newX, maxWidth - viewWindow.width));
        newY = Math.max(0, Math.min(newY, maxHeight - viewWindow.height));
        
        onViewWindowChange({
          ...viewWindow,
          x: newX,
          y: newY,
        });
      } else if (isResizing && resizeStart && resizeHandle) {
        // Convert screen-space delta to canvas-space delta (account for zoom)
        const dx = (e.clientX - resizeStart.x) / dmZoom;
        const dy = (e.clientY - resizeStart.y) / dmZoom;
        
        let newX = resizeStart.windowX;
        let newY = resizeStart.windowY;
        let newWidth = resizeStart.windowWidth;
        let newHeight = resizeStart.windowHeight;
        
        // Handle different resize directions
        if (resizeHandle.includes('n')) {
          const targetY = resizeStart.windowY + dy;
          const targetHeight = resizeStart.windowHeight - dy;
          if (targetHeight >= viewWindow.minHeight && targetY >= 0) {
            newY = targetY;
            newHeight = targetHeight;
          }
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(viewWindow.minHeight, resizeStart.windowHeight + dy);
        }
        if (resizeHandle.includes('w')) {
          const targetX = resizeStart.windowX + dx;
          const targetWidth = resizeStart.windowWidth - dx;
          if (targetWidth >= viewWindow.minWidth && targetX >= 0) {
            newX = targetX;
            newWidth = targetWidth;
          }
        }
        if (resizeHandle.includes('e')) {
          newWidth = Math.max(viewWindow.minWidth, resizeStart.windowWidth + dx);
        }
        
        // Constrain to map bounds
        if (newX + newWidth > maxWidth) {
          newWidth = maxWidth - newX;
        }
        if (newY + newHeight > maxHeight) {
          newHeight = maxHeight - newY;
        }
        
        onViewWindowChange({
          ...viewWindow,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setDragStart(null);
      setResizeStart(null);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeHandle, viewWindow, onViewWindowChange, maxWidth, maxHeight, dmZoom]);

  const handleSize = 12;

  // The ViewWindowOverlay is a sibling to MapCanvas, outside the canvas-stack transform
  // So we need to apply the same transform that canvas-stack uses:
  // transform: translate(panX, panY) scale(zoom)
  // This means: position = (canvas_coord * zoom) + pan
  
  const transformedX = viewWindow.x * dmZoom + dmPanX;
  const transformedY = viewWindow.y * dmZoom + dmPanY;
  const transformedWidth = viewWindow.width * dmZoom;
  const transformedHeight = viewWindow.height * dmZoom;
  
  console.log('[ViewWindowOverlay] Transform calculation:', {
    viewWindow,
    dmTransform: { zoom: dmZoom, panX: dmPanX, panY: dmPanY },
    result: { x: transformedX, y: transformedY, w: transformedWidth, h: transformedHeight }
  });

  return (
    <Box
      ref={overlayRef}
      sx={{
        position: 'absolute',
        left: `${transformedX}px`,
        top: `${transformedY}px`,
        width: `${transformedWidth}px`,
        height: `${transformedHeight}px`,
        border: '3px solid #2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.15)',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        boxShadow: '0 0 10px rgba(33, 150, 243, 0.5)',
        zIndex: 1000,
        transition: isDragging || isResizing ? 'none' : 'all 0.1s ease',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Label */}
      <Box
        sx={{
          position: 'absolute',
          top: '-30px',
          left: 0,
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Player View ({Math.round(viewWindow.width)}×{Math.round(viewWindow.height)})
      </Box>

      {/* Corner resize handles */}
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
        sx={{
          position: 'absolute',
          left: `-${handleSize / 2}px`,
          top: `-${handleSize / 2}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'nw-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
            transform: 'scale(1.2)',
          },
        }}
      />
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
        sx={{
          position: 'absolute',
          right: `-${handleSize / 2}px`,
          top: `-${handleSize / 2}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'ne-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
            transform: 'scale(1.2)',
          },
        }}
      />
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
        sx={{
          position: 'absolute',
          left: `-${handleSize / 2}px`,
          bottom: `-${handleSize / 2}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'sw-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
            transform: 'scale(1.2)',
          },
        }}
      />
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
        sx={{
          position: 'absolute',
          right: `-${handleSize / 2}px`,
          bottom: `-${handleSize / 2}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'se-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
            transform: 'scale(1.2)',
          },
        }}
      />

      {/* Edge resize handles */}
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
        sx={{
          position: 'absolute',
          left: '50%',
          top: `-${handleSize / 2}px`,
          transform: 'translateX(-50%)',
          width: '40px',
          height: `${handleSize}px`,
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '6px',
          cursor: 'n-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
          },
        }}
      />
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: `-${handleSize / 2}px`,
          transform: 'translateX(-50%)',
          width: '40px',
          height: `${handleSize}px`,
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '6px',
          cursor: 's-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
          },
        }}
      />
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
        sx={{
          position: 'absolute',
          left: `-${handleSize / 2}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${handleSize}px`,
          height: '40px',
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '6px',
          cursor: 'w-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
          },
        }}
      />
      <Box
        className="resize-handle"
        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
        sx={{
          position: 'absolute',
          right: `-${handleSize / 2}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${handleSize}px`,
          height: '40px',
          backgroundColor: '#3498db',
          border: '2px solid white',
          borderRadius: '6px',
          cursor: 'e-resize',
          zIndex: 1001,
          '&:hover': {
            backgroundColor: '#2980b9',
          },
        }}
      />
    </Box>
  );
};
