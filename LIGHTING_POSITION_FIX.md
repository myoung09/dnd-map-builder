# Lighting Position Fix

## Problem

Light sources were positioned absolutely relative to the viewport, but the maps were centered on the page. This caused several issues:

1. Light positions didn't match where the DM clicked on the map
2. Player fog of war holes didn't align with the actual map
3. DM couldn't see where lights were placed (no visual indicators)
4. DM map wasn't centered like the player map

## Root Cause

- Maps are centered using flexbox (`display: flex`, `alignItems: center`, `justifyContent: center`)
- Light positions were calculated relative to the container, not the canvas
- Fog canvas and light overlays were positioned relative to viewport, not canvas
- No wrapper element to contain canvas and overlays together

## Solution

### 1. Center DM Map

Added flexbox centering to DM page to match player view:

```tsx
<Box sx={{
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}}>
```

### 2. Canvas Wrapper for Proper Positioning

Both DM and Player pages now use a wrapper around the canvas and overlays:

```tsx
<Box sx={{ position: 'relative' }}>
  <MapCanvas ref={canvasRef} {...props} />

  {/* Light indicators/fog positioned relative to canvas */}
  {lighting.lightSources.map(...)}
</Box>
```

This ensures:

- Canvas and overlays share the same coordinate system
- Lights positioned with `position: absolute` are relative to canvas wrapper
- Everything stays aligned when centered

### 3. Get Canvas Element for Click Coordinates

Added `getCanvas()` method to MapCanvasRef:

**src/components/MapCanvas.tsx:**

```tsx
export interface MapCanvasRef {
  exportToPNG: () => string;
  resetView: () => void;
  getCanvas: () => HTMLCanvasElement | null; // NEW
}

useImperativeHandle(ref, () => ({
  // ...existing methods
  getCanvas: () => terrainCanvasRef.current,
}));
```

### 4. Calculate Light Position Relative to Canvas

Updated DM click handler to get coordinates from canvas element:

**src/pages/DMPage.tsx:**

```tsx
const handleMapClick = useCallback(
  (event: React.MouseEvent<HTMLDivElement>) => {
    if (!lightPlacementMode || !canvasRef.current) return;

    // Get the actual canvas element
    const canvasElement = canvasRef.current.getCanvas?.();
    if (!canvasElement) return;

    // Get click position relative to the canvas element
    const canvasRect = canvasElement.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    // Create light source...
  },
  [lightPlacementMode, selectedLightType]
);
```

### 5. Visual Light Indicators on DM Map

Added dashed circle overlays so DM can see where lights are:

**src/pages/DMPage.tsx:**

```tsx
{
  lighting.lightSources.map((light) => (
    <Box
      key={`indicator-${light.id}`}
      sx={{
        position: "absolute",
        left: `${light.x}px`,
        top: `${light.y}px`,
        width: `${light.radius * 2}px`,
        height: `${light.radius * 2}px`,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        border: `2px dashed ${light.color}`,
        backgroundColor: `${light.color}22`,
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  ));
}
```

Shows:

- Dashed border in light color
- Semi-transparent fill
- Exact radius of light effect
- Positioned exactly where clicked

### 6. Match Fog Canvas to Map Canvas Size

Updated fog canvas to match map canvas dimensions:

**src/pages/PlayerPage.tsx:**

```tsx
useEffect(() => {
  const canvas = fogCanvasRef.current;
  const mapCanvas = canvasRef.current?.getCanvas?.();

  if (!canvas || !mapCanvas || !lighting.fogOfWarEnabled) return;

  // Match canvas size to map canvas
  canvas.width = mapCanvas.width;
  canvas.height = mapCanvas.height;

  // Draw fog and light holes...
}, [lighting.fogOfWarEnabled, lighting.lightSources, mapData]);
```

Now fog canvas is exactly same size as map canvas, ensuring perfect alignment.

## File Changes

### Modified Files

1. **src/components/MapCanvas.tsx**

   - Added `getCanvas()` to MapCanvasRef interface
   - Exposed terrainCanvasRef through useImperativeHandle

2. **src/pages/DMPage.tsx**

   - Added flexbox centering to map container
   - Wrapped canvas in positioned Box
   - Updated click handler to use canvas coordinates
   - Added visual light source indicators

3. **src/pages/PlayerPage.tsx**
   - Wrapped canvas and fog in positioned Box
   - Updated fog canvas sizing to match map canvas
   - Moved fog and glow layers inside wrapper

## Testing

### DM View

1. ✅ Map is centered on screen
2. ✅ Click anywhere on map to place light
3. ✅ Dashed circle indicator appears exactly where clicked
4. ✅ Circle size matches light radius
5. ✅ Multiple lights can be placed accurately

### Player View

1. ✅ Map is centered on screen
2. ✅ Fog of war covers entire map
3. ✅ Light holes appear exactly where DM placed lights
4. ✅ Map is visible through light holes
5. ✅ Smooth gradient from visible to fog
6. ✅ Colored glow matches light type

## Key Concepts

### Coordinate Systems

- **Viewport coordinates**: `event.clientX/Y` (absolute page position)
- **Element coordinates**: Viewport coords - element.getBoundingClientRect()
- **Canvas coordinates**: Light positions relative to top-left of canvas

### Positioning Strategy

```
Centered Container (flexbox)
  └─ Canvas Wrapper (position: relative)
      ├─ MapCanvas (canvas element)
      ├─ Light Indicators (position: absolute)
      ├─ Fog Canvas (position: absolute)
      └─ Glow Effects (position: absolute)
```

All absolutely positioned children are relative to the wrapper, ensuring alignment.

### Why This Works

1. **Wrapper as coordinate origin**: All positions calculated relative to canvas
2. **Canvas sizing**: Fog canvas matches map canvas exactly
3. **No viewport dependency**: Coordinates independent of page scroll/layout
4. **Visual feedback**: DM sees indicators, players see effects

## Browser Compatibility

- ✅ Canvas `globalCompositeOperation`: All modern browsers
- ✅ Flexbox centering: Chrome 29+, Firefox 28+, Safari 9+
- ✅ `getBoundingClientRect()`: All browsers
- ✅ `position: absolute` within `position: relative`: All browsers

## Performance

- Fog canvas redraws only when lights change
- Light indicators are simple DOM elements (minimal overhead)
- Canvas operations are GPU-accelerated
- No layout thrashing or excessive reflows
