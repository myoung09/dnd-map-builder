# View Window Fixes

## Issues Fixed

### 1. View Window Too Large (Issue #1)

**Problem:** The initial view window was 800×600 pixels, which was about 4 times too large for the map.

**Solution:** Reduced the initial view window size to 400×300 pixels (20×15 cells at cellSize 20).

**Changes in `DMPage.tsx`:**

```typescript
// Before:
const initialWidth = 800;
const initialHeight = 600;
minWidth: initialWidth,
minHeight: initialHeight,

// After:
const initialWidth = 400;
const initialHeight = 300;
minWidth: 200,  // Allow shrinking to 10x cells
minHeight: 150, // Maintain 4:3 aspect ratio minimum
```

### 2. Player View Not Aligned with DM View Window (Issue #2)

**Problem:** The player's viewport wasn't showing the exact area defined by the DM's view window.

**Solution:** Improved the viewport calculation in `PlayerPage.tsx` to:

- Add a 5% margin (0.95 multiplier) for better visibility
- Better center the view window in the player's viewport
- More detailed console logging for debugging

**Changes in `PlayerPage.tsx`:**

```typescript
// Added better zoom calculation with margin
const newZoom = Math.min(zoomX, zoomY) * 0.95; // 95% to add small margin

// Improved console logging
console.log("[PlayerPage] View window calculation:", {
  viewWindow,
  containerWidth,
  containerHeight,
  newZoom,
  newPanX,
  newPanY,
  scaledWidth,
  scaledHeight,
});
```

## How It Works

### View Window System

1. **DM Side:**

   - View window is a draggable/resizable red rectangle on the DM's map
   - Initial size: 400×300 pixels (20×15 cells)
   - Minimum size: 200×150 pixels (10×7.5 cells)
   - Can be dragged and resized with 8 handles (4 corners + 4 edges)
   - Position is in canvas coordinates (pixels from top-left)

2. **Player Side:**
   - Receives view window coordinates via WebSocket
   - Calculates zoom to fit view window to viewport
   - Calculates pan to center the view window
   - Player can add manual pan/zoom on top of the controlled viewport

### Coordinate System

- **Canvas Coordinates:** Absolute pixel positions on the map (0,0 = top-left of map)
- **View Window:** Defined in canvas coordinates (x, y, width, height)
- **DM Transform:** DM's own pan/zoom for navigation (doesn't affect view window coordinates)
- **Player Transform:** Calculated from view window + optional manual adjustments

### Transform Flow

```
DM Map (canvas coords)
  ↓
View Window Rectangle (x, y, width, height)
  ↓
WebSocket Broadcast
  ↓
Player Viewport Calculation
  - zoom = min(viewportWidth / windowWidth, viewportHeight / windowHeight) * 0.95
  - panX = (viewportWidth - scaledWidth) / 2 - (windowX * zoom)
  - panY = (viewportHeight - scaledHeight) / 2 - (windowY * zoom)
  ↓
Player View (shows exact area defined by view window)
```

## Testing

To verify the fixes work correctly:

1. **Start a DM session** with a generated map
2. **Open player view** in another browser window/tab
3. **Check view window size** - should be 400×300 (much smaller than before)
4. **Drag the view window** - player view should show the exact area
5. **Resize the view window** - player zoom should adjust to fit
6. **Pan/zoom the DM view** - view window should move with the map, player view stays locked to window area
7. **Player can manually pan/zoom** - adds on top of the controlled viewport

## Console Logging

Both DM and Player pages now log detailed information:

**DMPage:**

```
[DMPage] View window updated: { x, y, width, height }
```

**PlayerPage:**

```
[PlayerPage] View window calculation: {
  viewWindow: { x, y, width, height },
  containerWidth: 1920,
  containerHeight: 1080,
  newZoom: 2.5,
  newPanX: -100,
  newPanY: -200,
  scaledWidth: 1000,
  scaledHeight: 750
}
```

## Related Files

- `src/pages/DMPage.tsx` - DM control interface with view window
- `src/pages/PlayerPage.tsx` - Player view with viewport calculation
- `src/components/ViewWindowOverlay.tsx` - View window drag/resize component
- `src/types/dm.ts` - ViewWindow type definition
- `src/services/websocket.ts` - WebSocket communication

## Future Improvements

- Add view window presets (small, medium, large, full map)
- Add "lock aspect ratio" option for resizing
- Add view window coordinates display
- Add "center on object" feature
- Add smooth transitions when view window changes
- Add view window history (undo/redo)
