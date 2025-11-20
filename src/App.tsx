import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { TerrainType, GeneratorParameters, MapData } from './types/generator';
import { PlacedObject, PlacementMode, SpriteSheet, ObjectCategory } from './types/objects';
import { Workspace } from './types/workspace';
import { Palette, Sprite, SpriteCategory, PlacedSprite, DEFAULT_CATEGORIES } from './types/palette';
import { MapCanvas, MapCanvasRef } from './components/MapCanvas';
import ObjectPalette from './components/ObjectPalette';
import { TopMenuBar } from './components/TopMenuBar';
import { ControlPanel } from './components/ControlPanel';
import { CampaignWizard } from './components/CampaignWizard';
import { WorkspaceView } from './components/WorkspaceView';
import { PalettePanel } from './components/PalettePanel';
import { SpriteUploadDialog } from './components/SpriteUploadDialog';
import { HouseGenerator } from './generators/HouseGenerator';
import { ForestGenerator } from './generators/ForestGenerator';
import { CaveGenerator } from './generators/CaveGenerator';
import { DungeonGenerator } from './generators/DungeonGenerator';
import { getPresetByName, getPresetsByTerrain } from './utils/presets';
import { ExportUtils } from './utils/export';
import { WorkspaceManager } from './utils/workspaceManager';
import { ParsedCampaignData } from './utils/campaignParser';
import { sliceSpritesheet } from './utils/spriteUtils';
import { Box, ThemeProvider, createTheme, CssBaseline, Drawer, Tabs, Tab, Typography, Button } from '@mui/material';

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
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState(0); // 0 = Parameters, 1 = Workspace
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Pan and zoom state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Campaign workspace state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  
  // Sprite palette state
  const [palette, setPalette] = useState<Palette | null>(null);
  const [placedSprites, setPlacedSprites] = useState<PlacedSprite[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
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
    setDrawerOpen(true);
    setActiveTab(1); // Switch to workspace tab
    console.log('[App] Generated workspace:', newWorkspace);
  }, []);

  const handleSelectMap = useCallback((mapId: string) => {
    if (!workspace) return;
    const map = workspace.maps.find(m => m.id === mapId);
    if (map) {
      setMapData(map.mapData as any);
      // Keep drawer open so user can continue browsing
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
          setDrawerOpen(true);
          setActiveTab(1); // Switch to workspace tab
          console.log('[App] Imported workspace:', imported);
        } catch (error) {
          console.error('[App] Failed to import workspace:', error);
          alert('Failed to import workspace: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      }
    };
    input.click();
  }, []);

  const handleRenameWorkspace = useCallback((newName: string) => {
    if (!workspace) return;
    const updatedWorkspace = {
      ...workspace,
      metadata: {
        ...workspace.metadata,
        name: newName,
        lastModified: new Date()
      }
    };
    setWorkspace(updatedWorkspace);
    WorkspaceManager.saveToLocalStorage(updatedWorkspace);
    console.log('[App] Renamed workspace to:', newName);
  }, [workspace]);

  const handleClearWorkspace = useCallback(() => {
    if (!workspace) return;
    if (window.confirm(`Clear workspace "${workspace.metadata.name}"? This will remove all maps but keep the workspace structure.`)) {
      const clearedWorkspace = {
        ...workspace,
        maps: [],
        metadata: {
          ...workspace.metadata,
          mapCount: 0,
          lastModified: new Date()
        }
      };
      setWorkspace(clearedWorkspace);
      WorkspaceManager.saveToLocalStorage(clearedWorkspace);
      console.log('[App] Cleared workspace');
    }
  }, [workspace]);

  const handleAddMap = useCallback(() => {
    // Switch to parameters tab to generate a new map
    setActiveTab(0);
  }, []);

  const handleCloseWorkspace = useCallback(() => {
    // Just switch back to parameters tab
    setActiveTab(0);
  }, []);

  const handleViewWorkspace = useCallback(() => {
    setDrawerOpen(true);
    setActiveTab(1);
  }, []);

  const handleStartCampaign = useCallback(() => {
    // Generate a unique session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Navigate to DM page with current workspace state
    navigate('/dm', {
      state: {
        mapData,
        workspace,
        palette,
        placedObjects,
        spritesheets,
        sessionId
      }
    });
    
    console.log('[App] Starting campaign with session:', sessionId);
  }, [navigate, mapData, workspace, palette, placedObjects, spritesheets]);

  // Sprite Palette handlers
  const handleUploadSpritesheet = useCallback(async (
    file: File,
    spriteWidth: number,
    spriteHeight: number,
    name: string
  ) => {
    try {
      const { spritesheet, sprites } = await sliceSpritesheet(file, spriteWidth, spriteHeight, name);
      
      setPalette(prev => {
        if (!prev) {
          // Create new palette
          const newPalette: Palette = {
            id: `palette_${Date.now()}`,
            name: 'Sprite Palette',
            spritesheets: [spritesheet],
            sprites,
            categories: [...DEFAULT_CATEGORIES],
            createdAt: new Date(),
            modifiedAt: new Date(),
          };
          console.log('[App] Created new palette:', newPalette);
          return newPalette;
        } else {
          // Add to existing palette
          const updatedPalette = {
            ...prev,
            spritesheets: [...prev.spritesheets, spritesheet],
            sprites: [...prev.sprites, ...sprites],
            modifiedAt: new Date(),
          };
          console.log('[App] Added sprites to palette:', sprites.length);
          return updatedPalette;
        }
      });

      setActiveTab(2); // Switch to palette tab
    } catch (error) {
      console.error('[App] Failed to upload spritesheet:', error);
      throw error;
    }
  }, []);

  const handleCreateCategory = useCallback((name: string, color: string) => {
    setPalette(prev => {
      if (!prev) return prev;
      const newCategory: SpriteCategory = {
        id: `category_${Date.now()}`,
        name,
        color,
        order: prev.categories.length,
      };
      return {
        ...prev,
        categories: [...prev.categories, newCategory],
        modifiedAt: new Date(),
      };
    });
  }, []);

  const handleDeleteCategory = useCallback((categoryId: string) => {
    setPalette(prev => {
      if (!prev) return prev;
      // Move sprites from deleted category to 'general'
      const updatedSprites = prev.sprites.map(sprite =>
        sprite.category === categoryId ? { ...sprite, category: 'general' } : sprite
      );
      return {
        ...prev,
        sprites: updatedSprites,
        categories: prev.categories.filter(cat => cat.id !== categoryId),
        modifiedAt: new Date(),
      };
    });
  }, []);

  const handleMoveSprite = useCallback((spriteId: string, newCategoryId: string) => {
    setPalette(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sprites: prev.sprites.map(sprite =>
          sprite.id === spriteId ? { ...sprite, category: newCategoryId } : sprite
        ),
        modifiedAt: new Date(),
      };
    });
  }, []);

  const handleDeleteSprite = useCallback((spriteId: string) => {
    setPalette(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sprites: prev.sprites.filter(sprite => sprite.id !== spriteId),
        modifiedAt: new Date(),
      };
    });
  }, []);

  const handleRenameSprite = useCallback((spriteId: string, newName: string) => {
    setPalette(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sprites: prev.sprites.map(sprite =>
          sprite.id === spriteId ? { ...sprite, name: newName } : sprite
        ),
        modifiedAt: new Date(),
      };
    });
  }, []);

  const handleViewPalette = useCallback(() => {
    setDrawerOpen(true);
    setActiveTab(2);
  }, []);

  // Handle sprite selection from palette - enable placement mode
  const handleSpriteSelect = useCallback((spriteId: string | null) => {
    setSelectedSpriteId(spriteId);
    if (spriteId) {
      // Automatically enable placement mode when sprite is selected
      setPlacementMode(PlacementMode.Place);
      console.log('[App] Sprite selected for placement:', spriteId);
      
      // Optional: Show instructions to user
      // Could add a toast notification here
    } else {
      // Deselect and return to normal mode
      setPlacementMode(PlacementMode.None);
    }
  }, []);

  // Convert palette sprites to legacy spritesheet format for canvas rendering
  // Store loaded images for palette sprites
  const [paletteImages, setPaletteImages] = useState<Map<string, HTMLImageElement>>(new Map());

  // Load images from palette when palette changes
  useEffect(() => {
    if (!palette) return;

    const imageMap = new Map<string, HTMLImageElement>();
    let loadedCount = 0;
    const totalImages = palette.spritesheets.length + palette.sprites.filter(s => s.imageData).length;

    if (totalImages === 0) {
      setPaletteImages(imageMap);
      return;
    }

    // Load spritesheet images
    palette.spritesheets.forEach(sheet => {
      const img = new Image();
      img.onload = () => {
        imageMap.set(sheet.id, img);
        loadedCount++;
        if (loadedCount === totalImages) {
          setPaletteImages(new Map(imageMap));
          console.log(`[App] Loaded ${totalImages} palette images`);
        }
      };
      img.onerror = () => {
        console.error(`[App] Failed to load spritesheet image: ${sheet.id}`);
        loadedCount++;
        if (loadedCount === totalImages) {
          setPaletteImages(new Map(imageMap));
        }
      };
      img.src = sheet.imageData;
    });

    // Load individual sprite images
    palette.sprites.forEach(sprite => {
      if (sprite.imageData) {
        const img = new Image();
        img.onload = () => {
          imageMap.set(sprite.id, img);
          loadedCount++;
          if (loadedCount === totalImages) {
            setPaletteImages(new Map(imageMap));
            console.log(`[App] Loaded ${totalImages} palette images`);
          }
        };
        img.onerror = () => {
          console.error(`[App] Failed to load sprite image: ${sprite.id}`);
          loadedCount++;
          if (loadedCount === totalImages) {
            setPaletteImages(new Map(imageMap));
          }
        };
        img.src = sprite.imageData;
      }
    });
  }, [palette]);

  const paletteToSpriteSheets = useMemo((): SpriteSheet[] => {
    if (!palette || palette.sprites.length === 0 || paletteImages.size === 0) return [];

    const sheetMap = new Map<string, SpriteSheet>();

    // Create individual sprite "sheets" for each sprite
    // Each sprite gets its own mini-sheet since they have individual imageData
    palette.sprites.forEach(sprite => {
      if (sprite.imageData) {
        const img = paletteImages.get(sprite.id);
        if (!img) return; // Skip if image not loaded yet
        
        const miniSheet: SpriteSheet = {
          id: `sprite_sheet_${sprite.id}`,
          name: `${sprite.name}_sheet`,
          imagePath: sprite.imageData,
          imageData: img, // Use loaded Image object
          gridWidth: 1,
          gridHeight: 1,
          spriteWidth: sprite.width,
          spriteHeight: sprite.height,
          sprites: [{
            id: sprite.id,
            name: sprite.name,
            sheetId: `sprite_sheet_${sprite.id}`,
            x: 0,
            y: 0,
            width: sprite.width,
            height: sprite.height,
            category: ObjectCategory.Universal,
            terrainType: mapData?.terrainType || TerrainType.Dungeon,
          }]
        };
        
        sheetMap.set(miniSheet.id, miniSheet);
      }
    });

    return Array.from(sheetMap.values());
  }, [palette, mapData?.terrainType, paletteImages]);

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
        case 'Escape':
          // Cancel sprite placement mode
          if (placementMode === PlacementMode.Place) {
            e.preventDefault();
            handleSpriteSelect(null);
          }
          break;
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
  }, [handleZoomIn, handleZoomOut, handleResetView, handlePan, placementMode, handleSpriteSelect]);

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
          onViewWorkspace={handleViewWorkspace}
          onExportWorkspace={handleExportWorkspace}
          onImportWorkspace={handleImportWorkspace}
          onStartCampaign={handleStartCampaign}
          hasWorkspace={workspace !== null}
        />
        
        {/* Tabbed Drawer with Parameters and Workspace */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          variant="persistent"
          PaperProps={{
            sx: { width: '400px' }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Parameters" />
              <Tab label="Workspace" disabled={!workspace} />
              <Tab label="Palette" />
            </Tabs>
            
            {/* Tab Panel 0: Parameters */}
            {activeTab === 0 && (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <ControlPanel
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
                  onClose={() => setDrawerOpen(false)}
                />
              </Box>
            )}
            
            {/* Tab Panel 1: Workspace */}
            {activeTab === 1 && workspace && (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <WorkspaceView
                  workspace={workspace}
                  onSelectMap={handleSelectMap}
                  onRegenerateMap={handleRegenerateMap}
                  onDeleteMap={handleDeleteMap}
                  onRenameWorkspace={handleRenameWorkspace}
                  onClearWorkspace={handleClearWorkspace}
                  onAddMap={handleAddMap}
                  onClose={handleCloseWorkspace}
                />
              </Box>
            )}

            {/* Tab Panel 2: Palette */}
            {activeTab === 2 && (
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <PalettePanel
                  palette={palette}
                  selectedSpriteId={selectedSpriteId}
                  onSpriteSelect={handleSpriteSelect}
                  onOpenUploadDialog={() => setUploadDialogOpen(true)}
                  onCreateCategory={handleCreateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onMoveSprite={handleMoveSprite}
                  onDeleteSprite={handleDeleteSprite}
                  onRenameSprite={handleRenameSprite}
                />
              </Box>
            )}
          </Box>
        </Drawer>

        {/* Sprite Upload Dialog */}
        <SpriteUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUpload={handleUploadSpritesheet}
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
              spritesheets={[...spritesheets, ...paletteToSpriteSheets]}
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

        {/* Sprite Placement Mode Indicator */}
        {placementMode === PlacementMode.Place && selectedSpriteId && palette && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              boxShadow: 4,
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              🖱️ Click on the map to place sprite
            </Typography>
            <Button
              size="small"
              variant="outlined"
              sx={{
                color: 'inherit',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.8)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
              onClick={() => handleSpriteSelect(null)}
            >
              Cancel (ESC)
            </Button>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
