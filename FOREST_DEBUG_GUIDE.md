# Forest Rendering Debug Guide

## Issue
The forest is rendering as a solid color instead of showing individual trees with clearings.

## Changes Made

### 1. Background Color
- **Changed**: Forest background from dark green `#1a3a1a` to light tan/brown `#d4c5a0`
- **Reason**: Clearings should be visible as the base color, trees drawn on top

### 2. Tree Rendering
- **Method**: Individual circles drawn at tree coordinates
- **Layers**: 3-layer rendering (base dark green, middle green, highlight)
- **Size**: Based on `tree.size` parameter (calculated from Perlin noise)

### 3. Tree Radius Parameter
- **Added**: `treeRadius` parameter (0.5-5.0, default 1.5)
- **UI**: Slider in parameter form (0.5-5.0 range)
- **Presets**: Updated with appropriate values

### 4. Logging Added

#### Generator Logging (ForestGenerator.ts)
```typescript
console.log(`[ForestGenerator] Generated ${points.length} Poisson points`);
console.log(`[ForestGenerator] Map size: ${this.width}x${this.height}`);
console.log(`[ForestGenerator] Parameters:`, { treeDensity, minTreeDistance, noiseScale, treeRadius });
console.log(`[ForestGenerator] Created ${trees.length} trees from ${points.length} points`);
console.log(`[ForestGenerator] Sample trees:`, trees.slice(0, 3));
console.log(`[ForestGenerator] Returning map data with ${trees.length} trees`);
```

#### Rendering Logging (MapCanvas.tsx)
```typescript
console.log(`[MapCanvas] Rendering Forest terrain`);
console.log(`[drawForest] Called with showTrees=${showTrees}, trees count=${mapData.trees?.length || 0}`);
console.log(`[drawForest] cellSize=${cellSize}`);
console.log(`[drawForest] Drawing ${mapData.trees.length} trees`);
console.log(`[drawForest] Sample trees:`, mapData.trees.slice(0, 3));
console.log(`[drawForest] First tree: pos=(${centerX}, ${centerY}), radius=${radius}`);
```

## How to Debug

### 1. Open Browser Console
- Generate a forest map
- Check the console output

### 2. Expected Console Output
```
[ForestGenerator] Generated 450 Poisson points
[ForestGenerator] Map size: 100x100
[ForestGenerator] Parameters: {treeDensity: 0.3, minTreeDistance: 3, noiseScale: 0.05, treeRadius: 1.5}
[ForestGenerator] Created 135 trees from 450 points
[ForestGenerator] Sample trees: [{x: 10, y: 15, size: 1.2}, {x: 25, y: 30, size: 1.8}, ...]
[ForestGenerator] Returning map data with 135 trees
[MapCanvas] Rendering Forest terrain
[drawForest] Called with showTrees=true, trees count=135
[drawForest] cellSize=4
[drawForest] Drawing 135 trees
[drawForest] Sample trees: [{x: 10, y: 15, size: 1.2}, {x: 25, y: 30, size: 1.8}, ...]
[drawForest] First tree: pos=(40, 60), radius=4.8
```

### 3. Check These Values

#### If trees.length is 0:
- **Problem**: Perlin noise threshold too high (no trees pass the filter)
- **Solution**: Increase `treeDensity` parameter (try 0.5 or higher)

#### If Poisson points is very low:
- **Problem**: Map too small or `minTreeDistance` too large
- **Solution**: Increase map size or decrease `minTreeDistance`

#### If trees exist but not visible:
- **Problem**: Rendering issue (cellSize, coordinates, or canvas size)
- **Check**: 
  - Is `showTrees` toggle enabled?
  - Are tree coordinates within canvas bounds?
  - Is cellSize appropriate for tree radius?

#### If background is solid color:
- **Problem**: Trees might be rendering but very small/invisible
- **Check**: 
  - Tree radius calculation
  - cellSize value
  - Canvas dimensions

## Visual Expectations

### Correct Rendering
- Light tan/brown background (clearings)
- Dark green circles scattered across canvas (trees)
- Trees have 3 layers (dark base, medium middle, light highlight)
- Clear empty spaces between trees

### Incorrect Rendering (Solid Color)
- Entire canvas one color
- No visible individual trees
- No clearings visible

## Test Parameters

### For Visible Trees
```typescript
{
  width: 100,
  height: 100,
  treeDensity: 0.5,      // Higher density = more trees
  minTreeDistance: 3,     // Moderate spacing
  noiseScale: 0.05,       // Standard variation
  treeRadius: 2.0,        // Larger trees
  cellSize: 4             // Good visibility
}
```

### For Debugging
```typescript
{
  width: 50,              // Smaller map
  height: 50,
  treeDensity: 0.8,      // Very high density
  minTreeDistance: 3,
  noiseScale: 0.05,
  treeRadius: 3.0,       // Very large trees
  cellSize: 8            // Large cell size
}
```

## Common Issues and Solutions

### Issue: "No trees generated"
**Symptoms**: `Created 0 trees from X points`
**Cause**: `treeDensity` too low or Perlin noise values unfavorable
**Solution**: Increase `treeDensity` to 0.5+

### Issue: "Trees exist but canvas is solid"
**Symptoms**: Trees in data, but rendering looks uniform
**Cause**: Background and tree colors too similar, or trees too small
**Solution**: 
- Check background color is `#d4c5a0` (tan)
- Check tree colors are green shades
- Increase `treeRadius`

### Issue: "Very few Poisson points"
**Symptoms**: `Generated 10 Poisson points` (very low)
**Cause**: `minTreeDistance` too large for map size
**Solution**: Decrease `minTreeDistance` or increase map size

### Issue: "Trees render outside canvas"
**Symptoms**: Console shows large coordinates
**Cause**: Tree coordinates exceed map dimensions
**Solution**: Check tree.x < width and tree.y < height

## Files Modified

1. **src/generators/ForestGenerator.ts**
   - Added logging for generation process
   - Added `treeRadius` parameter
   - Updated tree size calculation

2. **src/components/MapCanvas.tsx**
   - Changed forest background color to `#d4c5a0`
   - Added logging for rendering process
   - Updated tree rendering with 3 layers

3. **src/types/generator.ts**
   - Added `treeRadius` parameter to interface

4. **src/components/ParameterForm.tsx**
   - Added Tree Radius slider (0.5-5.0 range)

5. **src/utils/presets.ts**
   - Updated presets with `treeRadius` values

## Next Steps

1. **Run the app**: `npm start`
2. **Open browser console**: F12 or Ctrl+Shift+I
3. **Select Forest terrain**
4. **Click Generate**
5. **Read console output**
6. **Share the console logs** to diagnose the issue

## Expected Behavior

After generating a forest, you should see:
- Tan/brown background (forest floor)
- Green circles scattered across the map (individual trees)
- Varying tree sizes (based on Perlin noise)
- Clear empty spaces (clearings)

The console will tell us exactly what's happening at each step!
