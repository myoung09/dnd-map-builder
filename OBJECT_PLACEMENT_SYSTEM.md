# Object Placement System - Implementation Guide

## Overview

This document provides a comprehensive guide for implementing the object placement system in the DnD Map Builder application.

## Architecture

### Component Structure

```
App.tsx (Root)
├── TopMenuBar (New)
│   ├── Placement mode controls
│   ├── Layer visibility toggles
│   └── Export controls
├── MapCanvas (Enhanced)
│   ├── backgroundCanvas (existing)
│   ├── terrainCanvas (existing)
│   ├── objectCanvas (NEW - dedicated object layer)
│   └── overlayCanvas (existing - grid)
└── ObjectPalette (New)
    ├── Category tabs
    ├── Sprite grid
    └── Selection state
```

### Type System

**Location:** `src/types/objects.ts`

Key types defined:

- `Sprite` - Individual sprite from spritesheet
- `PlacedObject` - Instance of object on map
- `ObjectCategory` - Categorization enum (forest, dungeon, cave, house)
- `SpriteSheet` - Spritesheet metadata and sprites
- `ObjectPalette` - Palette state
- `PlacementMode` - Interaction mode enum

### Utilities

**Location:** `src/utils/spritesheet.ts`

Key functions:

- `loadImage()` - Async image loading
- `createSpriteSheet()` - Auto grid extraction
- `createSpriteSheetManual()` - Manual sprite definitions
- `renderSprite()` - Draw sprite to canvas
- `getSpriteById()` - Find sprite in sheets
- `filterSprites()` - Filter by terrain/category
- `createSpriteThumbnail()` - Generate preview

## Implementation Steps

### Step 1: Update MapCanvas for Object Layer

**File:** `src/components/MapCanvas.tsx`

**Changes Needed:**

1. **Add object canvas ref:**

```typescript
const objectCanvasRef = useRef<HTMLCanvasElement>(null);
```

2. **Update props interface:**

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
  spritesheets?: SpriteSheet[];
  onObjectClick?: (objectId: string | null) => void;
  placementMode?: PlacementMode;
  selectedSpriteId?: string | null;
}
```

3. **Add object layer rendering:**

```typescript
// In main useEffect, after terrain rendering:
const objectCanvas = objectCanvasRef.current;
const objectCtx = objectCanvas?.getContext("2d");

if (objectCtx && objectCanvas && showObjects && placedObjects) {
  objectCanvas.width = width * cellSize;
  objectCanvas.height = height * cellSize;

  drawObjects(objectCtx, placedObjects, spritesheets || [], cellSize);
}
```

4. **Add object rendering function:**

```typescript
function drawObjects(
  ctx: CanvasRenderingContext2D,
  objects: PlacedObject[],
  spritesheets: SpriteSheet[],
  cellSize: number
) {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Sort by zIndex for proper layering
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  for (const obj of sorted) {
    const result = getSpriteById(obj.spriteId, spritesheets);
    if (!result) continue;

    const { sprite, sheet } = result;

    // Convert grid position to pixel position
    const pixelX = (obj.gridX + 0.5) * cellSize;
    const pixelY = (obj.gridY + 0.5) * cellSize;

    // Scale sprite to fit cell size
    const scaleX = (cellSize / sprite.width) * obj.scaleX;
    const scaleY = (cellSize / sprite.height) * obj.scaleY;

    renderSprite(
      ctx,
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
```

5. **Add click handling:**

```typescript
const handleCanvasClick = useCallback(
  (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapData || !onObjectClick) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    if (placementMode === PlacementMode.Place && selectedSpriteId) {
      // Place new object
      const newObject: PlacedObject = {
        id: `obj_${Date.now()}_${Math.random()}`,
        spriteId: selectedSpriteId,
        gridX,
        gridY,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: placedObjects?.length || 0,
      };
      onObjectPlace?.(newObject);
    } else if (placementMode === PlacementMode.Delete) {
      // Find object at click position
      const clickedObj = placedObjects?.find(
        (obj) => obj.gridX === gridX && obj.gridY === gridY
      );
      if (clickedObj) {
        onObjectClick(clickedObj.id);
      }
    }
  },
  [
    mapData,
    cellSize,
    placementMode,
    selectedSpriteId,
    placedObjects,
    onObjectClick,
  ]
);
```

6. **Add fourth canvas to JSX:**

```typescript
<canvas
  ref={objectCanvasRef}
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: placementMode !== PlacementMode.None ? "auto" : "none",
    opacity: showObjects ? 1 : 0,
    transition: "opacity 0.2s",
  }}
  onClick={handleCanvasClick}
/>
```

### Step 2: Integrate into App.tsx

**File:** `src/App.tsx`

**State additions:**

```typescript
const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
const [spritesheets, setSpritesheets] = useState<SpriteSheet[]>([]);
const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
const [placementMode, setPlacementMode] = useState<PlacementMode>(
  PlacementMode.None
);
const [showObjectLayer, setShowObjectLayer] = useState(true);
const [showGrid, setShowGrid] = useState(true);
const [showPalette, setShowPalette] = useState(false);
```

**Event handlers:**

```typescript
const handleObjectPlace = useCallback((obj: PlacedObject) => {
  setPlacedObjects((prev) => [...prev, obj]);
}, []);

const handleObjectDelete = useCallback((objId: string) => {
  setPlacedObjects((prev) => prev.filter((o) => o.id !== objId));
}, []);

const handleTogglePalette = useCallback(() => {
  setShowPalette((prev) => !prev);
}, []);
```

**JSX structure:**

```typescript
return (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
    />

    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Existing parameter form */}
      <ParameterForm ... />

      {/* Enhanced MapCanvas */}
      <MapCanvas
        mapData={mapData}
        cellSize={cellSize}
        showGrid={showGrid}
        showObjects={showObjectLayer}
        placedObjects={placedObjects}
        spritesheets={spritesheets}
        placementMode={placementMode}
        selectedSpriteId={selectedSpriteId}
        onObjectPlace={handleObjectPlace}
        onObjectClick={handleObjectDelete}
      />

      {/* Object Palette */}
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

### Step 3: Update Export Utilities

**File:** `src/utils/export.ts`

**Enhance PNG export:**

```typescript
export function exportMapToPNGWithObjects(
  terrainCanvas: HTMLCanvasElement,
  objectCanvas: HTMLCanvasElement,
  filename: string
): void {
  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = terrainCanvas.width;
  compositeCanvas.height = terrainCanvas.height;
  const ctx = compositeCanvas.getContext("2d");

  if (ctx) {
    // Draw terrain layer
    ctx.drawImage(terrainCanvas, 0, 0);

    // Draw object layer on top
    ctx.drawImage(objectCanvas, 0, 0);

    // Export composite
    const dataUrl = compositeCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
}
```

**Enhance JSON export:**

```typescript
export function exportMapToJSONWithObjects(
  mapData: MapData,
  placedObjects: PlacedObject[],
  filename: string
): void {
  const enhanced = {
    ...mapData,
    placedObjects,
  };

  const json = JSON.stringify(enhanced, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
```

**Enhance SVG export:**

```typescript
export function exportMapToSVGWithObjects(
  mapData: MapData,
  placedObjects: PlacedObject[],
  spritesheets: SpriteSheet[],
  cellSize: number,
  filename: string
): void {
  // ... existing SVG terrain generation ...

  // Add object layer group
  const objectGroup = document.createElementNS(svgNS, "g");
  objectGroup.setAttribute("id", "objects");

  for (const obj of placedObjects) {
    const result = getSpriteById(obj.spriteId, spritesheets);
    if (!result) continue;

    // Convert sprite to data URL and embed as image
    const { sprite, sheet } = result;
    const canvas = document.createElement("canvas");
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext("2d");

    if (ctx && sheet.imageData) {
      ctx.drawImage(
        sheet.imageData,
        sprite.x,
        sprite.y,
        sprite.width,
        sprite.height,
        0,
        0,
        sprite.width,
        sprite.height
      );

      const imgElement = document.createElementNS(svgNS, "image");
      imgElement.setAttribute("href", canvas.toDataURL());
      imgElement.setAttribute("x", String(obj.gridX * cellSize));
      imgElement.setAttribute("y", String(obj.gridY * cellSize));
      imgElement.setAttribute("width", String(sprite.width * obj.scaleX));
      imgElement.setAttribute("height", String(sprite.height * obj.scaleY));

      if (obj.rotation !== 0) {
        const centerX = obj.gridX * cellSize + (sprite.width * obj.scaleX) / 2;
        const centerY = obj.gridY * cellSize + (sprite.height * obj.scaleY) / 2;
        imgElement.setAttribute(
          "transform",
          `rotate(${obj.rotation} ${centerX} ${centerY})`
        );
      }

      objectGroup.appendChild(imgElement);
    }
  }

  svg.appendChild(objectGroup);

  // ... rest of SVG export ...
}
```

## Testing Strategy

### Unit Tests

1. **Spritesheet utility tests:**

   - Load image from URL
   - Extract sprites from grid
   - Filter sprites by terrain/category
   - Render sprite to canvas

2. **Object placement tests:**
   - Place object on grid
   - Delete object
   - Move object
   - Snap to grid

### Integration Tests

1. **Component integration:**
   - Palette selection updates MapCanvas
   - Click places object
   - Delete mode removes object
   - Export includes objects

### Manual Testing Checklist

- [ ] Load spritesheet successfully
- [ ] Filter sprites by terrain type
- [ ] Filter sprites by category
- [ ] Select sprite from palette
- [ ] Place object on map
- [ ] Delete object from map
- [ ] Toggle object layer visibility
- [ ] Toggle grid overlay
- [ ] Export PNG with objects
- [ ] Export JSON with objects
- [ ] Export SVG with objects
- [ ] Objects persist in JSON and reload

## Asset Preparation

### Spritesheet Format

- **Recommended size:** 512x512 or 1024x1024 pixels
- **Sprite size:** 32x32, 64x64, or 128x128 pixels
- **Format:** PNG with transparency
- **Organization:** Grid layout with consistent spacing

### Example Spritesheets Needed

1. **forest-objects.png** - Bushes, flowers, stumps, rocks
2. **dungeon-objects.png** - Chests, torches, furniture, traps
3. **cave-objects.png** - Crystals, ore veins, formations
4. **house-objects.png** - Tables, chairs, doors, windows
5. **universal-objects.png** - Characters, markers, effects

### Loading Spritesheets

**Example initialization:**

```typescript
useEffect(() => {
  async function loadAssets() {
    const sheets = await Promise.all([
      createSpriteSheet(
        "forest-vegetation",
        "Forest Vegetation",
        "/assets/forest-vegetation.png",
        64,
        64,
        TerrainType.Forest,
        ObjectCategory.ForestVegetation
      ),
      createSpriteSheet(
        "dungeon-furniture",
        "Dungeon Furniture",
        "/assets/dungeon-furniture.png",
        64,
        64,
        TerrainType.Dungeon,
        ObjectCategory.DungeonFurniture
      ),
      // ... more spritesheets
    ]);

    setSpritesheets(sheets);
  }

  loadAssets();
}, []);
```

## Performance Considerations

### Optimization Strategies

1. **Object Layer Caching:**
   - Only redraw object canvas when objects change
   - Use `useMemo` for sorted object array
2. **Sprite Sheet Atlas:**
   - Combine multiple sheets into single texture
   - Reduce image load requests
3. **Visible Object Culling:**
   - Only render objects in viewport
   - Calculate visible bounds based on canvas scroll/zoom
4. **Request Animation Frame:**
   - Batch multiple object placements
   - Smooth drag-and-drop interactions

## Future Enhancements

### Phase 2 Features

1. **Object Properties Panel:**

   - Edit object scale, rotation
   - Change z-index (layering)
   - Add custom properties

2. **Object Snapping:**

   - Snap to grid
   - Snap to other objects
   - Alignment guides

3. **Object Library:**

   - Save/load object collections
   - Share between maps
   - Import community sprites

4. **Advanced Placement:**

   - Multi-select
   - Copy/paste
   - Drag-and-drop from palette
   - Keyboard shortcuts

5. **Smart Object Generation:**
   - Auto-populate rooms with furniture
   - Random decoration placement
   - Themed object sets

## Conclusion

This implementation provides a solid foundation for object placement with:

- ✅ Separate object canvas layer
- ✅ Toggleable visibility
- ✅ Click-to-place interaction
- ✅ Sprite categorization by terrain
- ✅ Export with objects (PNG, SVG, JSON)
- ✅ Material-UI integrated menu system
- ✅ Responsive palette UI

The system is designed to be extensible and can accommodate future features like drag-and-drop, object properties, and advanced placement tools.
