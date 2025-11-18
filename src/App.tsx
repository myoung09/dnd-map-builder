import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import { TerrainType, GeneratorParameters, MapData } from './types/generator';
import { TerrainSelector } from './components/TerrainSelector';
import { PresetSelector } from './components/PresetSelector';
import { ParameterForm } from './components/ParameterForm';
import { MapCanvas, MapCanvasRef } from './components/MapCanvas';
import { HouseGenerator } from './generators/HouseGenerator';
import { ForestGenerator } from './generators/ForestGenerator';
import { CaveGenerator } from './generators/CaveGenerator';
import { DungeonGenerator } from './generators/DungeonGenerator';
import { getPresetByName, getPresetsByTerrain } from './utils/presets';
import { ExportUtils } from './utils/export';

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
  
  const canvasRef = useRef<MapCanvasRef>(null);

  const generateMap = useCallback(() => {
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Procedural Map Generator</h1>
        <p className="subtitle">Generate houses, forests, caves, and dungeons</p>
      </header>

      <div className="app-container">
        <aside className="control-panel">
          <section className="control-section">
            <TerrainSelector 
              selectedTerrain={terrain}
              onTerrainChange={handleTerrainChange}
            />
          </section>

          <section className="control-section">
            <PresetSelector
              currentTerrain={terrain}
              onPresetSelect={handlePresetLoad}
            />
          </section>

          <section className="control-section">
            <ParameterForm
              terrain={terrain}
              parameters={parameters}
              onParameterChange={setParameters}
            />
          </section>

          <section className="control-section">
            <h3>Display Options</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Show Grid
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showRooms}
                onChange={(e) => setShowRooms(e.target.checked)}
              />
              Show Rooms
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showCorridors}
                onChange={(e) => setShowCorridors(e.target.checked)}
              />
              Show Corridors
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showTrees}
                onChange={(e) => setShowTrees(e.target.checked)}
              />
              Show Trees
            </label>
            <div className="slider-control">
              <label>
                Cell Size: {cellSize}px
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={cellSize}
                  onChange={(e) => setCellSize(parseInt(e.target.value))}
                />
              </label>
            </div>
          </section>

          <section className="control-section actions">
            <button className="primary-button" onClick={generateMap}>
              Generate Map
            </button>
            <button onClick={handleExportPNG} disabled={!mapData}>
              Export PNG
            </button>
            <button onClick={handleExportJSON} disabled={!mapData}>
              Export JSON
            </button>
            <label className="file-button">
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                style={{ display: 'none' }}
              />
            </label>
          </section>

          {mapData && (
            <section className="control-section map-info">
              <h3>Map Info</h3>
              <p>Dimensions: {mapData.width} × {mapData.height}</p>
              <p>Seed: {mapData.seed}</p>
              {mapData.rooms && <p>Rooms: {mapData.rooms.length}</p>}
              {mapData.corridors && <p>Corridors: {mapData.corridors.length}</p>}
              {mapData.trees && <p>Trees: {mapData.trees.length}</p>}
            </section>
          )}
        </aside>

        <main className="canvas-area">
          <MapCanvas
            ref={canvasRef}
            mapData={mapData}
            cellSize={cellSize}
            showGrid={showGrid}
            showRooms={showRooms}
            showCorridors={showCorridors}
            showTrees={showTrees}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
