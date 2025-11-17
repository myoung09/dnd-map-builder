# Grid Size Bug Fix

## Problem

Grid sizes configured in house configs (24px for Castle, 48px for Cottage, etc.) were not being applied. The canvas was always using the default 32px grid size.

## Root Cause

In `App.tsx`, the `NewMapCanvas` component was being passed a hardcoded `gridSize={32}` prop instead of reading the value from the map's `gridConfig.cellSize`.

## Solution

Updated `App.tsx` to read grid size from the map configuration:

**Before:**

```tsx
<NewMapCanvas
  map={currentMap}
  // ... other props
  showGrid={true}
  gridSize={32} // ❌ Hardcoded!
/>
```

**After:**

```tsx
<NewMapCanvas
  map={currentMap}
  // ... other props
  showGrid={true}
  gridSize={currentMap.gridConfig?.cellSize || 32} // ✅ Reads from map config
/>
```

## Impact

Now when you generate different house types, the grid will automatically adjust:

- **Cottage**: 48px grid (largest cells, smallest building appearance)
- **Wizard Tower**: 40px grid
- **Inn**: 36px grid
- **Manor**: 32px grid (standard)
- **Castle**: 24px grid (smallest cells, largest building appearance)

## Testing

1. Generate a **Cottage** - should see larger grid cells
2. Generate a **Castle** - should see smaller grid cells
3. Compare side-by-side to verify visual difference

## Files Changed

- `src/App.tsx` - Line 880: Updated `gridSize` prop to read from `currentMap.gridConfig.cellSize`

## Build Status

✅ Build successful
✅ No TypeScript errors
✅ Ready to test in browser
