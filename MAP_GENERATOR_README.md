# Procedural Map Generator

A complete React + TypeScript application for generating procedural maps including houses, forests, caves, and dungeons using advanced algorithms.

## Features

### Terrain Types
- **House**: Binary Space Partitioning (BSP) algorithm for structured room layouts
- **Forest**: Poisson Disk Sampling + Perlin Noise for natural tree distribution
- **Cave**: Cellular Automata for organic cave systems
- **Dungeon**: BSP + Random Walk for dungeons with organic corridors

### Key Capabilities
- ✅ Fully typed with TypeScript
- ✅ Seeded random generation for reproducible maps
- ✅ Live parameter adjustment with instant preview
- ✅ Export maps as PNG images
- ✅ Export/import map data as JSON
- ✅ 8 built-in presets for different map styles
- ✅ Layered canvas rendering (background, terrain, overlay)
- ✅ Organic edge roughening for natural appearance
- ✅ Guaranteed room connectivity using Minimum Spanning Tree
- ✅ Comprehensive unit test coverage

## Architecture

### Components
- `App.tsx` - Main application orchestrator with state management
- `TerrainSelector.tsx` - Dropdown for terrain type selection
- `ParameterForm.tsx` - Dynamic parameter controls based on terrain
- `MapCanvas.tsx` - Multi-layered HTML5 Canvas renderer with export capability

### Generators
All generators extend the base `MapGenerator<T>` abstract class:
- `HouseGenerator` - BSP-based room generation
- `ForestGenerator` - Poisson + Perlin for natural distribution
- `CaveGenerator` - Cellular automata with smoothing iterations
- `DungeonGenerator` - BSP + random walk corridors with organic factor

### Utilities
- `random.ts` - Seeded random number generator (LCG algorithm)
- `noise.ts` - Perlin noise implementation with octaves
- `connectivity.ts` - MST builder and corridor generation
- `poisson.ts` - Poisson disk sampling for distributed placement
- `presets.ts` - Preset configurations for quick generation
- `export.ts` - PNG and JSON export/import utilities

### Type System
Complete type definitions in `types/generator.ts`:
- `TerrainType` enum
- `Room`, `Corridor`, `Tree` interfaces
- `MapData` - Complete map structure
- `GeneratorParameters` - All generation parameters
- `Preset` - Preset configuration format

## Usage

### Running the App
```bash
npm install
npm start
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm test
```

## Generation Process

### 1. House/Dungeon Generation
1. Create root BSP node covering map area
2. Recursively split nodes until minimum size reached
3. Create rooms in leaf nodes with randomized sizes
4. Build Minimum Spanning Tree to connect room centers
5. Draw L-shaped corridors between connected rooms
6. (Dungeon only) Apply organic factor to edges and corridors
7. Add extra connections based on connectivity factor

### 2. Forest Generation
1. Run Poisson Disk Sampling for distributed points
2. Generate Perlin noise field across map
3. Filter points based on noise values and density parameter
4. Vary tree sizes based on noise intensity
5. Render trees with distinct colors by size

### 3. Cave Generation
1. Initialize grid with random fill based on probability
2. Apply cellular automata rules iteratively
3. Smooth cave structure using neighbor counting
4. Threshold determines wall/floor conversion
5. Ensure edges remain solid walls

## Parameters

### Common Parameters
- Width/Height: Map dimensions (30-200)
- Seed: Random seed for reproducibility

### House/Dungeon Parameters
- Min/Max Room Size: Room dimension constraints
- Room Count: Target number of rooms
- Corridor Width: Width of connecting passages
- Organic Factor (Dungeon): Edge roughness (0-1)
- Connectivity Factor (Dungeon): Extra corridor density (0-0.5)

### Forest Parameters
- Tree Density: Percentage of points with trees (0-1)
- Min Tree Distance: Poisson disk minimum separation
- Noise Scale: Perlin noise frequency

### Cave Parameters
- Fill Probability: Initial wall density (0.3-0.6)
- Smooth Iterations: Cellular automata passes (1-8)
- Wall Threshold: Neighbor count for wall generation (3-7)

## Presets

### Available Presets
- Small House (60×60, 5 rooms)
- Large Manor (100×100, 12 rooms)
- Small Dungeon (80×80, 8 rooms)
- Large Dungeon (120×120, 15 rooms)
- Sparse Forest (100×100, low density)
- Dense Forest (100×100, high density)
- Small Cave (70×70)
- Sprawling Cave (120×120)

## Display Controls

- **Show Grid**: Toggle overlay grid
- **Show Rooms**: Toggle room outlines
- **Show Corridors**: Toggle corridor visibility
- **Show Trees**: Toggle tree rendering
- **Cell Size**: Adjust pixel size per grid cell (2-10px)

## Export/Import

### Export
- **PNG**: Export rendered canvas as image file
- **JSON**: Export complete map data structure with seed

### Import
- Load previously exported JSON files to restore exact maps

## Testing

Comprehensive test suites for:
- Generator outputs (room count, connectivity, bounds)
- Room overlap detection
- MST connectivity guarantees
- Seeded random consistency
- Perlin noise smoothness
- Poisson disk distance constraints
- Edge case handling

## Color Schemes

### House
- Floor: Tan/beige (#d4c4a8)
- Walls: Brown (#8b7355)
- Background: Dark gray (#2c2c2c)

### Dungeon
- Floor: Medium gray (#6a6a6a)
- Walls: Dark gray (#3a3a3a)
- Background: Very dark (#1a1a1a)

### Forest
- Trees: Green shades by size (#2d5016 to #4d8f2a)
- Background: Dark green (#1a3a1a)

### Cave
- Floor: Blue-gray (#4a4a5a)
- Walls: Dark blue-gray (#2a2a3a)
- Background: Very dark blue (#1a1a2e)

## Future Enhancements

Planned features for expansion:
- Town/city generation
- River/water system generation
- Mountain/elevation maps
- Web Workers for large map generation
- Real-time preview during parameter adjustment
- Map templates and custom presets
- Multi-floor dungeon support
- Tileset-based rendering

## License

MIT

## Credits

Algorithms implemented:
- Binary Space Partitioning
- Cellular Automata
- Perlin Noise (Ken Perlin)
- Poisson Disk Sampling (Robert Bridson)
- Minimum Spanning Tree (Prim's algorithm)
