import React, { useState, useCallback } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography
} from '@mui/material';
import SimpleMapCanvas from './components/MapCanvas/SimpleMapCanvas';
import MapToolbar from './components/Toolbar/Toolbar';
import { 
  DnDMap, 
  ViewportState, 
  Position, 
  ToolState, 
  ToolType, 
  TerrainType,
  Color 
} from './types/map';
import { createNewMap } from './utils/mapUtils';
import { DEFAULT_MAP_DIMENSIONS } from './utils/constants';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  // Initialize with a default map
  const [currentMap, setCurrentMap] = useState<DnDMap>(() => 
    createNewMap('New Dungeon Map', DEFAULT_MAP_DIMENSIONS)
  );

  const [viewportState, setViewportState] = useState<ViewportState>({
    position: { x: 50, y: 50 },
    zoom: 1.0,
    rotation: 0
  });

  const [toolState, setToolState] = useState<ToolState>({
    activeTool: ToolType.BRUSH,
    brushSize: 1,
    selectedTerrainType: TerrainType.WALL,
    selectedObjectType: 'furniture' as any,
    selectedColor: { r: 64, g: 64, b: 64 },
    selectedLayer: currentMap.layers[1].id // Terrain layer
  });

  const [selectedTiles, setSelectedTiles] = useState<Position[]>([]);

  // Handle viewport changes
  const handleViewportChange = useCallback((newViewport: ViewportState) => {
    setViewportState(newViewport);
  }, []);

  // Handle tile clicks
  const handleTileClick = useCallback((position: Position) => {
    console.log('Tile clicked:', position);
    // TODO: Implement tile editing based on current tool
    
    // For now, just select the tile
    setSelectedTiles([position]);
  }, []);

  // Handle tile hover
  const handleTileHover = useCallback((position: Position | null) => {
    console.log('Tile hovered:', position);
    // TODO: Implement hover effects
  }, []);

  // Handle tool changes
  const handleToolChange = useCallback((tool: ToolType) => {
    setToolState(prev => ({ ...prev, activeTool: tool }));
  }, []);

  const handleBrushSizeChange = useCallback((size: number) => {
    setToolState(prev => ({ ...prev, brushSize: size }));
  }, []);

  const handleTerrainTypeChange = useCallback((terrainType: TerrainType) => {
    setToolState(prev => ({ ...prev, selectedTerrainType: terrainType }));
  }, []);

  const handleColorChange = useCallback((color: any) => {
    setToolState(prev => ({ ...prev, selectedColor: color }));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static" sx={{ zIndex: 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              D&D Map Builder
            </Typography>
            <Typography variant="body2" color="inherit">
              {currentMap.metadata.name}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Toolbar Panel */}
          <MapToolbar
            activeTool={toolState.activeTool}
            onToolChange={handleToolChange}
            brushSize={toolState.brushSize}
            onBrushSizeChange={handleBrushSizeChange}
            selectedTerrainType={toolState.selectedTerrainType}
            onTerrainTypeChange={handleTerrainTypeChange}
            selectedColor={toolState.selectedColor}
            onColorChange={handleColorChange}
          />

          {/* Map Canvas */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <SimpleMapCanvas
              width={800}
              height={600}
            />
          </Box>

          {/* Side Panel - TODO: Implement in next phase */}
          <Box 
            sx={{ 
              width: 300, 
              backgroundColor: 'background.paper',
              borderLeft: 1,
              borderColor: 'divider',
              p: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Properties
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Map: {currentMap.dimensions.width} × {currentMap.dimensions.height}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Zoom: {Math.round(viewportState.zoom * 100)}%
            </Typography>
            {selectedTiles.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Selected: ({selectedTiles[0].x}, {selectedTiles[0].y})
              </Typography>
            )}
          </Box>
        </Box>

        {/* Status Bar */}
        <Box 
          sx={{ 
            height: 30, 
            backgroundColor: 'background.paper', 
            borderTop: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Ready • {currentMap.layers.length} layers • Grid: {currentMap.gridConfig.cellSize}px
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
