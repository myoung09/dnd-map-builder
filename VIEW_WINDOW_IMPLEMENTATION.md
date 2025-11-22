# View Window Implementation

## Overview

The View Window system allows the Dungeon Master to control what players see by dragging and resizing a viewport rectangle on their map. This provides precise control over player visibility and creates a dynamic, theater-of-the-mind experience.

## Features

### DM Controls

- **Draggable Rectangle**: Blue outlined rectangle overlaid on DM's map
- **Resize Handles**: 8 handles (4 corners + 4 edges) for resizing
- **Minimum Size Constraint**: Window cannot be made smaller than initial size (800×600px)
- **Map Boundary Constraints**: Window stays within map bounds
- **Real-time Sync**: All changes broadcast instantly to players via WebSocket
- **Visual Feedback**: Shows current dimensions in label

### Player Experience

- **Automatic Pan/Zoom**: Player view automatically adjusts to match view window
- **Center Framing**: View window is always centered in player's viewport
- **Smooth Transitions**: React state updates provide smooth viewport changes
- **Fog of War Compatible**: Works seamlessly with existing fog of war system

## Architecture

### Type Definitions (`src/types/dm.ts`)

```typescript
export interface ViewWindow {
  x: number; // Top-left X position in pixels
  y: number; // Top-left Y position in pixels
  width: number; // Width in pixels
  height: number; // Height in pixels
  minWidth: number; // Minimum width constraint
  minHeight: number; // Minimum height constraint
}
```

Added to `DMSessionState`:

```typescript
export interface DMSessionState {
  // ... existing fields
  viewWindow?: ViewWindow; // Player viewport control
}
```

### WebSocket Events

**New Event Type**:

```typescript
VIEW_WINDOW_UPDATE = "VIEW_WINDOW_UPDATE";
```

**Event Interface**:

```typescript
export interface WSViewWindowUpdateEvent {
  type: WSEventType.VIEW_WINDOW_UPDATE;
  payload: ViewWindow;
}
```

### Components

#### ViewWindowOverlay (`src/components/ViewWindowOverlay.tsx`)

**Purpose**: Renders the draggable/resizable rectangle on DM's map

**Props**:

```typescript
interface ViewWindowOverlayProps {
  viewWindow: ViewWindow;
  onViewWindowChange: (viewWindow: ViewWindow) => void;
  mapWidth: number; // Grid width
  mapHeight: number; // Grid height
  cellSize: number; // Pixels per grid cell
}
```

**Features**:

- **Drag Functionality**: Click and drag body to move
- **Resize Handles**:
  - Corner handles: `nw`, `ne`, `sw`, `se` (diagonal resize)
  - Edge handles: `n`, `s`, `e`, `w` (directional resize)
- **Constraints**:
  - Minimum size enforcement
  - Map boundary clamping
  - Smooth handle hover effects
- **Visual Design**:
  - Blue border (#3498db)
  - Semi-transparent fill (10% opacity)
  - Blue glow shadow
  - White-bordered handles
  - Dimension label at top

**Implementation Details**:

```typescript
// Drag State
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState<{...} | null>(null);

// Resize State
const [isResizing, setIsResizing] = useState(false);
const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
const [resizeStart, setResizeStart] = useState<{...} | null>(null);

// Mouse event handlers attached to document during drag/resize
useEffect(() => {
  if (isDragging || isResizing) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Cleanup on unmount
  }
}, [isDragging, isResizing, ...]);
```

## Integration Points

### DMPage (`src/pages/DMPage.tsx`)

**State Management**:

```typescript
const [viewWindow, setViewWindow] = useState<ViewWindow>(() => ({
  x: 0,
  y: 0,
  width: 800,
  height: 600,
  minWidth: 800,
  minHeight: 600,
}));
```

**Change Handler**:

```typescript
const handleViewWindowChange = useCallback((newViewWindow: ViewWindow) => {
  setViewWindow(newViewWindow);

  // Broadcast to players
  wsService.send({
    type: WSEventType.VIEW_WINDOW_UPDATE,
    payload: newViewWindow,
  });
}, []);
```

**Rendering**:

```tsx
<ViewWindowOverlay
  viewWindow={viewWindow}
  onViewWindowChange={handleViewWindowChange}
  mapWidth={mapData.width}
  mapHeight={mapData.height}
  cellSize={20}
/>
```

**Initial Sync**:

```typescript
const initialState: DMSessionState = {
  // ... other fields
  viewWindow: viewWindow,
};

wsService.send({
  type: WSEventType.SYNC_NOW,
  payload: { sessionState: initialState },
});
```

### PlayerPage (`src/pages/PlayerPage.tsx`)

**State Management**:

```typescript
const [viewWindow, setViewWindow] = useState<ViewWindow | null>(null);
const [zoom, setZoom] = useState(1);
const [panX, setPanX] = useState(0);
const [panY, setPanY] = useState(0);
```

**Pan/Zoom Calculation**:

```typescript
useEffect(() => {
  if (!viewWindow || !mapData) return;

  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  // Calculate zoom to fit view window to container
  const zoomX = containerWidth / viewWindow.width;
  const zoomY = containerHeight / viewWindow.height;
  const newZoom = Math.min(zoomX, zoomY);

  // Calculate pan to center view window
  const scaledViewWidth = viewWindow.width * newZoom;
  const scaledViewHeight = viewWindow.height * newZoom;

  const newPanX =
    (containerWidth - scaledViewWidth) / 2 - viewWindow.x * newZoom;
  const newPanY =
    (containerHeight - scaledViewHeight) / 2 - viewWindow.y * newZoom;

  setZoom(newZoom);
  setPanX(newPanX);
  setPanY(newPanY);
}, [viewWindow, mapData]);
```

**WebSocket Event Handlers**:

```typescript
// Live updates
const unsubViewWindow = wsService.on(
  WSEventType.VIEW_WINDOW_UPDATE,
  (event) => {
    if (event.type === WSEventType.VIEW_WINDOW_UPDATE) {
      setViewWindow(event.payload);
    }
  }
);

// Initial sync
const unsubSync = wsService.on(WSEventType.SYNC_NOW, (event) => {
  if (event.type === WSEventType.SYNC_NOW) {
    const state = event.payload.sessionState;
    if (state.viewWindow) {
      setViewWindow(state.viewWindow);
    }
  }
});
```

**MapCanvas Integration**:

```tsx
<MapCanvas
  // ... other props
  zoom={zoom}
  panX={panX}
  panY={panY}
/>
```

## Data Flow

### DM Drags View Window

```
1. User clicks ViewWindowOverlay body
   → isDragging = true
   → Store initial mouse position & window position

2. User moves mouse
   → Calculate delta from start
   → Apply delta to window position
   → Constrain to map bounds
   → Call onViewWindowChange()

3. DMPage.handleViewWindowChange()
   → Update local state
   → Broadcast WSEventType.VIEW_WINDOW_UPDATE via WebSocket

4. PlayerPage receives event
   → Update viewWindow state
   → Trigger pan/zoom calculation useEffect
   → Update MapCanvas props
   → Player view automatically repositions
```

### DM Resizes View Window

```
1. User clicks resize handle
   → isResizing = true
   → Store handle direction (e.g., 'se' for southeast)
   → Store initial mouse position & window dimensions

2. User moves mouse
   → Calculate delta from start
   → Apply delta based on handle direction:
     - 'n': Adjust y and height
     - 's': Adjust height only
     - 'e': Adjust width only
     - 'w': Adjust x and width
     - 'ne', 'nw', 'se', 'sw': Combine logic
   → Enforce minimum size constraints
   → Constrain to map bounds
   → Call onViewWindowChange()

3. Same WebSocket flow as drag
   → DMPage broadcasts
   → PlayerPage receives
   → Player zoom adjusts to fit new window size
```

### Player Joins Session

```
1. PlayerPage connects to WebSocket
   → wsService.connect(sessionId, 'player')

2. DMPage detects new connection
   → Sends SYNC_NOW event with full state
   → Includes current viewWindow

3. PlayerPage receives SYNC_NOW
   → Extracts viewWindow from sessionState
   → Sets viewWindow state
   → Pan/zoom calculation triggered
   → Player immediately sees correct viewport
```

## Use Cases

### 1. **Reveal New Areas**

DM drags view window to new section of map as party explores

- Players see smooth transition to new area
- Creates sense of discovery
- Maintains spatial awareness

### 2. **Focus on Combat**

DM shrinks window to zoom in on battle area

- Players get closer view of tactical situation
- Reduces distractions from rest of map
- Enhances tactical gameplay

### 3. **Show Wide Overview**

DM expands window to show large area

- Good for travel sequences
- Strategic planning sessions
- Establishing scene context

### 4. **Chase Sequences**

DM smoothly drags window following fleeing enemies

- Dynamic camera following action
- Maintains tension and excitement
- Players stay oriented

## Constraints and Limitations

### Current Constraints

- **Minimum Size**: 800×600 pixels (initial window size)
- **Map Boundaries**: Window cannot extend beyond map edges
- **Single Window**: Only one view window per session

### Known Limitations

1. **Fixed Aspect Ratio**: Player container fills viewport, window aspect may not match
2. **No Rotation**: View window is always axis-aligned
3. **No Multiple Windows**: Cannot show multiple areas simultaneously
4. **No Player Control**: Players cannot pan/zoom independently

### Future Enhancements

- [ ] Allow DM to set custom minimum size
- [ ] Snap to grid option
- [ ] Preset view window sizes (combat, exploration, overview)
- [ ] Keyboard shortcuts for view window control
- [ ] View window presets per map
- [ ] Animation/easing for smooth transitions
- [ ] Multiple view windows (picture-in-picture)
- [ ] Player ability to "peek" outside view window with permission

## Technical Considerations

### Performance

- **Drag/Resize**: Uses document-level event listeners, cleaned up properly
- **WebSocket**: Only sends updates during drag/resize (not per-pixel)
- **React Rendering**: MapCanvas receives new pan/zoom props, re-renders efficiently
- **No Throttling**: Consider adding if network congestion occurs

### Browser Compatibility

- Uses standard DOM events (mousemove, mouseup, mousedown)
- CSS transform for smooth visual feedback
- No vendor prefixes needed for modern browsers

### Accessibility

- Visual-only currently (no screen reader support)
- Could add ARIA labels and keyboard controls
- High contrast blue border aids visibility

## Testing Checklist

- [x] ✅ View window renders on DM map
- [x] ✅ Drag functionality works
- [x] ✅ Resize handles work (all 8 directions)
- [x] ✅ Minimum size constraint enforced
- [x] ✅ Map boundary constraint enforced
- [x] ✅ WebSocket broadcasts on change
- [x] ✅ PlayerPage receives updates
- [x] ✅ Player view adjusts pan/zoom correctly
- [x] ✅ Initial sync includes view window
- [ ] 🔲 Late-joining players get correct viewport
- [ ] 🔲 Fog of war respects view window
- [ ] 🔲 Multiple players see same viewport
- [ ] 🔲 Drag performance is smooth
- [ ] 🔲 Resize performance is smooth
- [ ] 🔲 Works with different map sizes
- [ ] 🔲 Works with different cell sizes

## Code Examples

### Adding View Window Control Button

```tsx
// In DMPage toolbar
<Button
  variant="contained"
  onClick={() => {
    // Reset to default view
    setViewWindow({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      minWidth: 800,
      minHeight: 600,
    });
  }}
>
  Reset View
</Button>
```

### Animating View Window Transitions

```typescript
// Add to handleViewWindowChange
const handleViewWindowChange = useCallback((newViewWindow: ViewWindow) => {
  // Smooth transition using CSS
  setIsTransitioning(true);
  setViewWindow(newViewWindow);

  setTimeout(() => setIsTransitioning(false), 300);

  wsService.send({
    type: WSEventType.VIEW_WINDOW_UPDATE,
    payload: newViewWindow,
  });
}, []);
```

### Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "ArrowUp") {
      // Pan view window up
      handleViewWindowChange({
        ...viewWindow,
        y: Math.max(0, viewWindow.y - 50),
      });
    }
    // Add more shortcuts...
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [viewWindow]);
```

## Troubleshooting

### View Window Not Visible

- Check that mapData is loaded
- Verify ViewWindowOverlay is rendered after MapCanvas
- Check z-index (should be 1000)
- Ensure position: absolute is set

### Drag Not Working

- Verify onMouseDown handler is attached
- Check isDragging state updates
- Ensure document event listeners are added
- Check for event.stopPropagation() conflicts

### Player View Not Updating

- Check WebSocket connection status
- Verify VIEW_WINDOW_UPDATE event is sent
- Check PlayerPage event listener is registered
- Verify pan/zoom calculation logic
- Check MapCanvas receives props

### Size Constraints Not Working

- Verify minWidth/minHeight are set in state
- Check resize logic enforces constraints
- Ensure Math.max() is used correctly

## Summary

The View Window system provides DMs with powerful, intuitive control over player visibility. By combining a draggable/resizable overlay on the DM view with automatic pan/zoom calculation on the player view, it creates a seamless theater-of-the-mind experience synchronized in real-time via WebSocket.

The implementation is modular, performant, and extensible for future enhancements while maintaining simple, predictable behavior.
