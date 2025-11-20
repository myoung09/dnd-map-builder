// DM Route - Dungeon Master control interface

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  WbSunny as BrightnessIcon,
  Contrast as ContrastIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Refresh as SyncIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { MapCanvas, MapCanvasRef } from '../components/MapCanvas';
import { wsService } from '../services/websocket';
import {
  LightingState,
  LightSource,
  DMObject,
  DMSessionState,
  WSEventType,
} from '../types/dm';
import { MapData } from '../types/generator';
import { PlacedObject } from '../types/objects';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dm-tabpanel-${index}`}
      aria-labelledby={`dm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const DMPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract passed state from navigation
  const passedState = location.state as {
    mapData?: MapData | null;
    workspace?: any;
    palette?: any;
    placedObjects?: PlacedObject[];
    spritesheets?: any[];
    sessionId?: string;
  } | null;
  
  const [tabValue, setTabValue] = useState(0);
  const [sessionId] = useState(passedState?.sessionId || `session_${Date.now()}`);
  const [connected, setConnected] = useState(false);
  const [mapData] = useState<MapData | null>(passedState?.mapData || null);
  const [placedObjects] = useState<PlacedObject[]>(
    passedState?.placedObjects || []
  );
  const canvasRef = useRef<MapCanvasRef>(null);

  // Lighting state
  const [lighting, setLighting] = useState<LightingState>({
    brightness: 1,
    contrast: 1,
    fogOfWarEnabled: false,
    lightSources: [],
  });

  // Objects state - convert PlacedObjects to DMObjects
  const [dmObjects, setDmObjects] = useState<DMObject[]>(
    placedObjects.map((obj, index) => ({
      id: obj.id || `object-${index}`,
      spriteId: obj.spriteId,
      x: obj.gridX,
      y: obj.gridY,
      category: 'environment', // Default category
      visibleToPlayers: true,
      notes: '',
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      rotation: obj.rotation,
      zIndex: obj.zIndex,
    }))
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Light placement state
  const [lightPlacementMode, setLightPlacementMode] = useState(false);
  const [selectedLightType, setSelectedLightType] = useState<'torch' | 'lantern' | 'spell' | 'ambient'>('torch');

  // Session state
  const [sessionName, setSessionName] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    wsService
      .connect(sessionId, 'dm')
      .then(() => {
        setConnected(true);
        console.log('[DMPage] Connected to session:', sessionId);
        
        // Send initial sync with map data to any connected players
        const initialState: DMSessionState = {
          sessionId,
          workspaceId: 'workspace_1',
          mapId: 'map_1',
          mapData: mapData,
          lighting,
          objects: dmObjects,
          revealedAreas: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        wsService.send({
          type: WSEventType.SYNC_NOW,
          payload: {
            sessionState: initialState,
          },
        });
        console.log('[DMPage] Sent initial sync with map data');
      })
      .catch((error) => {
        console.error('[DMPage] Connection failed:', error);
      });

    return () => {
      wsService.disconnect();
    };
  }, [sessionId, mapData, lighting, dmObjects]);

  // Handle lighting changes
  const handleBrightnessChange = useCallback((value: number) => {
    setLighting((prev) => {
      const updated = { ...prev, brightness: value };
      // Broadcast lighting update
      wsService.send({
        type: WSEventType.LIGHTING_UPDATE,
        payload: updated,
      });
      return updated;
    });
  }, []);

  const handleContrastChange = useCallback((value: number) => {
    setLighting((prev) => {
      const updated = { ...prev, contrast: value };
      wsService.send({
        type: WSEventType.LIGHTING_UPDATE,
        payload: updated,
      });
      return updated;
    });
  }, []);

  const handleFogOfWarToggle = useCallback(() => {
    setLighting((prev) => {
      const updated = { ...prev, fogOfWarEnabled: !prev.fogOfWarEnabled };
      wsService.send({
        type: WSEventType.LIGHTING_UPDATE,
        payload: updated,
      });
      return updated;
    });
  }, []);

  const handleAddLightSource = useCallback(() => {
    // Enable light placement mode
    setLightPlacementMode(true);
    console.log('[DMPage] Light placement mode enabled. Click on map to place light.');
  }, []);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!lightPlacementMode || !canvasRef.current) return;

    // Get the actual canvas element
    const canvasElement = canvasRef.current.getCanvas?.();
    if (!canvasElement) {
      console.warn('[DMPage] Canvas element not found');
      return;
    }

    // Get click position relative to the actual canvas element
    const canvasRect = canvasElement.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    console.log('[DMPage] Click position relative to canvas:', x, y);

    // Get light properties based on type
    const lightProperties = {
      torch: { radius: 100, intensity: 0.8, color: '#FFA500' },
      lantern: { radius: 150, intensity: 0.9, color: '#FFD700' },
      spell: { radius: 200, intensity: 1.0, color: '#00BFFF' },
      ambient: { radius: 300, intensity: 0.5, color: '#FFFFFF' },
    };

    const props = lightProperties[selectedLightType];

    const newLight: LightSource = {
      id: `light_${Date.now()}`,
      x,
      y,
      radius: props.radius,
      intensity: props.intensity,
      color: props.color,
      type: selectedLightType,
    };

    setLighting((prev) => {
      const updated = { ...prev, lightSources: [...prev.lightSources, newLight] };
      wsService.send({
        type: WSEventType.LIGHTING_UPDATE,
        payload: updated,
      });
      return updated;
    });

    // Disable placement mode after placing
    setLightPlacementMode(false);
    console.log('[DMPage] Light source placed at', x, y);
  }, [lightPlacementMode, selectedLightType]);

  const handleRemoveLightSource = useCallback((lightId: string) => {
    setLighting((prev) => {
      const updated = {
        ...prev,
        lightSources: prev.lightSources.filter((l) => l.id !== lightId),
      };
      wsService.send({
        type: WSEventType.LIGHTING_UPDATE,
        payload: updated,
      });
      return updated;
    });
  }, []);

  // Handle object visibility toggle
  const handleToggleObjectVisibility = useCallback((objectId: string) => {
    setDmObjects((prev) => {
      const updated = prev.map((obj) =>
        obj.id === objectId ? { ...obj, visibleToPlayers: !obj.visibleToPlayers } : obj
      );
      const updatedObj = updated.find((o) => o.id === objectId);
      if (updatedObj) {
        wsService.send({
          type: WSEventType.OBJECT_UPDATED,
          payload: updatedObj,
        });
      }
      return updated;
    });
  }, []);

  // Handle sync now
  const handleSyncNow = useCallback(() => {
    const sessionState: DMSessionState = {
      sessionId,
      workspaceId: 'workspace_1',
      mapId: 'map_1',
      mapData: mapData,
      lighting,
      objects: dmObjects,
      revealedAreas: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    wsService.send({
      type: WSEventType.SYNC_NOW,
      payload: { sessionState },
    });

    console.log('[DMPage] Synced session state');
  }, [sessionId, mapData, lighting, dmObjects]);

  // Handle session save
  const handleSaveSession = useCallback(() => {
    const sessionState: DMSessionState = {
      sessionId,
      workspaceId: 'workspace_1',
      mapId: 'map_1',
      mapData: mapData,
      lighting,
      objects: dmObjects,
      revealedAreas: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    wsService.send({
      type: WSEventType.SESSION_SAVE,
      payload: {
        workspaceId: 'workspace_1',
        sessionData: sessionState,
      },
    });

    setLastSaved(new Date());
    console.log('[DMPage] Session saved');
  }, [sessionId, mapData, lighting, dmObjects]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">DM Campaign View</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/')}
        >
          Back to Builder
        </Button>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map Canvas - Centered */}
        <Box 
          sx={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Canvas wrapper for click handling and light positioning */}
          <Box
            sx={{
              position: 'relative',
              cursor: lightPlacementMode ? 'crosshair' : 'default',
            }}
            onClick={handleMapClick}
          >
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
            
            {/* Light source indicators on DM map */}
            {lighting.lightSources.map((light) => (
              <Box
                key={`indicator-${light.id}`}
                sx={{
                  position: 'absolute',
                  left: `${light.x}px`,
                  top: `${light.y}px`,
                  width: `${light.radius * 2}px`,
                  height: `${light.radius * 2}px`,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: `2px dashed ${light.color || '#FFA500'}`,
                  backgroundColor: `${light.color || '#FFA500'}22`,
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              />
            ))}
          </Box>
          
          {/* Connection status */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 1000,
            }}
          >
            <Chip
              label={connected ? 'Connected' : 'Disconnected'}
              color={connected ? 'success' : 'error'}
              size="small"
            />
          </Box>
          
          {/* Light placement indicator */}
          {lightPlacementMode && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <Chip
                label={`Click to place ${selectedLightType}`}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Box>

        {/* Control Panel */}
        <Paper
          sx={{
            width: 400,
            height: '100%',
            overflow: 'auto',
            borderLeft: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
              <Tab label="Lighting" />
              <Tab label="Objects" />
              <Tab label="Sync" />
            </Tabs>
          </Box>

        {/* Lighting Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Lighting Controls
          </Typography>

          {/* Brightness */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BrightnessIcon sx={{ mr: 1 }} />
              <Typography>Brightness: {lighting.brightness.toFixed(2)}</Typography>
            </Box>
            <Slider
              value={lighting.brightness}
              onChange={(_, value) => handleBrightnessChange(value as number)}
              min={0}
              max={2}
              step={0.1}
              marks={[
                { value: 0, label: 'Dark' },
                { value: 1, label: 'Normal' },
                { value: 2, label: 'Bright' },
              ]}
            />
          </Box>

          {/* Contrast */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ContrastIcon sx={{ mr: 1 }} />
              <Typography>Contrast: {lighting.contrast.toFixed(2)}</Typography>
            </Box>
            <Slider
              value={lighting.contrast}
              onChange={(_, value) => handleContrastChange(value as number)}
              min={0}
              max={2}
              step={0.1}
              marks={[
                { value: 0, label: 'Low' },
                { value: 1, label: 'Normal' },
                { value: 2, label: 'High' },
              ]}
            />
          </Box>

          {/* Fog of War */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch checked={lighting.fogOfWarEnabled} onChange={handleFogOfWarToggle} />
              }
              label="Fog of War"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Light Sources */}
          <Typography variant="subtitle1" gutterBottom>
            Light Sources
          </Typography>
          
          {/* Light Type Selector */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Light Type</InputLabel>
            <Select
              value={selectedLightType}
              label="Light Type"
              onChange={(e) => setSelectedLightType(e.target.value as any)}
            >
              <MenuItem value="torch">🔥 Torch (100px, warm)</MenuItem>
              <MenuItem value="lantern">🏮 Lantern (150px, bright)</MenuItem>
              <MenuItem value="spell">✨ Magical (200px, blue)</MenuItem>
              <MenuItem value="ambient">💡 Ambient (300px, soft)</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant={lightPlacementMode ? "contained" : "outlined"}
            color={lightPlacementMode ? "primary" : "inherit"}
            onClick={handleAddLightSource}
            fullWidth
            sx={{ mb: 2 }}
          >
            {lightPlacementMode ? '🎯 Click on Map to Place' : 'Add Light Source'}
          </Button>

          {lighting.lightSources.map((light) => (
            <Paper key={light.id} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{light.type}</Typography>
                <IconButton size="small" onClick={() => handleRemoveLightSource(light.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="caption">
                Position: ({light.x}, {light.y}) | Radius: {light.radius}
              </Typography>
            </Paper>
          ))}
        </TabPanel>

        {/* Objects Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Object Management
          </Typography>

          {/* Category Filter */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="monster">Monsters</MenuItem>
              <MenuItem value="trap">Traps</MenuItem>
              <MenuItem value="npc">NPCs</MenuItem>
              <MenuItem value="treasure">Treasure</MenuItem>
              <MenuItem value="environment">Environment</MenuItem>
            </Select>
          </FormControl>

          {/* Quick Actions */}
          <Typography variant="subtitle2" gutterBottom>
            Quick Add
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Button size="small" variant="outlined">
              Goblin
            </Button>
            <Button size="small" variant="outlined">
              Dragon
            </Button>
            <Button size="small" variant="outlined">
              Trap
            </Button>
            <Button size="small" variant="outlined">
              Chest
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Objects List */}
          <Typography variant="subtitle2" gutterBottom>
            Placed Objects ({dmObjects.length})
          </Typography>
          {dmObjects
            .filter((obj) => selectedCategory === 'all' || obj.category === selectedCategory)
            .map((obj) => (
              <Paper key={obj.id} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">{obj.name || obj.category}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({obj.x}, {obj.y})
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleObjectVisibility(obj.id)}
                    color={obj.visibleToPlayers ? 'primary' : 'default'}
                  >
                    {obj.visibleToPlayers ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                </Box>
              </Paper>
            ))}
        </TabPanel>

        {/* Sync Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Session Management
          </Typography>

          {/* Session Info */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2">Session ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
              {sessionId}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Player Link</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <TextField
                size="small"
                fullWidth
                value={`${window.location.origin}/player?session=${sessionId}`}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/player?session=${sessionId}`);
                  // Could add a snackbar notification here
                }}
              >
                Copy
              </Button>
            </Box>
            
            {lastSaved && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Last saved: {lastSaved.toLocaleTimeString()}
              </Typography>
            )}
          </Paper>

          {/* Session Name */}
          <TextField
            fullWidth
            label="Session Name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* Actions */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<SyncIcon />}
            onClick={handleSyncNow}
            sx={{ mb: 2 }}
          >
            Sync Now
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveSession}
            sx={{ mb: 2 }}
          >
            Save Session
          </Button>

          <Divider sx={{ my: 3 }} />

          {/* Stats */}
          <Typography variant="subtitle2" gutterBottom>
            Session Stats
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              Objects: {dmObjects.length}
            </Typography>
            <Typography variant="body2">
              Visible Objects: {dmObjects.filter((o) => o.visibleToPlayers).length}
            </Typography>
            <Typography variant="body2">
              Light Sources: {lighting.lightSources.length}
            </Typography>
            <Typography variant="body2">
              Fog of War: {lighting.fogOfWarEnabled ? 'Enabled' : 'Disabled'}
            </Typography>
          </Box>

          {!connected && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Not connected to session. Changes will not be synchronized.
            </Alert>
          )}
        </TabPanel>
      </Paper>
      </Box>
    </Box>
  );
};
