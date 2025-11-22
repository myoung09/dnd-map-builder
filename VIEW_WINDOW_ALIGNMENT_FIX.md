# View Window Alignment Fix - Complete Solution

## Problem Summary

The DM's view window (red rectangle) was not aligned with what the player was seeing. The player would see a different part of the map than what the DM's view window was showing.

## Root Causes Identified

### 1. **Canvas Centering Issue**

- **Problem**: Both DM and Player pages had flexbox centering (`display: flex`, `alignItems: center`, `justifyContent: center`)
- **Impact**: The canvas was centered in its container, but the ViewWindowOverlay was positioned relative to the container's top-left, not the canvas's top-left
- **Solution**: Removed centering from both pages, made canvas start at (0,0)

### 2. **Transform Origin Issue** ⭐ **KEY FIX**

- **Problem**: MapCanvas had `transformOrigin: 'center center'`
- **Impact**: When zooming, the canvas scaled from its center instead of top-left corner, completely breaking the coordinate system
- **Solution**: Changed to `transformOrigin: 'top left'`

### 3. **Initial View Window Size**

- **Problem**: View window started at 800×600, too large for typical maps
- **Solution**: Reduced to 400×300 with flexible minimum sizes

## Changes Made

### 1. MapCanvas.tsx

```typescript
// BEFORE
const transformStyle = {
  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
  transformOrigin: "center center", // ❌ Wrong!
  transition: "transform 0.1s ease-out",
};

// AFTER
const transformStyle = {
  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
  transformOrigin: "top left", // ✅ Correct!
  transition: "transform 0.1s ease-out",
};
```

### 2. DMPage.tsx

```typescript
// BEFORE - Centered layout
<Box
  sx={{
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',          // ❌ Centering
    alignItems: 'center',     // ❌ Centering
    justifyContent: 'center', // ❌ Centering
  }}
>

// AFTER - Top-left aligned
<Box
  sx={{
    flex: 1,
    position: 'relative',
    overflow: 'auto', // ✅ Allow scrolling
  }}
>
```

### 3. PlayerPage.tsx

```typescript
// BEFORE - Centered layout with manual controls
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  }}
>

// AFTER - Top-left aligned, no manual controls
<Box
  sx={{
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  }}
>
  <Box sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'block',
    '& .map-canvas-container': {
      position: 'absolute',
      top: 0,
      left: 0,
    }
  }}>
```

### 4. Player Pan/Zoom Calculation

```typescript
// Simplified calculation - no centering
const newZoom = Math.min(zoomX, zoomY); // Fill viewport
const newPanX = -viewWindow.x * newZoom; // Position at screen (0,0)
const newPanY = -viewWindow.y * newZoom;
```

**Removed**: Manual pan/zoom controls for player (was causing offset issues)

### 5. View Window Initial Size

```typescript
// DMPage.tsx - Reduced initial size
const initialWidth = 400;  // Was 800
const initialHeight = 300; // Was 600
minWidth: 200,  // Was 800
minHeight: 150, // Was 600
```

### 6. ViewWindowOverlay Styling

Changed from debug red to subtle blue:

- Border: `3px solid #2196F3` (was 5px red)
- Background: `rgba(33, 150, 243, 0.15)` (was red 0.3)
- Shadow: Subtle blue (was bright red)

## How It Works Now

### Coordinate System

```
Canvas Space (pixels on map):
  - Origin: (0, 0) = top-left of canvas
  - View window defined in canvas space: {x, y, width, height}

Screen Space (pixels on viewport):
  - Origin: (0, 0) = top-left of screen
  - Transform: translate(panX, panY) scale(zoom)
  - Formula: screenPos = canvasPos * zoom + pan

Transform Origin:
  - Set to 'top left' so scaling happens from (0,0)
  - Canvas point (0,0) always stays at screen position (0,0) + pan
```

### DM Side Flow

1. View window positioned at canvas coordinates (e.g., x=0, y=0)
2. ViewWindowOverlay applies DM's zoom/pan transform to stay aligned with canvas
3. Raw canvas coordinates sent to player via WebSocket
4. DM can pan/zoom their view independently

### Player Side Flow

1. Receive view window: `{x: 0, y: 0, width: 400, height: 300}`
2. Calculate zoom to fill viewport: `zoom = min(viewportWidth/400, viewportHeight/300)`
3. Calculate pan to position view window at screen (0,0): `pan = -viewWindow.x * zoom`
4. Player sees exactly the area inside the DM's view window
5. No manual controls - 100% DM-controlled

## Testing Verification

### What to Test

1. **Initial Load**: View window at (0, 0) - player sees top-left corner
2. **Drag View Window**: Player view follows immediately
3. **Resize View Window**: Player zoom adjusts to fit
4. **DM Pan/Zoom**: View window moves with canvas, player view unchanged
5. **Different View Windows**:
   - Top-left (0, 0) → Player sees top-left
   - Center (800, 600) → Player sees center
   - Bottom-right (1200, 1000) → Player sees bottom-right

### Console Verification

```javascript
// Player console should show:
[PlayerPage] View window calculation: {
  viewWindow: { x: 0, y: 0, width: 400, height: 300 },
  result: { zoom: 3.2, panX: 0, panY: 0 },
  verification: {
    topLeftScreen: { x: 0, y: 0 },      // ✅ Should be (0,0)
    bottomRightScreen: { x: 1280, y: 960 } // ✅ Should fill viewport
  }
}
```

## Key Lessons

1. **Transform Origin Matters**: Always check `transform-origin` when using scale transforms
2. **Coordinate Systems**: Clearly define canvas space vs screen space
3. **Avoid Centering**: Centering with flexbox breaks absolute positioning
4. **Debug Early**: Console logs with verification math helped identify issues quickly

## Future Enhancements

- [ ] View window presets (small, medium, large, full map)
- [ ] Snap to grid for view window positioning
- [ ] View window rotation support
- [ ] Multiple view windows (picture-in-picture)
- [ ] View window history/bookmarks
- [ ] Smooth transitions when view window changes
- [ ] View window aspect ratio lock
- [ ] Player can "peek" outside view window (with DM permission)
