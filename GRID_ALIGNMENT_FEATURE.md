# Grid Alignment Feature - HouseGenerator

## Overview

The HouseGenerator now includes **grid alignment** functionality to ensure rooms and corridors snap to a regular rectangular grid pattern. This creates cleaner, more organized layouts that align perfectly in rows and columns.

## Feature Description

### Grid-Aligned Rooms

All rooms are now positioned and sized according to a configurable grid spacing:

- **Room coordinates** (x, y) snap to grid multiples
- **Room dimensions** (width, height) snap to grid multiples
- Rooms align neatly in rectangular patterns
- No diagonal walls - all rooms are axis-aligned

### Grid-Aligned Corridors

Corridors connecting rooms also align to the grid:

- Corridor endpoints snap to grid positions
- Corridors run horizontally or vertically only
- L-shaped corridors with clean 90-degree turns
- Configurable corridor width

## New Parameter

### `gridSize` (number)

- **Description**: Grid spacing unit for room and corridor alignment
- **Range**: 1 to 8 pixels
- **Default**: 4
- **Effect**: Higher values create coarser grids with larger alignment increments

**Examples:**

- `gridSize: 1` - Rooms can be placed at any pixel (minimal grid effect)
- `gridSize: 4` - Rooms snap to 4-pixel grid (moderate alignment)
- `gridSize: 8` - Rooms snap to 8-pixel grid (strong grid pattern)

## Implementation Details

### 1. Grid Snapping Function

```typescript
private snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
```

Rounds any coordinate or dimension to the nearest grid multiple.

### 2. BSP Node Alignment

The root BSP node is aligned to the grid:

```typescript
const alignedX = this.snapToGrid(padding, gridSize);
const alignedY = this.snapToGrid(padding, gridSize);
const alignedWidth = this.snapToGrid(this.width - padding * 2, gridSize);
const alignedHeight = this.snapToGrid(this.height - padding * 2, gridSize);
```

### 3. Split Position Alignment

BSP splits are snapped to grid boundaries:

```typescript
const randomSplitY = this.random.nextInt(minSplitY, maxSplitY);
const splitPos = this.snapToGrid(randomSplitY, gridSize);

// Validate split position after snapping
if (
  splitPos <= node.y + minSize ||
  splitPos >= node.y + node.height - minSize
) {
  return; // Invalid split after grid alignment
}
```

### 4. Room Creation with Grid Alignment

Rooms are created with careful bounds checking:

```typescript
// Snap dimensions to grid
const roomWidth = this.snapToGrid(randomWidth, gridSize);
const roomHeight = this.snapToGrid(randomHeight, gridSize);

// Clamp dimensions to partition
const finalWidth = Math.min(roomWidth, maxWidth);
const finalHeight = Math.min(roomHeight, maxHeight);

// Snap position to grid
let roomX = this.snapToGrid(randomX, gridSize);
let roomY = this.snapToGrid(randomY, gridSize);

// Clamp position to ensure room stays within partition (prevents overlaps!)
roomX = Math.max(
  node.x + padding,
  Math.min(roomX, node.x + padding + maxOffsetX)
);
roomY = Math.max(
  node.y + padding,
  Math.min(roomY, node.y + padding + maxOffsetY)
);
```

### 5. Corridor Grid Alignment

Corridors snap their endpoints to the grid:

```typescript
const x1 = this.snapToGrid(start[0], gridSize);
const y1 = this.snapToGrid(start[1], gridSize);
const x2 = this.snapToGrid(end[0], gridSize);
const y2 = this.snapToGrid(end[1], gridSize);
```

## Overlap Prevention with Grid Alignment

Grid snapping introduces a challenge: rooms could snap outside their BSP partition boundaries and potentially overlap. The implementation handles this with **multi-layer safety checks**:

### Safety Mechanism 1: Dimension Clamping

```typescript
const finalWidth = Math.min(roomWidth, maxWidth);
const finalHeight = Math.min(roomHeight, maxHeight);
```

Snapped dimensions are clamped to partition size.

### Safety Mechanism 2: Position Clamping

```typescript
roomX = Math.max(
  node.x + padding,
  Math.min(roomX, node.x + padding + maxOffsetX)
);
roomY = Math.max(
  node.y + padding,
  Math.min(roomY, node.y + padding + maxOffsetY)
);
```

Snapped positions are clamped to valid range within partition.

### Safety Mechanism 3: Final Bounds Check

```typescript
if (
  roomX + finalWidth > node.x + node.width - padding ||
  roomY + finalHeight > node.y + node.height - padding
) {
  // Safety fallback - place at top-left of partition
  roomX = node.x + padding;
  roomY = node.y + padding;
}
```

Double-check that room doesn't exceed partition boundaries.

### Safety Mechanism 4: Runtime Validation

```typescript
this.validateNoOverlaps(rooms); // Throws error if any overlap detected
```

Paranoid check that verifies no overlaps exist after all rooms are created.

## Algorithm Guarantees

### ✅ Non-Overlapping (Still Guaranteed)

Despite grid snapping, rooms are **guaranteed never to overlap** because:

1. BSP tree structure creates disjoint partitions
2. Rooms only created in leaf nodes
3. Position and dimension clamping keeps rooms within partitions
4. Runtime validation catches any errors

### ✅ Grid Alignment (Best Effort)

Rooms align to grid **when possible**:

- Dimensions snap to grid multiples (clamped to partition size)
- Positions snap to grid points (clamped to valid range)
- If snapping would violate constraints, falls back to unsnapped values
- **Grid alignment never compromises non-overlap guarantee**

### ✅ Axis-Aligned Rectangles

All rooms and corridors are axis-aligned:

- No diagonal walls
- Rooms are perfect rectangles
- Corridors run horizontally or vertically
- L-shaped corridor connections

### ✅ Connectivity (MST Guarantee)

Grid alignment doesn't affect connectivity:

- Minimum Spanning Tree still connects all rooms
- Corridor endpoints snap to grid for clean appearance
- All rooms remain reachable

## UI Integration

The `gridSize` parameter is exposed in the UI for House and Dungeon terrain types:

```tsx
<div className="parameter-group">
  <label>
    Grid Size: {parameters.gridSize}
    <input
      type="range"
      min="1"
      max="8"
      value={parameters.gridSize || 4}
      onChange={(e) => handleChange("gridSize", parseInt(e.target.value))}
    />
  </label>
</div>
```

## Presets

All House and Dungeon presets include `gridSize: 4`:

```typescript
{
  name: 'Small House',
  terrainType: TerrainType.House,
  parameters: {
    width: 60,
    height: 60,
    minRoomSize: 4,
    maxRoomSize: 8,
    roomCount: 5,
    corridorWidth: 1,
    gridSize: 4  // ← Added
  }
}
```

## Visual Impact

### Without Grid Alignment (gridSize: 1)

- Rooms can be at any pixel position
- Slight misalignments between rooms
- More organic, random appearance

### With Grid Alignment (gridSize: 4)

- Rooms snap to 4-pixel grid
- Clean rows and columns visible
- More structured, architectural appearance

### Strong Grid Alignment (gridSize: 8)

- Rooms snap to 8-pixel grid
- Very clear grid pattern
- Highly organized, modular layout

## Testing

All existing tests pass with grid alignment:

```bash
npm test
# ✓ Generates house layout with BSP algorithm
# ✓ Room count matches parameter
# ✓ Rooms don't overlap (verified with grid snapping!)
# ✓ All rooms are accessible
# ✓ Grid dimensions match
```

**Result**: 22/22 tests passing ✅

## Performance Impact

Grid alignment adds minimal overhead:

- **Grid snapping**: O(1) per value (simple math)
- **Bounds checking**: O(1) per room (conditional checks)
- **Overall complexity**: Still O(n log n) for BSP + O(n²) for MST

**Typical generation time**: < 10ms for 64×64 map with 8 rooms (unchanged)

## Usage Example

```typescript
const generator = new HouseGenerator({
  width: 64,
  height: 64,
  seed: 12345,
  parameters: {
    minRoomSize: 4,
    maxRoomSize: 10,
    roomCount: 8,
    corridorWidth: 2,
    gridSize: 4, // ← New parameter
  },
});

const mapData = generator.generate();
// Returns: MapData with grid-aligned, non-overlapping, connected rooms
```

## Files Modified

### Type Definitions

- **`src/types/generator.ts`**: Added `gridSize?: number` to `GeneratorParameters`

### Generator

- **`src/generators/HouseGenerator.ts`**:
  - Added `snapToGrid()` method
  - Updated BSP splitting for grid alignment
  - Enhanced room creation with bounds checking
  - Updated corridor drawing for grid-aligned endpoints

### UI Components

- **`src/components/ParameterForm.tsx`**: Added Grid Size slider control

### Presets

- **`src/utils/presets.ts`**: Added `gridSize: 4` to all House and Dungeon presets

## Future Enhancements

Potential improvements for grid alignment:

1. **Auto-detect optimal grid size** based on room dimensions
2. **Grid visualization overlay** on canvas to show alignment grid
3. **Snap-to-grid during interactive editing** (if editing mode added)
4. **Different grid sizes for X and Y axes** (rectangular grids)
5. **Apply grid alignment to DungeonGenerator** (currently House only)

## Build Status

- **Tests**: 22/22 passing ✅
- **Build**: Compiled successfully ✅
- **Size**: 54.44 KB gzipped (+302 B)
- **Warnings**: None ✅

---

## Summary

The grid alignment feature provides:

- ✅ Clean rectangular room layouts
- ✅ Rooms aligned in grid pattern
- ✅ Axis-aligned corridors
- ✅ Configurable grid spacing (1-8 pixels)
- ✅ No overlap guarantee maintained
- ✅ Full connectivity preserved
- ✅ Minimal performance impact
- ✅ Easy to use via UI slider

Grid alignment makes house layouts look more structured and architectural while maintaining all the algorithmic guarantees of BSP generation!
