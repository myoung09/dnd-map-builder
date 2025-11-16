# Organic Path Implementation Guide

## How It Works

### Forest and Cave Terrain Types

When generating maps for **FOREST** or **CAVE** terrain types, the system now creates truly organic, curved paths instead of L-shaped corridors with 90-degree angles.

### Path Generation Logic

**Location**: `src/services/mapGenerationService.ts` → `createPathBetweenRooms()`

```typescript
const isOrganicTerrain =
  options.terrainType === MapTerrainType.FOREST ||
  options.terrainType === MapTerrainType.CAVE;

if (isOrganicTerrain) {
  // Creates curved, winding paths using Bezier curves
  // Returns immediately with isOrganic: true
}
```

### Key Features

1. **Bezier Curve Pathing**

   - Uses quadratic Bezier curves between start and end points
   - Random midpoint creates natural curve direction
   - Wobble factor adds irregularity to each point

2. **Variable Width**

   - 30% chance of width variation at each point
   - Creates natural, hand-drawn appearance

3. **Smooth Rendering**
   - Rendered as overlapping rounded rectangles
   - Full corner rounding (`cornerRadius = cellWidth / 2`)
   - Creates flowing, organic appearance

### Rendering Logic

**Location**: `src/components/MapCanvas/NewMapCanvas.tsx`

```typescript
if (obj.properties?.isOrganic && obj.properties?.pathPoints) {
  // Renders curved path with rounded cells
}
```

## Testing

To verify organic paths are working:

1. Open the app and click "Generate Map"
2. Select **Forest** or **Cave** as the map type
3. Click "Quick Generate"
4. **Expected Result**: Paths should be curved and winding, not straight L-shapes
5. **Room shapes**: Should be irregular blobs, not rectangles/circles

## Troubleshooting

If you're still seeing L-shaped paths:

1. **Clear browser cache** - Old JavaScript might be cached
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Generate a new map** - Don't just reload, create a fresh map
4. **Check the browser console** - Look for any errors during generation

## Code Changes Summary

### mapGenerationService.ts

- Added `isOrganicTerrain` check before path generation
- Organic terrain returns early with `pathPoints` and `isOrganic: true`
- Structured terrain continues to use `corridorPoints` and `isLShaped: true`

### NewMapCanvas.tsx

- Added check for `isOrganic` property before `isLShaped`
- Organic paths render with full corner rounding
- Organic rooms render as irregular polygons using Line with tension

## Visual Comparison

### Before (All Terrain Types)

- Rooms: Perfect rectangles
- Paths: L-shaped with 90-degree angles
- Appearance: Grid-aligned, architectural

### After (Forest/Cave)

- Rooms: Irregular blob shapes
- Paths: Curved, winding trails
- Appearance: Natural, hand-drawn

### After (House/Town/Dungeon)

- Rooms: Rectangles (intentional for buildings)
- Paths: L-shaped corridors with slight wobble
- Appearance: Structured architecture
