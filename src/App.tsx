import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import { TerrainType, GeneratorParameters, MapData } from './types/generator';
import { PlacedObject, PlacementMode, SpriteSheet } from './types/objects';
import { MapCanvas, MapCanvasRef } from './components/MapCanvas';
import ObjectPalette from './components/ObjectPalette';
import { TopMenuBar } from './components/TopMenuBar';
import ControlDrawer from './components/ControlDrawer';
import { HouseGenerator } from './generators/HouseGenerator';
import { ForestGenerator } from './generators/ForestGenerator';
import { CaveGenerator } from './generators/CaveGenerator';
import { DungeonGenerator } from './generators/DungeonGenerator';
import { getPresetByName, getPresetsByTerrain } from './utils/presets';
import { ExportUtils } from './utils/export';
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material';

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
      </Box>
    </ThemeProvider>
  );
}

export default App;
