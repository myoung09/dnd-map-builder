import React, { useState, useCallback, useEffect } from 'react';
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
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  Image as ImageIcon,
  AutoAwesome as AutoAwesomeIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Layers as LayersIcon,
  Collections as AssetsIcon,
  GridOn as GridIcon,
  Straighten as RulerIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import SimpleMapCanvas from './components/MapCanvas/SimpleMapCanvas';
import MapToolbar from './components/Toolbar/Toolbar';
import FileManager from './components/FileManager/FileManager';
import ImageExportDialog from './components/ImageExport/ImageExportDialog';
import { AIGenerationDialog } from './components/AIGeneration';
import { LayerPanel } from './components/LayerPanel';
import AssetBrowser from './components/AssetBrowser';
import GridSettings from './components/GridSettings';
import MeasurementTools from './components/MeasurementTools';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import WorkspaceManager from './components/WorkspaceManager/WorkspaceManager';
import WorkspaceNavigation from './components/WorkspaceNavigation/WorkspaceNavigation';
import { 
  DnDMap, 
  ViewportState, 
  ToolState, 
  ToolType, 
  TerrainType 
} from './types/map';
import { Workspace } from './types/workspace';
import { createNewMap } from './utils/mapUtils';
import { DEFAULT_MAP_DIMENSIONS } from './utils/constants';
import { useAutoSave } from './hooks/useAutoSave';
import { fileService } from './services/fileService';
import { mapEditingService } from './services/mapEditingService';
import workspaceService from './services/workspaceService';

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

  // Workspace state
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const [workspaceNavigationOpen, setWorkspaceNavigationOpen] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [imageExportOpen, setImageExportOpen] = useState(false);
  const [aiGenerationOpen, setAiGenerationOpen] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [assetBrowserOpen, setAssetBrowserOpen] = useState(false);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [measurementToolActive, setMeasurementToolActive] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<any[]>([]);
  const [measurementLines, setMeasurementLines] = useState<any[]>([]);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
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

  // AI generation handler
  const handleAiMapGenerated = useCallback((map: DnDMap) => {
    setCurrentMap(map);
    setIsDirty(false);
    showNotification(`AI generated map: ${map.metadata.name}`, 'success');
  }, [showNotification]);

  // Map editing handlers
  const handleMapChange = useCallback((map: DnDMap) => {
    setCurrentMap(map);
    setIsDirty(true);
  }, []);

  const handleObjectSelection = useCallback((objectIds: string[]) => {
    setSelectedObjects(objectIds);
  }, []);

  // Asset selection handler
  const handleAssetSelect = useCallback((asset: any) => {
    // Switch to object placement tool when an asset is selected
    setToolState(prev => ({
      ...prev,
      activeTool: ToolType.OBJECT_PLACE,
      selectedAsset: asset
    }));
    setAssetBrowserOpen(false);
    showNotification(`Selected asset: ${asset.name}`, 'info');
  }, [showNotification]);

  // Grid configuration handler
  const handleGridConfigChange = useCallback((gridConfig: any) => {
    setCurrentMap(prev => ({
      ...prev,
      gridConfig
    }));
    setIsDirty(true);
    showNotification('Grid settings updated', 'success');
  }, [showNotification]);

  // Workspace handlers
  const handleWorkspaceSelected = useCallback((workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setSelectedMapId(null);
    
    // If workspace has maps, load the first one
    if (workspace.maps.length > 0) {
      const firstMap = workspace.maps[0];
      setCurrentMap(firstMap.mapData);
      setSelectedMapId(firstMap.id);
      setIsDirty(false);
    }
    
    showNotification(`Loaded workspace: ${workspace.metadata.name}`, 'success');
  }, [showNotification]);

  const handleWorkspaceMapSelected = useCallback((mapId: string) => {
    if (!currentWorkspace) return;
    
    const workspaceMap = currentWorkspace.maps.find(m => m.id === mapId);
    if (workspaceMap) {
      setCurrentMap(workspaceMap.mapData);
      setSelectedMapId(mapId);
      setIsDirty(false);
      showNotification(`Opened map: ${workspaceMap.name}`, 'success');
    }
  }, [currentWorkspace, showNotification]);

  const handleWorkspaceChanged = useCallback((workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    
    // Update the current map in workspace if it's been modified
    if (selectedMapId && isDirty) {
      workspaceService.updateMap(selectedMapId, currentMap);
      setIsDirty(false);
    }
  }, [selectedMapId, isDirty, currentMap]);

  const handleAddMapToWorkspace = useCallback(() => {
    if (!currentWorkspace) {
      // Show workspace manager if no workspace is loaded
      setWorkspaceManagerOpen(true);
      return;
    }
    
    // Add current map to workspace
    workspaceService.addMap(currentMap, 'other');
    const updatedWorkspace = workspaceService.getCurrentWorkspace();
    if (updatedWorkspace) {
      setCurrentWorkspace(updatedWorkspace);
      setSelectedMapId(currentMap.metadata.id);
      showNotification(`Added map to workspace: ${currentMap.metadata.name}`, 'success');
    }
  }, [currentWorkspace, currentMap, showNotification]);

  // Measurement tool handlers
  const handleMeasurementToggle = useCallback(() => {
    setMeasurementToolActive(prev => !prev);
  }, []);

  const handleAddMeasurementPoint = useCallback((position: any) => {
    const newPoint = {
      id: `point-${Date.now()}`,
      position
    };
    setMeasurementPoints(prev => [...prev, newPoint]);
    
    // Calculate lines if we have at least 2 points
    setMeasurementLines(prev => {
      if (measurementPoints.length > 0) {
        const lastPoint = measurementPoints[measurementPoints.length - 1];
        const distance = Math.sqrt(
          Math.pow(position.x - lastPoint.position.x, 2) + 
          Math.pow(position.y - lastPoint.position.y, 2)
        );
        const gridDistance = distance / currentMap.gridConfig.cellSize;
        
        const newLine = {
          id: `line-${Date.now()}`,
          startPoint: lastPoint,
          endPoint: newPoint,
          distance,
          gridDistance
        };
        return [...prev, newLine];
      }
      return prev;
    });
  }, [measurementPoints, currentMap.gridConfig.cellSize]);

  const handleClearMeasurements = useCallback(() => {
    setMeasurementPoints([]);
    setMeasurementLines([]);
  }, []);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const result = mapEditingService.undo(currentMap);
    if (result.success) {
      setCurrentMap(result.updatedMap);
      setIsDirty(true);
      showNotification('Undid last action', 'info');
    }
  }, [currentMap, showNotification]);

  const handleRedo = useCallback(() => {
    const result = mapEditingService.redo(currentMap);
    if (result.success) {
      setCurrentMap(result.updatedMap);
      setIsDirty(true);
      showNotification('Redid last action', 'info');
    }
  }, [currentMap, showNotification]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';
      
      if (isInputField) return;

      // Ctrl/Cmd + Key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              handleRedo();
            } else {
              event.preventDefault();
              handleUndo();
            }
            break;
          case 'y':
            event.preventDefault();
            handleRedo();
            break;
          case 's':
            event.preventDefault();
            fileService.saveMapToStorage(currentMap);
            showNotification('Map saved', 'success');
            setIsDirty(false);
            break;
          case 'n':
            event.preventDefault();
            handleNewMap();
            break;
          case 'o':
            event.preventDefault();
            setFileManagerOpen(true);
            break;
          case 'e':
            event.preventDefault();
            setImageExportOpen(true);
            break;
          case 'g':
            event.preventDefault();
            setGridSettingsOpen(true);
            break;
          case 'l':
            event.preventDefault();
            setLayerPanelOpen(true);
            break;
          case 'a':
            event.preventDefault();
            setAssetBrowserOpen(true);
            break;
          case 'i':
            event.preventDefault();
            setAiGenerationOpen(true);
            break;
          case '?':
          case '/':
            event.preventDefault();
            setKeyboardShortcutsOpen(true);
            break;
        }
      }
      
      // Single key shortcuts (no modifier)
      else {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            handleToolChange(ToolType.BRUSH);
            break;
          case 'e':
            event.preventDefault();
            handleToolChange(ToolType.ERASER);
            break;
          case 's':
            event.preventDefault();
            handleToolChange(ToolType.SELECT);
            break;
          case 'r':
            event.preventDefault();
            handleToolChange(ToolType.RECTANGLE);
            break;
          case 'c':
            event.preventDefault();
            handleToolChange(ToolType.CIRCLE);
            break;
          case 'o':
            event.preventDefault();
            handleToolChange(ToolType.OBJECT_PLACE);
            break;
          case 'g':
            event.preventDefault();
            setCurrentMap(prev => ({
              ...prev,
              gridConfig: {
                ...prev.gridConfig,
                showGrid: !prev.gridConfig.showGrid
              }
            }));
            showNotification(`Grid ${currentMap.gridConfig.showGrid ? 'hidden' : 'shown'}`, 'info');
            break;
          case 'm':
            event.preventDefault();
            handleMeasurementToggle();
            break;
          case 'Escape':
            // Close any open dialogs/panels
            setFileManagerOpen(false);
            setImageExportOpen(false);
            setAiGenerationOpen(false);
            setLayerPanelOpen(false);
            setAssetBrowserOpen(false);
            setGridSettingsOpen(false);
            setMeasurementToolActive(false);
            setKeyboardShortcutsOpen(false);
            break;
          // Number keys for brush size
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            event.preventDefault();
            const size = parseInt(event.key);
            handleBrushSizeChange(size);
            showNotification(`Brush size: ${size}`, 'info');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo, 
    handleRedo, 
    currentMap, 
    showNotification, 
    handleNewMap, 
    handleToolChange,
    handleBrushSizeChange,
    handleMeasurementToggle,
    setIsDirty
  ]);

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
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
              {currentWorkspace && (
                <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                  {currentWorkspace.metadata.name}
                </Typography>
              )}
              <Typography variant="body2" color="inherit">
                {currentMap.metadata.name} {isDirty && '(unsaved)'}
              </Typography>
            </Box>
            <Button
              color="inherit"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setAiGenerationOpen(true)}
              sx={{ mr: 1 }}
            >
              AI Generate
            </Button>
            <IconButton
              color="inherit"
              onClick={() => setLayerPanelOpen(true)}
              title="Layers Panel"
            >
              <LayersIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => setAssetBrowserOpen(true)}
              title="Asset Library"
            >
              <AssetsIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => setGridSettingsOpen(true)}
              title="Grid Settings"
            >
              <GridIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleMeasurementToggle}
              title="Measurement Tools"
              sx={{
                backgroundColor: measurementToolActive ? 'primary.main' : 'transparent',
                '&:hover': {
                  backgroundColor: measurementToolActive ? 'primary.dark' : 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <RulerIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => setFileManagerOpen(true)}
              title="File Manager"
            >
              <FolderIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => setKeyboardShortcutsOpen(true)}
              title="Keyboard Shortcuts (Ctrl+?)"
            >
              <HelpIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* File Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { setWorkspaceManagerOpen(true); handleMenuClose(); }}>
            <FolderIcon sx={{ mr: 1 }} />
            Workspace Manager...
          </MenuItem>
          <MenuItem 
            onClick={() => { setWorkspaceNavigationOpen(true); handleMenuClose(); }}
            disabled={!currentWorkspace}
          >
            <FolderOpenIcon sx={{ mr: 1 }} />
            Browse Maps
          </MenuItem>
          <MenuItem 
            onClick={() => { handleAddMapToWorkspace(); handleMenuClose(); }}
            disabled={!currentMap}
          >
            <AddIcon sx={{ mr: 1 }} />
            Add to Workspace
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleNewMap(); handleMenuClose(); }}>
            <AddIcon sx={{ mr: 1 }} />
            New Map
          </MenuItem>
          <MenuItem onClick={() => { setAiGenerationOpen(true); handleMenuClose(); }}>
            <AutoAwesomeIcon sx={{ mr: 1 }} />
            Generate with AI...
          </MenuItem>
          <MenuItem onClick={() => { setFileManagerOpen(true); handleMenuClose(); }}>
            <FolderIcon sx={{ mr: 1 }} />
            Open Map...
          </MenuItem>
          <MenuItem onClick={() => { setLayerPanelOpen(true); handleMenuClose(); }}>
            <LayersIcon sx={{ mr: 1 }} />
            Manage Layers...
          </MenuItem>
          <MenuItem onClick={() => { setAssetBrowserOpen(true); handleMenuClose(); }}>
            <AssetsIcon sx={{ mr: 1 }} />
            Asset Library...
          </MenuItem>
          <MenuItem onClick={() => { setGridSettingsOpen(true); handleMenuClose(); }}>
            <GridIcon sx={{ mr: 1 }} />
            Grid Settings...
          </MenuItem>
          <MenuItem onClick={() => { handleMeasurementToggle(); handleMenuClose(); }}>
            <RulerIcon sx={{ mr: 1 }} />
            Measurement Tools
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => { handleUndo(); handleMenuClose(); }}
            disabled={!mapEditingService.canUndo()}
          >
            <UndoIcon sx={{ mr: 1 }} />
            Undo (Ctrl+Z)
          </MenuItem>
          <MenuItem 
            onClick={() => { handleRedo(); handleMenuClose(); }}
            disabled={!mapEditingService.canRedo()}
          >
            <RedoIcon sx={{ mr: 1 }} />
            Redo (Ctrl+Y)
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
          <Divider />
          <MenuItem onClick={() => { setKeyboardShortcutsOpen(true); handleMenuClose(); }}>
            <HelpIcon sx={{ mr: 1 }} />
            Keyboard Shortcuts...
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

          {/* Layer Panel (if open) */}
          {layerPanelOpen && (
            <LayerPanel
              map={currentMap}
              onMapChange={handleMapChange}
              activeLayerId={toolState.selectedLayer}
              onActiveLayerChange={(layerId) => 
                setToolState(prev => ({ ...prev, selectedLayer: layerId }))
              }
              onClose={() => setLayerPanelOpen(false)}
            />
          )}

          {/* Map Canvas */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <SimpleMapCanvas
              map={currentMap}
              onMapChange={handleMapChange}
              width={800}
              height={600}
              viewport={viewportState}
              onViewportChange={handleViewportChange}
              toolState={toolState}
              selectedObjects={selectedObjects}
              onObjectSelection={handleObjectSelection}
              showGrid={true}
              gridSize={32}
            />
          </Box>

          {/* Properties Panel */}
          <Box 
            sx={{ 
              width: 300, 
              backgroundColor: 'background.paper',
              borderLeft: 1,
              borderColor: 'divider',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Map Properties
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Size: {currentMap.dimensions.width} × {currentMap.dimensions.height}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Zoom: {Math.round(viewportState.zoom * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tool: {toolState.activeTool}
            </Typography>
            
            {selectedObjects.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Selected Objects
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedObjects.length} object(s) selected
                </Typography>
                <Button 
                  size="small" 
                  color="error"
                  onClick={() => {
                    selectedObjects.forEach(id => {
                      const result = mapEditingService.deleteObject(currentMap, id);
                      if (result.success) {
                        setCurrentMap(result.updatedMap);
                        setIsDirty(true);
                      }
                    });
                    setSelectedObjects([]);
                    showNotification('Deleted selected objects', 'info');
                  }}
                  sx={{ mt: 1 }}
                >
                  Delete Selected
                </Button>
              </Box>
            )}

            <Box>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleUndo}
                  disabled={!mapEditingService.canUndo()}
                  startIcon={<UndoIcon />}
                >
                  Undo
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleRedo}
                  disabled={!mapEditingService.canRedo()}
                  startIcon={<RedoIcon />}
                >
                  Redo
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                History: {mapEditingService.getHistoryInfo().undoCount} undos, {mapEditingService.getHistoryInfo().redoCount} redos
              </Typography>
            </Box>
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

        {/* AI Generation Dialog */}
        <AIGenerationDialog
          open={aiGenerationOpen}
          onClose={() => setAiGenerationOpen(false)}
          onMapGenerated={handleAiMapGenerated}
        />

        {/* Asset Browser */}
        <AssetBrowser
          isOpen={assetBrowserOpen}
          onClose={() => setAssetBrowserOpen(false)}
          onAssetSelect={handleAssetSelect}
          selectedObjectType={toolState.selectedObjectType}
        />

        {/* Grid Settings */}
        <GridSettings
          open={gridSettingsOpen}
          onClose={() => setGridSettingsOpen(false)}
          gridConfig={currentMap.gridConfig}
          onGridConfigChange={handleGridConfigChange}
        />

        {/* Measurement Tools */}
        <MeasurementTools
          gridConfig={currentMap.gridConfig}
          isActive={measurementToolActive}
          onToggle={handleMeasurementToggle}
          viewportZoom={viewportState.zoom}
          measurementPoints={measurementPoints}
          measurementLines={measurementLines}
          onAddPoint={handleAddMeasurementPoint}
          onClearMeasurements={handleClearMeasurements}
        />

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcuts
          open={keyboardShortcutsOpen}
          onClose={() => setKeyboardShortcutsOpen(false)}
        />

        {/* Workspace Manager */}
        <WorkspaceManager
          open={workspaceManagerOpen}
          onClose={() => setWorkspaceManagerOpen(false)}
          onWorkspaceSelected={handleWorkspaceSelected}
          currentWorkspace={currentWorkspace}
        />

        {/* Workspace Navigation */}
        <WorkspaceNavigation
          workspace={currentWorkspace}
          selectedMapId={selectedMapId}
          onMapSelected={handleWorkspaceMapSelected}
          onWorkspaceChanged={handleWorkspaceChanged}
          open={workspaceNavigationOpen}
          onClose={() => setWorkspaceNavigationOpen(false)}
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

        {/* Enhanced Status Bar */}
        <Box 
          sx={{ 
            height: 32, 
            backgroundColor: 'background.paper', 
            borderTop: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Ready
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tool: {toolState.activeTool}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Brush: {toolState.brushSize}px
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Layers: {currentMap.layers.length}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Grid: {currentMap.gridConfig.cellSize}px {currentMap.gridConfig.showGrid ? '(visible)' : '(hidden)'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Zoom: {Math.round(viewportState.zoom * 100)}%
            </Typography>
            {measurementToolActive && (
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                📏 Measuring
              </Typography>
            )}
            {isDirty && (
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                • Unsaved
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Press ? for shortcuts
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
