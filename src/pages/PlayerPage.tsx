// Player Route - Read-only player view with DM-controlled visibility

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Chip, Alert, CircularProgress, Typography } from '@mui/material';
import { MapCanvas, MapCanvasRef } from '../components/MapCanvas';
import { wsService } from '../services/websocket';
import {
  LightingState,
  DMObject,
  DMSessionState,
  WSEventType,
  WSEvent,
} from '../types/dm';
import { MapData } from '../types/generator';

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
  const canvasRef = useRef<MapCanvasRef>(null);

  // Player view state (controlled by DM)
  const [lighting, setLighting] = useState<LightingState>({
    brightness: 1,
    contrast: 1,
    fogOfWarEnabled: false,
    lightSources: [],
  });

  const [visibleObjects, setVisibleObjects] = useState<DMObject[]>([]);

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
        
        setLighting(state.lighting);
        setVisibleObjects(state.objects.filter((o) => o.visibleToPlayers));
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
    <Box sx={{ height: '100vh', bgcolor: 'background.default', position: 'relative' }}>
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

      {/* Map Canvas - Read-only */}
      <MapCanvas
        ref={canvasRef}
        mapData={mapData}
        cellSize={20}
        showGrid={true}
        showRooms={true}
        showCorridors={true}
        showTrees={true}
        showObjects={true}
        placedObjects={[]}
        spritesheets={[]}
      />

      {/* Lighting overlay (if fog of war is enabled) */}
      {lighting.fogOfWarEnabled && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 80%)',
          }}
        />
      )}

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
