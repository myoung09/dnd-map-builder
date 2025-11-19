import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import { TerrainType, GeneratorParameters, MapData } from './types/generator';
import { PlacedObject, PlacementMode, SpriteSheet } from './types/objects';
import { Workspace } from './types/workspace';
import { MapCanvas, MapCanvasRef } from './components/MapCanvas';
import ObjectPalette from './components/ObjectPalette';
import { TopMenuBar } from './components/TopMenuBar';
import ControlDrawer from './components/ControlDrawer';
import { CampaignWizard } from './components/CampaignWizard';
import { WorkspaceView } from './components/WorkspaceView';
import { HouseGenerator } from './generators/HouseGenerator';
import { ForestGenerator } from './generators/ForestGenerator';
import { CaveGenerator } from './generators/CaveGenerator';
import { DungeonGenerator } from './generators/DungeonGenerator';
import { getPresetByName, getPresetsByTerrain } from './utils/presets';
import { ExportUtils } from './utils/export';
import { WorkspaceManager } from './utils/workspaceManager';
import { ParsedCampaignData } from './utils/campaignParser';
import { Box, ThemeProvider, createTheme, CssBaseline, Drawer } from '@mui/material';

// Create dark theme following Material Design guidelines
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#2ecc71',
    },
    background: {
      default: '#1a1a1a',
      paper: '#252525',
    },
  },
});

function App() {
  const [terrain, setTerrain] = useState<TerrainType>(TerrainType.Dungeon);
  const [parameters, setParameters] = useState<GeneratorParameters>({
    width: 80,
    height: 80,
    seed: Date.now(),
    minRoomSize: 5,
    maxRoomSize: 10,
    roomCount: 8,
    corridorWidth: 1,
    organicFactor: 0.3,
    connectivityFactor: 0.15
  });
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRooms, setShowRooms] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showTrees, setShowTrees] = useState(true);
  const [cellSize, setCellSize] = useState(4);
  
  // Object placement state
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [spritesheets, setSpritesheets] = useState<SpriteSheet[]>([]);
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<PlacementMode>(PlacementMode.None);
  const [showObjectLayer, setShowObjectLayer] = useState(true);
  const [showPalette, setShowPalette] = useState(false);
  
  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Pan and zoom state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Campaign workspace state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [workspaceViewOpen, setWorkspaceViewOpen] = useState(false);
  
  const canvasRef = useRef<MapCanvasRef>(null);

  const generateMap = useCallback(() => {
    setIsGenerating(true);
    try {
      let generator;
      
      switch (terrain) {
        case TerrainType.House:
          generator = new HouseGenerator(parameters);
          break;
        case TerrainType.Forest:
          generator = new ForestGenerator(parameters);
          break;
        case TerrainType.Cave:
          generator = new CaveGenerator(parameters);
          break;
        case TerrainType.Dungeon:
          generator = new DungeonGenerator(parameters);
          break;
        default:
          generator = new DungeonGenerator(parameters);
      }

      const generated = generator.generate();
      setMapData(generated);
    } finally {
      setIsGenerating(false);
    }
  }, [terrain, parameters]);

  const handleTerrainChange = (newTerrain: TerrainType) => {
    setTerrain(newTerrain);
    
    // Load default preset for this terrain if available
    const presets = getPresetsByTerrain(newTerrain);
    if (presets.length > 0) {
      setParameters({
        ...presets[0].parameters,
        seed: Date.now()
      });
    }
  };

  const handlePresetLoad = (presetName: string) => {
    const preset = getPresetByName(presetName);
    if (preset) {
      setTerrain(preset.terrainType);
      setParameters({
        ...preset.parameters,
        seed: Date.now()
      });
    }
  };

  const handleRandomSeed = () => {
    setParameters({
      ...parameters,
      seed: Date.now()
    });
  };

  const handleExportPNG = () => {
    if (canvasRef.current && mapData) {
      const dataUrl = canvasRef.current.exportToPNG();
      const link = document.createElement('a');
      link.download = `map-${terrain}-${mapData.seed}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleExportJSON = () => {
    if (mapData) {
      ExportUtils.exportMapToJSON(mapData, `map-${terrain}-${mapData.seed}.json`);
    }
  };

  const handleExportSVG = () => {
    if (mapData) {
      ExportUtils.exportMapToSVG(mapData, cellSize, `map-${terrain}-${mapData.seed}.svg`);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imported = await ExportUtils.importMapFromJSON(file);
        setMapData(imported);
        if (imported.terrainType) {
          setTerrain(imported.terrainType);
        }
        if (imported.seed) {
          setParameters({
            ...parameters,
            seed: imported.seed,
            width: imported.width,
            height: imported.height
          });
        }
      } catch (error) {
        alert('Failed to import map: ' + (error as Error).message);
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (!mapData) return;
    
    // Create shareable text with seed and parameters
    const shareText = `DnD Map Generator - ${mapData.terrainType}
Seed: ${mapData.seed}
Dimensions: ${mapData.width}x${mapData.height}
Parameters: ${JSON.stringify(parameters, null, 2)}

Paste this seed into the generator to recreate this map!`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        alert('Map parameters copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy to clipboard');
      });
  };

  // Object placement handlers
  const handleObjectPlace = useCallback((obj: PlacedObject) => {
    setPlacedObjects(prev => [...prev, obj]);
    console.log('[App] Placed object:', obj);
  }, []);

  const handleObjectDelete = useCallback((objId: string | null) => {
    if (!objId) return;
    setPlacedObjects(prev => prev.filter(o => o.id !== objId));
    console.log('[App] Deleted object:', objId);
  }, []);

  const handleTogglePalette = useCallback(() => {
    setShowPalette(prev => !prev);
  }, []);

  // Zoom and pan handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.1, 3);
      console.log(`[App] Zoom In: ${prev} -> ${newZoom}`);
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.1, 0.5);
      console.log(`[App] Zoom Out: ${prev} -> ${newZoom}`);
      return newZoom;
    });
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    console.log(`[App] Pan called: dx=${dx}, dy=${dy}`);
    setPanX(prev => {
      const newPanX = prev + dx;
      console.log(`[App] panX: ${prev} -> ${newPanX}`);
      return newPanX;
    });
    setPanY(prev => {
      const newPanY = prev + dy;
      console.log(`[App] panY: ${prev} -> ${newPanY}`);
      return newPanY;
    });
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    console.log(`[App] Zoom change: ${zoom} -> ${newZoom}`);
    setZoom(newZoom);
  }, [zoom]);

  // Campaign Workspace handlers
  const handleGenerateWorkspace = useCallback((parsedData: ParsedCampaignData) => {
    const newWorkspace = WorkspaceManager.createWorkspaceFromCampaign(parsedData);
    setWorkspace(newWorkspace);
    WorkspaceManager.saveToLocalStorage(newWorkspace);
    setWorkspaceViewOpen(true);
    console.log('[App] Generated workspace:', newWorkspace);
  }, []);

  const handleSelectMap = useCallback((mapId: string) => {
    if (!workspace) return;
    const map = workspace.maps.find(m => m.id === mapId);
    if (map) {
      setMapData(map.mapData as any);
      setWorkspaceViewOpen(false);
    }
  }, [workspace]);

  const handleRegenerateMap = useCallback((mapId: string) => {
    if (!workspace) return;
    const map = workspace.maps.find(m => m.id === mapId);
    if (map) {
      // Regenerate the map with a new seed
      const newSeed = Date.now() + Math.random();
      const updatedMapData = { ...map.mapData, seed: newSeed } as any;
      const updatedWorkspace = WorkspaceManager.updateMapInWorkspace(
        workspace,
        mapId,
        { mapData: updatedMapData }
      );
      setWorkspace(updatedWorkspace);
      WorkspaceManager.saveToLocalStorage(updatedWorkspace);
    }
  }, [workspace]);

  const handleDeleteMap = useCallback((mapId: string) => {
    if (!workspace) return;
    const updatedWorkspace = WorkspaceManager.removeMapFromWorkspace(workspace, mapId);
    setWorkspace(updatedWorkspace);
    WorkspaceManager.saveToLocalStorage(updatedWorkspace);
  }, [workspace]);

  const handleExportWorkspace = useCallback(() => {
    if (!workspace) return;
    WorkspaceManager.downloadWorkspace(workspace);
  }, [workspace]);

  const handleImportWorkspace = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const imported = await WorkspaceManager.importFromFile(file);
          setWorkspace(imported);
          WorkspaceManager.saveToLocalStorage(imported);
          setWorkspaceViewOpen(true);
          console.log('[App] Imported workspace:', imported);
        } catch (error) {
          console.error('[App] Failed to import workspace:', error);
          alert('Failed to import workspace: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      }
    };
    input.click();
  }, []);

  // Load workspace from localStorage on mount
  useEffect(() => {
    const saved = WorkspaceManager.loadFromLocalStorage();
    if (saved) {
      setWorkspace(saved);
      console.log('[App] Loaded workspace from localStorage:', saved);
    }
  }, []);

  // Keyboard controls for zoom and pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for navigation keys when not in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const panStep = 50;
      
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetView();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlePan(0, panStep);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlePan(0, -panStep);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePan(panStep, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handlePan(-panStep, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetView, handlePan]);

  // Load spritesheets (placeholder - add real assets later)
  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Placeholder: In production, load real spritesheets here
        // Example:
        // const sheets = await Promise.all([
        //   createSpriteSheet('forest-veg', 'Forest Vegetation',
        //     '/assets/spritesheets/forest-vegetation.png',
        //     64, 64, TerrainType.Forest, ObjectCategory.ForestVegetation),
        //   // ... more sheets
        // ]);
        // setSpritesheets(sheets);
        
        console.log('[App] Spritesheet loading placeholder - add assets to enable object placement');
        setSpritesheets([]);
      } catch (error) {
        console.error('[App] Failed to load spritesheets:', error);
      }
    };
    loadAssets();
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Top Menu Bar */}
        <TopMenuBar
          onOpenDrawer={() => setDrawerOpen(true)}
          placementMode={placementMode}
          onPlacementModeChange={setPlacementMode}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showObjectLayer={showObjectLayer}
          onToggleObjectLayer={() => setShowObjectLayer(!showObjectLayer)}
          showPalette={showPalette}
          onTogglePalette={handleTogglePalette}
          onExport={handleExportPNG}
          disabled={!mapData}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onOpenCampaignWizard={() => setWizardOpen(true)}
          onExportWorkspace={handleExportWorkspace}
          onImportWorkspace={handleImportWorkspace}
          hasWorkspace={workspace !== null}
        />
        
        {/* Control Drawer */}
        <ControlDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          terrain={terrain}
          onTerrainChange={handleTerrainChange}
          parameters={parameters}
          onParameterChange={setParameters}
          onPresetLoad={handlePresetLoad}
          onGenerate={generateMap}
          onRandomSeed={handleRandomSeed}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showRooms={showRooms}
          onToggleRooms={() => setShowRooms(!showRooms)}
          showCorridors={showCorridors}
          onToggleCorridors={() => setShowCorridors(!showCorridors)}
          showTrees={showTrees}
          onToggleTrees={() => setShowTrees(!showTrees)}
          cellSize={cellSize}
          onCellSizeChange={setCellSize}
          mapData={mapData}
          isGenerating={isGenerating}
        />
        
        {/* Main Canvas Area */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          bgcolor: 'background.default'
        }}>
          <Box sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}>
            <MapCanvas
              ref={canvasRef}
              mapData={mapData}
              cellSize={cellSize}
              showGrid={showGrid}
              showRooms={showRooms}
              showCorridors={showCorridors}
              showTrees={showTrees}
              showObjects={showObjectLayer}
              placedObjects={placedObjects}
              spritesheets={spritesheets}
              placementMode={placementMode}
              selectedSpriteId={selectedSpriteId}
              onObjectPlace={handleObjectPlace}
              onObjectClick={handleObjectDelete}
              zoom={zoom}
              panX={panX}
              panY={panY}
              onZoomChange={handleZoomChange}
              onPanChange={handlePan}
            />
          </Box>
        </Box>
        
        {/* Object Palette - floating on right side */}
        <ObjectPalette
          spritesheets={spritesheets}
          terrainType={mapData?.terrainType || TerrainType.Forest}
          selectedSpriteId={selectedSpriteId}
          onSpriteSelect={setSelectedSpriteId}
          onClose={() => setShowPalette(false)}
          visible={showPalette}
        />

        {/* Campaign Wizard Dialog */}
        <CampaignWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onGenerate={handleGenerateWorkspace}
        />

        {/* Workspace View Drawer */}
        <Drawer
          anchor="right"
          open={workspaceViewOpen}
          onClose={() => setWorkspaceViewOpen(false)}
          PaperProps={{
            sx: { width: '500px' }
          }}
        >
          <WorkspaceView
            workspace={workspace}
            onSelectMap={handleSelectMap}
            onRegenerateMap={handleRegenerateMap}
            onDeleteMap={handleDeleteMap}
          />
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}

export default App;
