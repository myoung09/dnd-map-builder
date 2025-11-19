# Object Placement System - Quick Start Guide

## 🚀 5-Minute Integration

This guide will get the object placement system working in your map builder.

## Prerequisites

✅ All foundation files created:

- `src/types/objects.ts`
- `src/utils/spritesheet.ts`
- `src/components/ObjectPalette.tsx`
- `src/components/TopMenuBar.tsx`

## Step 1: Update MapCanvas.tsx (15 minutes)

### 1.1 Add imports

```typescript
import { PlacedObject, PlacementMode } from "../types/objects";
import { getSpriteById, renderSprite } from "../utils/spritesheet";
```

### 1.2 Add object canvas ref (line ~63)

```typescript
const objectCanvasRef = useRef<HTMLCanvasElement>(null);
```

### 1.3 Update props interface (line ~8)

```typescript
interface MapCanvasProps {
  mapData: MapData | null;
  cellSize?: number;
  showGrid?: boolean;
  showRooms?: boolean;
  showCorridors?: boolean;
  showTrees?: boolean;
  // NEW PROPS
  showObjects?: boolean;
  placedObjects?: PlacedObject[];
  spritesheets?: any[];
  placementMode?: PlacementMode;
  selectedSpriteId?: string | null;
  onObjectPlace?: (obj: PlacedObject) => void;
  onObjectClick?: (objId: string | null) => void;
}
```

### 1.4 Add defaults to destructured props (line ~54)

```typescript
}, ref) => {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const objectCanvasRef = useRef<HTMLCanvasElement>(null); // ADD THIS
  const [showExportButtons, setShowExportButtons] = useState(true);
```

### 1.5 Add object rendering in main useEffect (after terrain rendering, ~line 250)

```typescript
// Draw object layer
const objectCanvas = objectCanvasRef.current;
if (objectCanvas && showObjects && placedObjects && spritesheets) {
  objectCanvas.width = width * cellSize;
  objectCanvas.height = height * cellSize;
  const objectCtx = objectCanvas.getContext("2d");

  if (objectCtx) {
    objectCtx.clearRect(0, 0, objectCanvas.width, objectCanvas.height);

    // Sort by zIndex
    const sorted = [...placedObjects].sort((a, b) => a.zIndex - b.zIndex);

    for (const obj of sorted) {
      const result = getSpriteById(obj.spriteId, spritesheets);
      if (!result) continue;

      const { sprite, sheet } = result;
      const pixelX = (obj.gridX + 0.5) * cellSize;
      const pixelY = (obj.gridY + 0.5) * cellSize;
      const scaleX = (cellSize / sprite.width) * obj.scaleX;
      const scaleY = (cellSize / sprite.height) * obj.scaleY;

      renderSprite(
        objectCtx,
        sprite,
        sheet,
        pixelX,
        pixelY,
        scaleX,
        scaleY,
        obj.rotation
      );
    }
  }
}
```

### 1.6 Add click handler before return statement (line ~250)

```typescript
const handleCanvasClick = useCallback(
  (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapData) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    if (
      placementMode === PlacementMode.Place &&
      selectedSpriteId &&
      onObjectPlace
    ) {
      onObjectPlace({
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        spriteId: selectedSpriteId,
        gridX,
        gridY,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: placedObjects?.length || 0,
      });
    } else if (placementMode === PlacementMode.Delete && onObjectClick) {
      const clicked = placedObjects?.find(
        (obj) => obj.gridX === gridX && obj.gridY === gridY
      );
      if (clicked) onObjectClick(clicked.id);
    }
  },
  [
    mapData,
    cellSize,
    placementMode,
    selectedSpriteId,
    placedObjects,
    onObjectPlace,
    onObjectClick,
  ]
);
```

### 1.7 Add object canvas to JSX (after overlayCanvas, ~line 280)

```typescript
{
  /* Object Layer */
}
<canvas
  ref={objectCanvasRef}
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: placementMode !== PlacementMode.None ? "auto" : "none",
    opacity: showObjects ? 1 : 0,
    transition: "opacity 0.2s",
    cursor:
      placementMode === PlacementMode.Place
        ? "crosshair"
        : placementMode === PlacementMode.Delete
        ? "not-allowed"
        : "default",
  }}
  onClick={handleCanvasClick}
/>;
```

## Step 2: Update App.tsx (20 minutes)

### 2.1 Add imports (top of file)

```typescript
import { PlacedObject, PlacementMode, ObjectCategory } from "./types/objects";
import { createSpriteSheet } from "./utils/spritesheet";
import ObjectPalette from "./components/ObjectPalette";
import TopMenuBar from "./components/TopMenuBar";
import { TerrainType } from "./types/generator";
```

### 2.2 Add state (after existing state declarations)

```typescript
const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
const [spritesheets, setSpritesheets] = useState<any[]>([]);
const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
const [placementMode, setPlacementMode] = useState<PlacementMode>(
  PlacementMode.None
);
const [showObjectLayer, setShowObjectLayer] = useState(true);
const [showPalette, setShowPalette] = useState(false);
```

### 2.3 Add event handlers (after existing handlers)

```typescript
const handleObjectPlace = useCallback((obj: PlacedObject) => {
  setPlacedObjects((prev) => [...prev, obj]);
  console.log("Placed object:", obj);
}, []);

const handleObjectDelete = useCallback((objId: string) => {
  setPlacedObjects((prev) => prev.filter((o) => o.id !== objId));
  console.log("Deleted object:", objId);
}, []);

const handleTogglePalette = useCallback(() => {
  setShowPalette((prev) => !prev);
}, []);
```

### 2.4 Load spritesheets (add useEffect)

```typescript
useEffect(() => {
  // Load placeholder spritesheets for development
  // Replace with actual asset loading in production
  const loadPlaceholders = async () => {
    // For now, just initialize empty array
    // In production, use createSpriteSheet() to load real assets
    setSpritesheets([]);
  };
  loadPlaceholders();
}, []);
```

### 2.5 Update JSX structure

Find the main return statement and restructure:

```typescript
return (
  <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
    {/* NEW: Top Menu Bar */}
    <TopMenuBar
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

    <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Existing: Parameter Form */}
      <ParameterForm
        terrainType={terrainType}
        onTerrainChange={handleTerrainChange}
        parameters={parameters}
        onParametersChange={handleParametersChange}
        onGenerate={handleGenerate}
        onPresetSelect={handlePresetSelect}
      />

      {/* Updated: Map Canvas with Object Support */}
      <MapCanvas
        ref={canvasRef}
        mapData={mapData}
        cellSize={cellSize}
        showGrid={showGrid}
        showRooms={showRooms}
        showCorridors={showCorridors}
        showTrees={showTrees}
        // NEW: Object props
        showObjects={showObjectLayer}
        placedObjects={placedObjects}
        spritesheets={spritesheets}
        placementMode={placementMode}
        selectedSpriteId={selectedSpriteId}
        onObjectPlace={handleObjectPlace}
        onObjectClick={handleObjectDelete}
      />

      {/* NEW: Object Palette */}
      <ObjectPalette
        spritesheets={spritesheets}
        terrainType={mapData?.terrainType || TerrainType.Forest}
        selectedSpriteId={selectedSpriteId}
        onSpriteSelect={setSelectedSpriteId}
        onClose={() => setShowPalette(false)}
        visible={showPalette}
      />
    </Box>
  </Box>
);
```

## Step 3: Test (5 minutes)

### 3.1 Start the app

```bash
npm start
```

### 3.2 Test menu bar

- ✅ Menu bar appears at top
- ✅ Buttons are visible and styled
- ✅ Palette button toggles state

### 3.3 Test palette

- ✅ Palette opens when button clicked
- ✅ Shows "No objects available" message (expected - no spritesheets loaded yet)
- ✅ Can close palette

### 3.4 Test placement mode

- ✅ Click "Place" button - mode indicator changes
- ✅ Click "Delete" button - mode indicator changes and button turns red
- ✅ Click again to exit mode

### 3.5 Test layer toggles

- ✅ Grid toggle works (shows/hides grid lines)
- ✅ Object layer toggle works (opacity changes)

## Step 4: Add Real Spritesheets (Optional)

### 4.1 Prepare assets

Place PNG files in `public/assets/spritesheets/`:

```
public/
  assets/
    spritesheets/
      forest-vegetation.png (64x64 sprites in 8x8 grid)
      dungeon-furniture.png (64x64 sprites in 8x8 grid)
```

### 4.2 Load in App.tsx

Replace the placeholder useEffect with:

```typescript
useEffect(() => {
  async function loadAssets() {
    try {
      const sheets = await Promise.all([
        createSpriteSheet(
          "forest-veg",
          "Forest Vegetation",
          "/assets/spritesheets/forest-vegetation.png",
          64,
          64,
          TerrainType.Forest,
          ObjectCategory.ForestVegetation
        ),
        createSpriteSheet(
          "dungeon-furniture",
          "Dungeon Furniture",
          "/assets/spritesheets/dungeon-furniture.png",
          64,
          64,
          TerrainType.Dungeon,
          ObjectCategory.DungeonFurniture
        ),
        // Add more as needed
      ]);

      setSpritesheets(sheets);
      console.log(`Loaded ${sheets.length} spritesheets`);
    } catch (error) {
      console.error("Failed to load spritesheets:", error);
    }
  }

  loadAssets();
}, []);
```

### 4.3 Test object placement

1. Generate a Forest map
2. Open palette (button in menu bar)
3. Select a sprite from the grid
4. Click "Place" button
5. Click on the map to place object
6. Object appears on grid!

## 🎉 Done!

You now have a working object placement system with:

- ✅ Top menu bar with placement controls
- ✅ Object palette with category filtering
- ✅ Click-to-place interaction
- ✅ Click-to-delete interaction
- ✅ Layer visibility toggles
- ✅ Separate object canvas layer

## Next Steps

### Phase 2 Features

- [ ] Drag-and-drop from palette
- [ ] Object properties panel (scale, rotation)
- [ ] Multi-select and bulk operations
- [ ] Export with objects (PNG, SVG, JSON)

### Add More Spritesheets

```typescript
// Cave objects
createSpriteSheet('cave-formations', 'Cave Formations',
  '/assets/cave-formations.png', 64, 64,
  TerrainType.Cave, ObjectCategory.CaveFormation),

// House objects
createSpriteSheet('house-furniture', 'House Furniture',
  '/assets/house-furniture.png', 64, 64,
  TerrainType.House, ObjectCategory.HouseFurniture),
```

## Troubleshooting

### "No objects available" in palette

- Check spritesheet loading in console
- Verify image paths are correct
- Ensure images are in `public/assets/` folder

### Objects not appearing on map

- Check console for errors
- Verify `showObjects` prop is true
- Confirm `placedObjects` array has items
- Check z-index sorting

### Click not placing objects

- Ensure placement mode is "Place"
- Verify sprite is selected in palette
- Check `onObjectPlace` handler is firing
- Look for errors in console

### Canvas alignment issues

- Verify `cellSize` prop matches terrain canvas
- Check object canvas width/height calculations
- Ensure grid coordinates are correctly converted to pixels

## 📚 Resources

- **Full Documentation:** `OBJECT_PLACEMENT_SYSTEM.md`
- **Summary:** `OBJECT_SYSTEM_SUMMARY.md`
- **Type Definitions:** `src/types/objects.ts`
- **Utilities:** `src/utils/spritesheet.ts`

## 🆘 Need Help?

Common issues and solutions are documented in `OBJECT_PLACEMENT_SYSTEM.md` under "Troubleshooting" section.

---

**Happy map building! 🗺️✨**
