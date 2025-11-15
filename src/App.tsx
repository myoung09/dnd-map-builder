import React, { useState, useCallback } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Save as SaveIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import SimpleMapCanvas from './components/MapCanvas/SimpleMapCanvas';
import MapToolbar from './components/Toolbar/Toolbar';
import FileManager from './components/FileManager/FileManager';
import ImageExportDialog from './components/ImageExport/ImageExportDialog';
import { 
  DnDMap, 
  ViewportState, 
  Position, 
  ToolState, 
  ToolType, 
  TerrainType 
} from './types/map';
import { createNewMap } from './utils/mapUtils';
import { DEFAULT_MAP_DIMENSIONS } from './utils/constants';
import { useAutoSave } from './hooks/useAutoSave';
import { fileService } from './services/fileService';

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
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [imageExportOpen, setImageExportOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Auto-save functionality
  useAutoSave({
    map: currentMap,
    isDirty,
    onAutoSave: () => {
      setNotification({
        open: true,
        message: 'Map auto-saved',
        severity: 'info'
      });
    },
    enabled: true
  });

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

  // File management handlers
  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const handleNewMap = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Create new map anyway?')) {
      return;
    }
    
    const newMap = createNewMap('New Map', DEFAULT_MAP_DIMENSIONS);
    setCurrentMap(newMap);
    setIsDirty(false);
    showNotification('New map created', 'success');
  }, [isDirty, showNotification]);

  const handleLoadMap = useCallback((map: DnDMap) => {
    setCurrentMap(map);
    setIsDirty(false);
    showNotification(`Loaded map: ${map.metadata.name}`, 'success');
  }, [showNotification]);

  const handleSaveMap = useCallback((map: DnDMap) => {
    setCurrentMap(map);
    setIsDirty(false);
    showNotification(`Saved map: ${map.metadata.name}`, 'success');
  }, [showNotification]);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static" sx={{ zIndex: 1 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              D&D Map Builder
            </Typography>
            <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>
              {currentMap.metadata.name} {isDirty && '(unsaved)'}
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => setFileManagerOpen(true)}
              title="File Manager"
            >
              <FolderIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* File Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { handleNewMap(); handleMenuClose(); }}>
            <AddIcon sx={{ mr: 1 }} />
            New Map
          </MenuItem>
          <MenuItem onClick={() => { setFileManagerOpen(true); handleMenuClose(); }}>
            <FolderIcon sx={{ mr: 1 }} />
            Open Map...
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { 
            fileService.saveMapToStorage(currentMap);
            showNotification('Map saved', 'success');
            handleMenuClose();
          }}>
            <SaveIcon sx={{ mr: 1 }} />
            Save Map
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setImageExportOpen(true); handleMenuClose(); }}>
            <ImageIcon sx={{ mr: 1 }} />
            Export as Image...
          </MenuItem>
        </Menu>

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

        {/* File Manager Dialog */}
        <FileManager
          open={fileManagerOpen}
          onClose={() => setFileManagerOpen(false)}
          currentMap={currentMap}
          onLoadMap={handleLoadMap}
          onSaveMap={handleSaveMap}
        />

        {/* Image Export Dialog */}
        <ImageExportDialog
          open={imageExportOpen}
          onClose={() => setImageExportOpen(false)}
          map={currentMap}
        />

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

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
