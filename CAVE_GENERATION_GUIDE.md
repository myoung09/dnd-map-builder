# Cave Generation: Resolution and Display Scale Guide

## Overview

The cave generation system uses two key parameters to control detail level and display size:

1. **Resolution** - How fine-grained the cave generation is (sub-grid detail)
2. **Display Scale** - How much to blow up the map for viewing (zoom multiplier)

## How It Works

### Resolution (Fine-Grained Generation)

The `resolution` parameter in `drunkardsWalk` config controls the detail level during cave generation:

```typescript
drunkardsWalk: {
  resolution: 5; // 5x sub-grid resolution
}
```

- **Resolution 1**: Generates at 1:1 grid scale (each cave tile = 1 grid unit)
- **Resolution 3**: Generates at 3x detail (each cave tile = 0.33 grid units)
- **Resolution 5**: Generates at 5x detail (each cave tile = 0.20 grid units)
- **Resolution 10**: Generates at 10x detail (each cave tile = 0.10 grid units)

**Higher resolution** = More organic, finely detailed caves with smoother edges

### Display Scale (Viewing Magnification)

The `displayScale` parameter controls how the generated map is displayed:

```typescript
drunkardsWalk: {
  displayScale: 2.0; // Double the display size
}
```

- **Scale 1.0**: Normal size (1 grid unit = 32px by default)
- **Scale 2.0**: 2x magnification (each grid unit displays at 64px)
- **Scale 3.0**: 3x magnification (each grid unit displays at 96px)

**Higher display scale** = Larger, easier-to-view map with standard grid overlay

## Workflow Examples

### Example 1: Very Fine Detail with Large Display

**Goal**: Create extremely detailed organic caves, then blow them up for easy viewing

```typescript
drunkardsWalk: {
  coveragePercent: 20,
  resolution: 10,        // 10x detail - very fine granularity
  displayScale: 5.0,     // 5x magnification - blow it up for viewing
  directionChangeChance: 0.3,
  widerAreaChance: 0.1
}
```

**Result**:

- Caves generated with 0.1 grid unit tiles (tiny, organic detail)
- Display scaled 5x so the map is large and easy to see
- Grid overlays at standard size on the scaled map
- Very smooth, natural-looking cave edges

### Example 2: Moderate Detail, Standard View

**Goal**: Balanced detail with normal viewing size

```typescript
drunkardsWalk: {
  resolution: 3,         // 3x detail - moderate granularity
  displayScale: 1.0      // Normal viewing size
}
```

**Result**:

- Caves with 0.33 grid unit tiles (good organic feel)
- Standard display size
- Grid at normal scale

### Example 3: Coarse Generation, Zoomed View

**Goal**: Quick generation with zoomed-in display

```typescript
drunkardsWalk: {
  resolution: 1,         // 1x resolution - coarse
  displayScale: 3.0      // 3x zoom for viewing
}
```

**Result**:

- Caves with 1.0 grid unit tiles (blockier, faster generation)
- Zoomed 3x for comfortable viewing
- Grid maintains readable size

## Configuration Per Cave Type

You can set different resolution and scale per cave subtype:

### Natural Cavern - High Detail

```typescript
drunkardsWalk: {
  resolution: 5,         // Fine organic detail
  displayScale: 2.0,     // 2x zoom for viewing
  coveragePercent: 20
}
```

### Lava Tubes - Very Fine Thin Passages

```typescript
drunkardsWalk: {
  resolution: 8,         // Very fine for thin tubes
  displayScale: 4.0,     // 4x zoom to see detail
  coveragePercent: 10    // Narrow coverage
}
```

### Underground Lake - Lower Detail, Large Scale

```typescript
drunkardsWalk: {
  resolution: 2,         // Lower detail for large chambers
  displayScale: 1.5,     // Slight zoom
  coveragePercent: 40    // Large open areas
}
```

## Advanced Settings UI

Users can adjust these in the "Advanced Options" section:

### Resolution Slider

- **Label**: "Cave Detail (Resolution)"
- **Range**: 1-10
- **Default**: 3
- **Description**: "Higher values create finer, more organic cave shapes"

### Display Scale Slider

- **Label**: "Display Zoom (Scale)"
- **Range**: 1.0 - 5.0
- **Step**: 0.5
- **Default**: 1.0
- **Description**: "Zoom multiplier for viewing fine-grained maps"

## Technical Details

### How Resolution Works

The cave generation algorithm creates a high-resolution grid:

```
Normal Map: 30x30 cells
Resolution 5: 150x150 internal cells (30 * 5)
Each cave tile: 1/5 = 0.2 grid units
```

The Drunkard's Walk algorithm operates on this fine grid, creating sub-grid detail. Then the tiles are converted back to map coordinates with fractional positions.

### How Display Scale Works

Display scale is applied during rendering:

```typescript
// In NewMapCanvas.tsx
const effectiveGridSize = gridSize * displayScale;

// Each object position is multiplied by effectiveGridSize
const x = obj.position.x * effectiveGridSize;
const y = obj.position.y * effectiveGridSize;
```

The grid overlay remains at standard 1:1 scale, overlaying cleanly on the scaled-up terrain.

### Grid Overlay Behavior

- Grid lines render at **1 grid cell** intervals (not affected by resolution)
- Grid size controlled by `gridConfig.cellSize` (default: 32px)
- Grid cells align with game grid (1 cell = 5ft in D&D)
- Cave tiles can span fractional grid cells (e.g., 0.25 x 0.5)

## Performance Considerations

### Resolution Impact

- **Higher resolution** = More computation during generation
- **Resolution 10** with 30x30 map = 300x300 internal cells
- Rectangle packing reduces render objects (9,000 tiles → ~500 rectangles)

### Display Scale Impact

- **Display scale** has minimal performance impact (just math)
- Canvas size increases: `30 * 32 * scale` pixels
- Higher scale may require more GPU memory for large maps

### Recommended Settings

**Fast Generation**:

```typescript
{ resolution: 2, displayScale: 1.0 }
```

**Balanced**:

```typescript
{ resolution: 3, displayScale: 1.5 }
```

**Maximum Detail**:

```typescript
{ resolution: 8, displayScale: 3.0 }
```

## Example Use Cases

### Case 1: Dungeon Master Prep

- Generate at **resolution: 10** for maximum organic detail
- Use **displayScale: 1.0** for accurate printout
- Export high-res image for VTT (Roll20, Foundry)

### Case 2: Digital Tabletop

- Generate at **resolution: 5** for good organic feel
- Use **displayScale: 2.0** for comfortable screen viewing
- Grid overlay provides measurement tool

### Case 3: Quick Battle Map

- Generate at **resolution: 2** for speed
- Use **displayScale: 1.5** for decent viewing
- Faster loading and rendering

## Future Enhancements

Potential additions:

- **Auto-scale**: Automatically adjust displayScale based on resolution
- **Resolution presets**: "Draft / Standard / High Detail" buttons
- **Export scale**: Separate scale for image export vs. display
- **Per-layer scale**: Different zoom levels for terrain vs. objects
