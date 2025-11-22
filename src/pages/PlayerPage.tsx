// Player Route - Read-only player view with DM-controlled visibility

import React, { useState, useEffect, useRef } from 'react';
import { Box, Chip, Alert, CircularProgress, Typography } from '@mui/material';
import { MapCanvas, MapCanvasRef } from '../components/MapCanvas';
import { wsService } from '../services/websocket';
import {
  LightingState,
  DMObject,
  DMSessionState,
  WSEventType,
  WSEvent,
  ViewWindow,
} from '../types/dm';
import { MapData } from '../types/generator';
import { Palette } from '../types/palette';
import { PlacedObject } from '../types/objects';

// Helper function to convert DMObject to PlacedObject
const dmObjectToPlacedObject = (dmObj: DMObject): PlacedObject => ({
  id: dmObj.id,
  spriteId: dmObj.spriteId,
  gridX: dmObj.x,
  gridY: dmObj.y,
  scaleX: dmObj.scaleX,
  scaleY: dmObj.scaleY,
  rotation: dmObj.rotation,
  zIndex: dmObj.zIndex,
});

interface PlayerPageProps {
  sessionId?: string;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({ sessionId: propSessionId }) => {
  const [sessionId] = useState(
    propSessionId || new URLSearchParams(window.location.search).get('session') || ''
  );
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const canvasRef = useRef<MapCanvasRef>(null);

  // Player view state (controlled by DM)
  const [lighting, setLighting] = useState<LightingState>({
    brightness: 1,
    contrast: 1,
    fogOfWarEnabled: false,
    lightSources: [],
  });

  const [visibleObjects, setVisibleObjects] = useState<DMObject[]>([]);
  const [viewWindow, setViewWindow] = useState<ViewWindow | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate pan/zoom from view window to show the exact area
  useEffect(() => {
    if (!viewWindow || !mapData) return;
    
    // The view window defines a rectangle in canvas coordinates
    // We want to show exactly this rectangle, filling the player's viewport
    
    // Get the viewport size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate zoom to fill the viewport with the view window
    // Use the smaller zoom to ensure the entire view window fits
    const zoomX = viewportWidth / viewWindow.width;
    const zoomY = viewportHeight / viewWindow.height;
    const newZoom = Math.min(zoomX, zoomY);
    
    // Calculate pan to position the view window at top-left of viewport
    // Formula: screenPos = canvasPos * zoom + pan
    // We want: viewWindow.x * zoom + pan = 0 (top-left of screen)
    // So: pan = -viewWindow.x * zoom
    const newPanX = -viewWindow.x * newZoom;
    const newPanY = -viewWindow.y * newZoom;
    
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
    
    console.log('[PlayerPage] View window calculation:', {
      viewWindow,
      viewport: { width: viewportWidth, height: viewportHeight },
      zoomCalc: { zoomX, zoomY, chosen: newZoom },
      result: { zoom: newZoom, panX: newPanX, panY: newPanY },
      verification: {
        topLeftScreen: {
          x: viewWindow.x * newZoom + newPanX,
          y: viewWindow.y * newZoom + newPanY
        },
        bottomRightScreen: {
          x: (viewWindow.x + viewWindow.width) * newZoom + newPanX,
          y: (viewWindow.y + viewWindow.height) * newZoom + newPanY
        }
      }
    });
  }, [viewWindow, mapData]);

  // Draw fog of war on canvas
  useEffect(() => {
    const canvas = fogCanvasRef.current;
    const mapCanvas = canvasRef.current?.getCanvas?.();
    
    if (!canvas || !mapCanvas || !lighting.fogOfWarEnabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to map canvas
    canvas.width = mapCanvas.width;
    canvas.height = mapCanvas.height;

    // Fill entire canvas with black fog
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out holes for each light source using globalCompositeOperation
    lighting.lightSources.forEach((light) => {
      // Create radial gradient for smooth edges
      const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      // Use destination-out to erase fog
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = gradient;
      ctx.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
      
      // Draw the circle
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    });
  }, [lighting.fogOfWarEnabled, lighting.lightSources, mapData]);

  // Connect to WebSocket on mount
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    wsService
      .connect(sessionId, 'player')
      .then(() => {
        setConnected(true);
        setLoading(false);
        console.log('[PlayerPage] Connected to session:', sessionId);
      })
      .catch((error) => {
        console.error('[PlayerPage] Connection failed:', error);
        setError('Failed to connect to session');
        setLoading(false);
      });

    return () => {
      wsService.disconnect();
    };
  }, [sessionId]);

  // Listen for WebSocket events
  useEffect(() => {
    if (!connected) return;

    // Handle lighting updates
    const unsubLighting = wsService.on(WSEventType.LIGHTING_UPDATE, (event: WSEvent) => {
      if (event.type === WSEventType.LIGHTING_UPDATE) {
        console.log('[PlayerPage] Lighting updated:', event.payload);
        setLighting(event.payload);
      }
    });

    // Handle object placed
    const unsubPlaced = wsService.on(WSEventType.OBJECT_PLACED, (event: WSEvent) => {
      if (event.type === WSEventType.OBJECT_PLACED) {
        const obj = event.payload;
        if (obj.visibleToPlayers) {
          console.log('[PlayerPage] Object placed:', obj);
          setVisibleObjects((prev) => [...prev, obj]);
        }
      }
    });

    // Handle object updated
    const unsubUpdated = wsService.on(WSEventType.OBJECT_UPDATED, (event: WSEvent) => {
      if (event.type === WSEventType.OBJECT_UPDATED) {
        const obj = event.payload;
        console.log('[PlayerPage] Object updated:', obj);
        setVisibleObjects((prev) => {
          const filtered = prev.filter((o) => o.id !== obj.id);
          return obj.visibleToPlayers ? [...filtered, obj] : filtered;
        });
      }
    });

    // Handle object removed
    const unsubRemoved = wsService.on(WSEventType.OBJECT_REMOVED, (event: WSEvent) => {
      if (event.type === WSEventType.OBJECT_REMOVED) {
        console.log('[PlayerPage] Object removed:', event.payload.objectId);
        setVisibleObjects((prev) => prev.filter((o) => o.id !== event.payload.objectId));
      }
    });

    // Handle full sync
    const unsubSync = wsService.on(WSEventType.SYNC_NOW, (event: WSEvent) => {
      if (event.type === WSEventType.SYNC_NOW) {
        const state: DMSessionState = event.payload.sessionState;
        console.log('[PlayerPage] Full sync received:', state);
        
        // Update map data if provided
        if (state.mapData) {
          setMapData(state.mapData);
          console.log('[PlayerPage] Map data loaded');
        }
        
        // Update palette if provided
        if (state.palette) {
          setPalette(state.palette);
          console.log('[PlayerPage] Palette loaded');
        }
        
        // Update view window if provided
        if (state.viewWindow) {
          setViewWindow(state.viewWindow);
          console.log('[PlayerPage] View window loaded');
        }
        
        setLighting(state.lighting);
        setVisibleObjects(state.objects.filter((o) => o.visibleToPlayers));
      }
    });

    // Handle view window updates
    const unsubViewWindow = wsService.on(WSEventType.VIEW_WINDOW_UPDATE, (event: WSEvent) => {
      if (event.type === WSEventType.VIEW_WINDOW_UPDATE) {
        console.log('[PlayerPage] View window updated (raw):', event.payload);
        setViewWindow(event.payload);
      }
    });

    // Handle map init
    const unsubMapInit = wsService.on(WSEventType.MAP_INIT, (event: WSEvent) => {
      if (event.type === WSEventType.MAP_INIT) {
        console.log('[PlayerPage] Map initialized:', event.payload);
        // TODO: Load map data based on event.payload
      }
    });

    return () => {
      unsubLighting();
      unsubPlaced();
      unsubUpdated();
      unsubRemoved();
      unsubSync();
      unsubViewWindow();
      unsubMapInit();
    };
  }, [connected]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Connecting to session...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
      {/* Connection status */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Chip
          label={connected ? 'Connected' : 'Disconnected'}
          color={connected ? 'success' : 'error'}
          size="small"
        />
      </Box>

      {/* Session ID */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <Chip label={`Session: ${sessionId}`} size="small" variant="outlined" />
      </Box>

      {/* Map Canvas Container - Fill viewport, no centering */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Canvas wrapper - ensure canvas starts at 0,0 with no centering */}
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block', // Override any flex
          '& .map-canvas-container': {
            position: 'absolute',
            top: 0,
            left: 0,
          }
        }}>
          <MapCanvas
            ref={canvasRef}
            mapData={mapData}
            cellSize={20}
            showGrid={true}
            showRooms={true}
            showCorridors={true}
            showTrees={true}
            showObjects={true}
            placedObjects={visibleObjects.map(dmObjectToPlacedObject)}
            spritesheets={[]}
            palette={palette}
            zoom={zoom}
            panX={panX}
            panY={panY}
          />
          
          {/* Fog of War Canvas Overlay */}
          {lighting.fogOfWarEnabled && (
            <>
              <canvas
                ref={fogCanvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              />
              
              {/* Colored glow layer for atmosphere */}
              {lighting.lightSources.map((light) => (
                <Box
                  key={`glow-${light.id}`}
                  sx={{
                    position: 'absolute',
                    left: `${light.x}px`,
                    top: `${light.y}px`,
                    width: `${light.radius * 2.2}px`,
                    height: `${light.radius * 2.2}px`,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, 
                      ${light.color || '#FFA500'}44 0%, 
                      ${light.color || '#FFA500'}22 40%,
                      transparent 70%)`,
                    pointerEvents: 'none',
                    filter: `blur(${light.radius * 0.2}px)`,
                    zIndex: 101,
                  }}
                />
              ))}
            </>
          )}
        </Box>
      </Box>

      {/* Object count indicator */}
      {visibleObjects.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1000,
          }}
        >
          <Chip
            label={`Visible Objects: ${visibleObjects.length}`}
            size="small"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};
