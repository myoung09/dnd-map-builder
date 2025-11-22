# Pan and Zoom Controls

## Overview

Both the DM and Player views now support pan (move around the map) and zoom (magnify/shrink the view) controls for better map navigation and detail viewing.

## DM View

### Pan (Move the Map)

**Ctrl + Click & Drag** anywhere on the map:

- Hold `Ctrl` key
- Click and hold the left mouse button
- Move your mouse to pan the map
- Release to stop panning

### Zoom

**Mouse Wheel**:

- Scroll **up** to zoom in (magnify)
- Scroll **down** to zoom out (shrink)
- Zoom range: 0.5x to 3x

### Key Features for DMs

- **Independent of Player View**: Your pan/zoom doesn't affect what players see
- **View Window Moves With Map**: The blue view window rectangle follows the map transform
- **Object Placement Works**: Place objects while zoomed/panned - they go to the correct location
- **Light Placement Works**: Light sources are placed at the correct map coordinates

### Use Cases

1. **Detailed Object Placement**: Zoom in to precisely place small objects
2. **Big Picture View**: Zoom out to see the entire map layout
3. **Navigation**: Pan to different areas without scrolling
4. **Precision Editing**: Zoom in to fine-tune light source positions

## Player View

### Pan (Move the Map)

**Ctrl + Click & Drag** anywhere on the map:

- Hold `Ctrl` key
- Click and hold the left mouse button
- Move your mouse to pan the map
- Release to stop panning

### Zoom

**Mouse Wheel**:

- Scroll **up** to zoom in (magnify)
- Scroll **down** to zoom out (shrink)
- Zoom range: 0.5x to 3x

### How It Works with View Window

The player view has **two layers of control**:

1. **DM-Controlled (Automatic)**:

   - The view window sets the base viewport
   - Map automatically centers on the view window area
   - Zoom adjusts to fit the view window in the screen

2. **Player-Controlled (Manual)**:
   - Players can pan to look around within the allowed area
   - Players can zoom for more or less detail
   - Manual adjustments are **added to** the DM's view window

### Combined Behavior

```
Final View = View Window Position + Manual Pan
Final Zoom = View Window Zoom × Manual Zoom
```

**Example**:

- DM sets view window at position (100, 100) with size 800×600
- Player view automatically centers on that area (zoom = 1.5x to fit screen)
- Player manually pans right 50 pixels and zooms in 1.2x
- Final result: Centered at (150, 100) with zoom = 1.8x (1.5 × 1.2)

### Use Cases for Players

1. **Examine Details**: Zoom in to read small text or see intricate details
2. **Peek Ahead**: Pan slightly to see edges of the revealed area
3. **Tactical View**: Zoom out to see more of the battlefield
4. **Personal Preference**: Adjust view to comfortable viewing distance

## Technical Implementation

### DM View (DMPage.tsx)

```typescript
// State
const [dmZoom, setDmZoom] = useState(1);
const [dmPanX, setDmPanX] = useState(0);
const [dmPanY, setDmPanY] = useState(0);

// Handlers
const handleDmZoomChange = useCallback((newZoom: number) => {
  setDmZoom(newZoom);
}, []);

const handleDmPanChange = useCallback((dx: number, dy: number) => {
  setDmPanX((prev) => prev + dx);
  setDmPanY((prev) => prev + dy);
}, []);

// Pass to MapCanvas
<MapCanvas
  zoom={dmZoom}
  panX={dmPanX}
  panY={dmPanY}
  onZoomChange={handleDmZoomChange}
  onPanChange={handleDmPanChange}
/>;
```

### View Window Transform

The `ViewWindowOverlay` component accounts for DM's pan/zoom:

```typescript
// Calculate transformed position
const transformedX = viewWindow.x * dmZoom + dmPanX;
const transformedY = viewWindow.y * dmZoom + dmPanY;
const transformedWidth = viewWindow.width * dmZoom;
const transformedHeight = viewWindow.height * dmZoom;

// Mouse deltas are scaled by zoom
const dx = (e.clientX - dragStart.x) / dmZoom;
const dy = (e.clientY - dragStart.y) / dmZoom;
```

This ensures:

- View window visually follows the map transform
- Dragging the view window works correctly regardless of zoom level
- Canvas coordinates remain consistent

### Player View (PlayerPage.tsx)

```typescript
// Base pan/zoom from view window (automatic)
const [zoom, setZoom] = useState(1);
const [panX, setPanX] = useState(0);
const [panY, setPanY] = useState(0);

// Manual adjustments (player-controlled)
const [manualPanX, setManualPanX] = useState(0);
const [manualPanY, setManualPanY] = useState(0);
const [manualZoom, setManualZoom] = useState(1);

// Combine them
const finalZoom = zoom * manualZoom;
const finalPanX = panX + manualPanX;
const finalPanY = panY + manualPanY;

// Pass to MapCanvas
<MapCanvas
  zoom={finalZoom}
  panX={finalPanX}
  panY={finalPanY}
  onZoomChange={handleZoomChange}
  onPanChange={handlePanChange}
/>;
```

### MapCanvas Component

The `MapCanvas` component handles the actual rendering:

```typescript
// Props
interface MapCanvasProps {
  zoom?: number;
  panX?: number;
  panY?: number;
  onZoomChange?: (newZoom: number) => void;
  onPanChange?: (dx: number, dy: number) => void;
}

// Mouse wheel handler
const handleWheel = useCallback(
  (e: React.WheelEvent) => {
    if (!onZoomChange) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    onZoomChange(newZoom);
  },
  [zoom, onZoomChange]
);

// Mouse drag handler (Ctrl+Drag)
const handleMouseDown = useCallback(
  (e: React.MouseEvent) => {
    if (e.ctrlKey && onPanChange) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
      e.preventDefault();
    }
  },
  [panX, panY, onPanChange]
);

// Transform applied to canvas
const transformStyle = {
  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
  transformOrigin: "center center",
};
```

## Keyboard Shortcuts

### Current

- **Ctrl + Mouse Wheel**: Zoom in/out (same as mouse wheel alone)
- **Ctrl + Click & Drag**: Pan the map

### Future Enhancements

Potential keyboard shortcuts to add:

- **Arrow Keys**: Pan in small increments
- **+/-**: Zoom in/out in steps
- **0**: Reset zoom to 100%
- **Home**: Reset pan to origin
- **F**: Fit entire map in view
- **Ctrl + 1**: Zoom to 100%
- **Ctrl + 2**: Zoom to 200%

## Constraints

### Zoom Limits

- **Minimum**: 0.5x (50% - zoomed out)
- **Maximum**: 3x (300% - zoomed in)
- Prevents extreme zooms that make the map unusable

### Pan Limits

- **None currently**: Can pan infinitely
- Map may go off-screen if panned too far
- Future: Could add bounds to keep map visible

## Tips and Best Practices

### For DMs

1. **Reset Often**: If you get lost panning, refresh the page to reset
2. **Zoom for Precision**: Use 2x-3x zoom for detailed object placement
3. **Wide View for Strategy**: Use 0.5x zoom to see the full map layout
4. **Combine with View Window**: Pan your view while adjusting the player's view window

### For Players

1. **Respect the View Window**: DM controls what you should see
2. **Use Zoom for Details**: Can't read the text? Zoom in!
3. **Don't Wander Too Far**: Manual panning is for minor adjustments
4. **Reset if Disoriented**: Refresh the page to reset to DM's view

## Troubleshooting

### "Map disappeared after panning"

- You've panned too far off-screen
- **Solution**: Refresh the page to reset

### "Zoom doesn't work"

- Check that you're not at the min/max limit (0.5x or 3x)
- **Solution**: Try zooming in the opposite direction

### "Ctrl+Drag selects text instead of panning"

- You're clicking on a UI element instead of the map
- **Solution**: Click directly on the map canvas area

### "View window is hard to grab when zoomed out"

- The view window is small in screen space
- **Solution**: Zoom in before adjusting the view window

### "Objects are placed at wrong location when zoomed"

- This should not happen - transforms are accounted for
- **Report**: If this occurs, it's a bug - please report it

### "Player view jumps when DM updates view window"

- This is expected behavior
- Manual pan/zoom is reset when view window changes
- **Reason**: DM has priority control over player viewport

## Future Enhancements

### Planned Features

- [ ] Reset View button (reset pan/zoom to default)
- [ ] Zoom to Fit button (fit entire map in view)
- [ ] Minimap showing current viewport
- [ ] Smooth transitions for pan/zoom changes
- [ ] Keyboard shortcuts for pan/zoom
- [ ] Pan limits (prevent map from going completely off-screen)
- [ ] Zoom to cursor position (zoom centers on mouse location)
- [ ] Persistent zoom/pan settings per session

### Possible Features

- [ ] Different zoom limits for DM vs Players
- [ ] Allow DM to lock player pan/zoom
- [ ] Synchronized zoom between DM and players
- [ ] Zoom indicators showing current level
- [ ] Touch gesture support for mobile (pinch to zoom, swipe to pan)

## Summary

Pan and zoom controls give both DMs and players freedom to navigate the map at their preferred scale and position. The DM has complete control over their view without affecting players, while players can make manual adjustments on top of the DM's view window settings. The combination creates a flexible, powerful viewing system for any D&D session.

**Key Takeaway**: The DM controls the "camera" (view window), but both DM and players can adjust their personal "viewfinder" (pan/zoom) to see details or get the big picture.
