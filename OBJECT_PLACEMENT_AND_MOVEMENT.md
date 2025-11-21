# Object Placement and Movement - Implementation Complete

## Overview

Object placement and movement has been fully implemented in both DM mode and the map builder. Users can now:

- ✅ Place sprites from the palette in DM mode
- ✅ Drag and reposition objects in DM mode
- ✅ Drag and reposition objects in map builder mode
- ✅ Changes sync to players via WebSocket (DM mode)

## Features Implemented

### 1. DM Mode - Object Placement

**Location**: `src/pages/DMPage.tsx`

#### Sprites Tab

- Added new "Sprites" tab to control panel
- Integrated `PalettePanel` component
- Shows all available sprites from palette
- Click sprite to enter placement mode

#### Placement Mode

- Select sprite from palette → activates placement mode
- Click on map to place selected sprite
- Visual indicator shows "Click to place sprite"
- Can place multiple copies (stays in placement mode)
- Cancel by clicking X on indicator chip

#### State Management

```typescript
const [objectPlacementMode, setObjectPlacementMode] = useState(false);
const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
```

#### WebSocket Sync

- Placed objects broadcast via `OBJECT_ADDED` event
- All connected players receive new objects in real-time

### 2. DM Mode - Object Movement

**Location**: `src/pages/DMPage.tsx`

#### Drag and Drop

- Click and hold on any placed object
- Drag to new location
- Release to drop
- Position updates sync to players

#### Handler Implementation

```typescript
const handleObjectMove = useCallback(
  (objId: string, newX: number, newY: number) => {
    setDmObjects((prev) => {
      const updated = prev.map((obj) =>
        obj.id === objId ? { ...obj, x: newX, y: newY } : obj
      );
      const updatedObj = updated.find((o) => o.id === objId);
      if (updatedObj) {
        wsService.send({
          type: WSEventType.OBJECT_UPDATED,
          payload: updatedObj,
        });
      }
      return updated;
    });
  },
  []
);
```

### 3. Map Builder - Object Movement

**Location**: `src/App.tsx`

#### Drag and Drop

- Click and hold on any placed object
- Drag to reposition
- Works in map maker view
- Changes persist in workspace

#### Handler Implementation

```typescript
const handleObjectMove = useCallback(
  (objId: string, newX: number, newY: number) => {
    setPlacedObjects((prev) =>
      prev.map((obj) =>
        obj.id === objId ? { ...obj, gridX: newX, gridY: newY } : obj
      )
    );
    console.log("[App] Moved object:", objId, "to", newX, newY);
  },
  []
);
```

### 4. MapCanvas - Unified Drag System

**Location**: `src/components/MapCanvas.tsx`

#### Mouse Interaction Modes

1. **Ctrl + Drag** = Pan the map
2. **Placement Mode** = Place new objects
3. **Delete Mode** = Delete objects on click
4. **Default Mode** = Drag existing objects

#### Drag Detection

```typescript
// On mouse down, check if clicking on an object
const handleMouseDown = useCallback(
  (e: React.MouseEvent<HTMLDivElement>) => {
    // Ctrl + Click = Pan
    if (e.ctrlKey && onPanChange) {
      setIsDragging(true);
      // ... pan logic
      return;
    }

    // Check if clicked on object
    if (placementMode === PlacementMode.None && placedObjects.length > 0) {
      const gridX = Math.floor(canvasX / cellSize);
      const gridY = Math.floor(canvasY / cellSize);

      const clickedObject = [...placedObjects]
        .sort((a, b) => b.zIndex - a.zIndex) // Top-most first
        .find((obj) => gridX === obj.gridX && gridY === obj.gridY);

      if (clickedObject) {
        setDraggedObjectId(clickedObject.id);
        setDraggedObjectStart({
          gridX: clickedObject.gridX,
          gridY: clickedObject.gridY,
        });
      }
    }
  },
  [panX, panY, onPanChange, placementMode, placedObjects, cellSize]
);
```

#### Drag Movement

```typescript
const handleMouseMove = useCallback(
  (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle object dragging
    if (draggedObjectId && draggedObjectStart && onObjectMove) {
      const newGridX = Math.floor(canvasX / cellSize);
      const newGridY = Math.floor(canvasY / cellSize);

      if (
        newGridX !== draggedObjectStart.gridX ||
        newGridY !== draggedObjectStart.gridY
      ) {
        onObjectMove(draggedObjectId, newGridX, newGridY);
        setDraggedObjectStart({ gridX: newGridX, gridY: newGridY });
      }
    }
  },
  [draggedObjectId, draggedObjectStart, onObjectMove, cellSize]
);
```

#### Cursor Feedback

- **Default**: Arrow cursor
- **Placement Mode**: Crosshair
- **Dragging Object**: Move cursor
- **Panning**: Grabbing cursor

### 5. Palette Support in MapCanvas

**Location**: `src/components/MapCanvas.tsx`

#### Dual Rendering System

Supports both old SpriteSheet system and new Palette system:

```typescript
if (palette) {
  // Use new Palette system
  const sprite = palette.sprites.find((s) => s.id === obj.spriteId);
  if (sprite) {
    spriteImage = new Image();
    spriteImage.src = sprite.imageData; // Base64 image
    spriteWidth = sprite.width;
    spriteHeight = sprite.height;
  }
} else {
  // Use old SpriteSheet system
  const result = getSpriteById(obj.spriteId, spritesheets);
  // ... old rendering logic
}
```

#### Rendering

- Sprites loaded from base64 imageData
- Scaled to fit grid cells
- Supports rotation and scaling
- Proper z-index layering

## Usage Guide

### DM Mode

#### Placing Objects

1. Start DM session from map builder
2. Open control panel
3. Click "Sprites" tab
4. Select a sprite from palette
5. Click on map to place
6. Place multiple copies as needed
7. Click X on indicator to cancel

#### Moving Objects

1. Click and hold on any placed object
2. Drag to new grid position
3. Release mouse to drop
4. Object position syncs to players automatically

#### Managing Objects

- **Objects Tab**: View all placed objects
- **Visibility Toggle**: Click eye icon to hide/show from players
- **Category Filter**: Filter by object type
- **Object List**: Shows position and visibility status

### Map Builder

#### Placing Objects

1. Open drawer (☰ menu)
2. Go to "Palette" tab
3. Select a sprite
4. Toggle placement mode in top menu
5. Click on map to place

#### Moving Objects

1. Ensure placement mode is OFF
2. Click and hold on object
3. Drag to new position
4. Release to drop
5. Changes saved in workspace

## Technical Details

### Data Flow

#### DM Mode Placement

```
User selects sprite
  → handleSpriteSelect()
  → Sets selectedSpriteId
  → Activates objectPlacementMode
  → User clicks map
  → MapCanvas handleContainerClick()
  → Creates PlacedObject
  → handleObjectPlace()
  → Converts to DMObject
  → Updates dmObjects state
  → Broadcasts OBJECT_ADDED via WebSocket
  → Players receive update
```

#### Object Movement

```
User clicks object
  → MapCanvas handleMouseDown()
  → Detects clicked object
  → Sets draggedObjectId
  → User drags mouse
  → MapCanvas handleMouseMove()
  → Calculates new grid position
  → Calls onObjectMove(objId, newX, newY)
  → Parent updates state
  → (DM mode: broadcasts OBJECT_UPDATED)
  → Re-renders with new position
```

### Props Added

#### MapCanvas

```typescript
interface MapCanvasProps {
  // ... existing props
  palette?: Palette | null; // NEW: Palette support
  onObjectMove?: (
    // NEW: Movement handler
    objId: string,
    newX: number,
    newY: number
  ) => void;
}
```

#### DMPage Navigation State

```typescript
interface DMPageState {
  mapData?: MapData | null;
  workspace?: any;
  palette?: Palette; // NEW: Pass palette to DM
  placedObjects?: PlacedObject[];
  spritesheets?: any[];
  sessionId?: string;
}
```

### State Management

#### DMPage

```typescript
const [palette] = useState<Palette | null>(passedState?.palette || null);
const [objectPlacementMode, setObjectPlacementMode] = useState(false);
const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
const [dmObjects, setDmObjects] = useState<DMObject[]>([...]);
```

#### MapCanvas

```typescript
const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);
const [draggedObjectStart, setDraggedObjectStart] = useState<{
  gridX: number;
  gridY: number;
} | null>(null);
```

## Known Limitations

### Current Limitations

1. **No Delete Key Support**: Objects must be deleted via UI (planned for future)
2. **No Multi-Select**: Can only move one object at a time
3. **No Undo/Redo**: No undo for movement operations
4. **Grid Snapping Only**: Objects snap to grid cells (no sub-grid positioning)
5. **No Rotation**: Can't rotate objects during/after placement
6. **No Scaling**: Can't resize objects after placement

### Future Enhancements

- [ ] Delete key to remove selected objects
- [ ] Context menu for object actions (delete, duplicate, etc.)
- [ ] Multi-select and group movement
- [ ] Undo/Redo for placement and movement
- [ ] Object rotation controls
- [ ] Object scaling controls
- [ ] Sub-grid positioning with snap-to-grid toggle
- [ ] Object snapping to other objects
- [ ] Copy/paste objects
- [ ] Object properties panel (notes, tags, etc.)

## Files Modified

### Core Changes

- `src/pages/DMPage.tsx` - Added Sprites tab, placement mode, movement handlers
- `src/App.tsx` - Added onObjectMove handler
- `src/components/MapCanvas.tsx` - Added drag detection, palette support, movement logic

### Type Updates

- `src/types/palette.ts` - Already had necessary types
- `src/types/objects.ts` - No changes needed

## Testing Checklist

### DM Mode

- [x] Sprites tab displays palette
- [x] Selecting sprite enters placement mode
- [x] Clicking map places sprite
- [x] Can place multiple copies
- [x] Objects appear on map
- [x] Objects sync to players
- [x] Can drag objects to move them
- [x] Movement syncs to players
- [x] Cursor changes during drag
- [x] Visibility toggle works

### Map Builder

- [x] Can place objects from palette
- [x] Can drag objects to reposition
- [x] Changes persist
- [x] Works with zoom/pan
- [x] Cursor feedback works

### Edge Cases

- [x] Dragging with Ctrl still pans map
- [x] Placement mode doesn't interfere with dragging
- [x] Delete mode doesn't trigger drag
- [x] Objects maintain z-order
- [x] Top-most object selected when overlapping

## Performance Notes

### Optimizations

- Object lookup uses sorted z-index for click detection
- Single canvas clear and redraw per frame
- State updates batched in React
- WebSocket sends only changed objects

### Considerations

- Image loading from base64 is async (onload handler)
- Many objects may impact rendering performance
- Consider virtualization for 1000+ objects

## Conclusion

Object placement and movement is now fully functional in both DM mode and map builder mode. The system supports:

- ✅ Sprite placement from palette
- ✅ Drag-and-drop repositioning
- ✅ Real-time sync to players (DM mode)
- ✅ Visual feedback (cursors, indicators)
- ✅ Proper z-ordering and click detection

The implementation maintains separation between pan/zoom and object interaction, providing intuitive controls for both DMs and map builders.
