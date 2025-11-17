# Grid Size and Room Spacing Configuration

## Overview

Added configurable grid cell sizes and room spacing to house subtypes, allowing precise control over building scale perception and room density.

## New Configuration Properties

### Grid Cell Size (`gridCellSize`)

Controls the perceived building scale through grid cell dimensions.

- **Larger grid cells** = Smaller building appearance (e.g., Cottage at 48px)
- **Smaller grid cells** = Larger building appearance (e.g., Castle at 24px)
- Default: 32px

### Minimum Room Spacing (`minRoomSpacing`)

Determines the number of grid cells between rooms (acts as deterministic padding).

- **1 grid cell** = Very close together (tight interior feel)
- **2+ grid cells** = More space (thick walls, corridors)
- Default: 2 grid cells

## House Subtype Grid Configurations

| House Type       | Grid Size | Room Spacing | Purpose                          |
| ---------------- | --------- | ------------ | -------------------------------- |
| **Cottage**      | 48px      | 1 cell       | Smallest building, cozy interior |
| **Wizard Tower** | 40px      | 1 cell       | Medium-small mystical tower      |
| **Inn**          | 36px      | 1 cell       | Medium size, compact rooms       |
| **Manor**        | 32px      | 1 cell       | Standard large estate            |
| **Castle**       | 24px      | 2 cells      | Largest building, thick walls    |

## How It Works

### Grid Cell Size

Configured at both subtype and story levels:

```typescript
export const COTTAGE_CONFIG: SubtypeConfig = {
  subtype: HouseSubtype.COTTAGE,
  gridCellSize: 48, // Overall subtype default
  stories: [
    {
      story: HouseStory.STORY_1,
      gridCellSize: 48, // Override per story if needed
      // ...
    },
  ],
};
```

**Application:**

- Used in `generateLayeredMap()` to set the map's `gridConfig.cellSize`
- Story-level config takes precedence over subtype-level config
- Falls back to default 32px if not configured

### Room Spacing

Configured at both subtype and story levels:

```typescript
export const COTTAGE_CONFIG: SubtypeConfig = {
  minRoomSpacing: 1, // 1 grid cell between rooms
  stories: [
    {
      story: HouseStory.STORY_1,
      minRoomSpacing: 1, // Override per story if needed
      // ...
    },
  ],
};
```

**Application:**

- Used in `createRoomInContainer()` to create deterministic padding
- Replaces random padding with fixed spacing
- Rooms are now exactly `minSpacing` cells away from container edges
- Story-level config takes precedence over subtype-level config
- Falls back to default 2 cells if not configured

## Visual Effects

### Grid Size Impact

**Cottage (48px grid):**

- Map displays larger grid cells
- Fewer cells fit on screen
- Building appears smaller/more intimate
- Suitable for 3-5 room buildings

**Castle (24px grid):**

- Map displays smaller grid cells
- More cells fit on screen
- Building appears larger/more grandiose
- Suitable for 8-12 room buildings

### Room Spacing Impact

**1 Cell Spacing (Houses, Cottages, Inns):**

- Rooms very close together
- Minimal "wall thickness"
- Interior-focused layout
- Corridors connect tightly

**2 Cell Spacing (Castles):**

- Rooms more separated
- Visible thick walls
- Fortification feel
- More breathing room

## Code Changes

### 1. Type Definitions (`src/config/types.ts`)

Added optional properties:

- `StoryConfig.gridCellSize?: number`
- `StoryConfig.minRoomSpacing?: number`
- `SubtypeConfig.gridCellSize?: number`
- `SubtypeConfig.minRoomSpacing?: number`

### 2. House Configurations (`src/config/terrains/houseConfig.ts`)

Updated all house subtypes with:

- Subtype-level `gridCellSize` and `minRoomSpacing`
- Story-level `gridCellSize` and `minRoomSpacing` for all floors

### 3. Map Generation Service (`src/services/mapGenerationService.ts`)

**`generateLayeredMap()` - Dynamic Grid Size:**

```typescript
// Determine grid cell size from house config
let gridCellSize = 32; // Default
if (options.terrainType === MapTerrainType.HOUSE && options.subtype && options.story) {
  const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
  if (houseConfig && houseConfig.stories) {
    const storyConfig = houseConfig.stories.find((s: any) => s.story === options.story);
    if (storyConfig && storyConfig.gridCellSize) {
      gridCellSize = storyConfig.gridCellSize;
    } else if (houseConfig.gridCellSize) {
      gridCellSize = houseConfig.gridCellSize;
    }
  }
}

// Apply to grid config
gridConfig: {
  cellSize: gridCellSize,
  // ...
}
```

**`createRoomInContainer()` - Deterministic Spacing:**

```typescript
// Determine minimum spacing from config
let minSpacing = 2; // Default
if (
  options.terrainType === MapTerrainType.HOUSE &&
  options.subtype &&
  options.story
) {
  const houseConfig = getHouseConfig(options.subtype as HouseSubtype);
  if (houseConfig && houseConfig.stories) {
    const storyConfig = houseConfig.stories.find(
      (s: any) => s.story === options.story
    );
    if (storyConfig && storyConfig.minRoomSpacing !== undefined) {
      minSpacing = storyConfig.minRoomSpacing;
    } else if (houseConfig.minRoomSpacing !== undefined) {
      minSpacing = houseConfig.minRoomSpacing;
    }
  }
}

// Create deterministic padding
const paddingLeft = minSpacing;
const paddingTop = minSpacing;
const paddingRight = minSpacing;
const paddingBottom = minSpacing;
```

### 4. Documentation (`src/config/README.md`)

Updated with:

- Grid cell size and room spacing explanations
- House terrain configuration table showing grid sizes
- Updated type documentation

## Benefits

### 1. Deterministic Room Placement

- **Before:** Random padding (0 to 1/3 of container size)
- **After:** Fixed padding based on configuration
- **Result:** Predictable, consistent room spacing

### 2. Scale Perception Control

- **Before:** All houses used 32px grid
- **After:** Each house type has appropriate grid scale
- **Result:** Cottages feel small, castles feel grand

### 3. Interior Design Flexibility

- **Before:** No control over room density
- **After:** Configure tight (1 cell) or spacious (2+ cells) layouts
- **Result:** Houses feel more realistic (cozy vs. fortified)

### 4. Easier Tuning

- **Before:** Hardcoded values in service
- **After:** Configuration-driven
- **Result:** Change grid sizes without touching service code

## Usage Example

Generate a cottage with tight rooms and large grid:

```typescript
const cottageMap = mapGenerationService.generateLayeredMap({
  terrainType: MapTerrainType.HOUSE,
  subtype: HouseSubtype.COTTAGE,
  story: HouseStory.STORY_1,
  // ... other options
});

// Result:
// - gridConfig.cellSize = 48 (large grid)
// - Rooms spaced exactly 1 cell apart (tight interior)
// - Cottage appears small and cozy
```

Generate a castle with spacious rooms and small grid:

```typescript
const castleMap = mapGenerationService.generateLayeredMap({
  terrainType: MapTerrainType.HOUSE,
  subtype: HouseSubtype.CASTLE,
  story: HouseStory.STORY_1,
  // ... other options
});

// Result:
// - gridConfig.cellSize = 24 (small grid)
// - Rooms spaced 2 cells apart (thick walls)
// - Castle appears large and fortified
```

## Future Enhancements

1. **Per-Room Spacing:** Allow different spacing for specific room types
2. **Variable Spacing:** Support min/max range instead of fixed value
3. **Grid Size Scaling:** Auto-scale grid based on room count
4. **UI Controls:** Expose grid size and spacing in map generation UI
5. **Other Terrains:** Apply configurable spacing to caves, forests, dungeons
6. **Wall Thickness:** Use spacing values to render actual wall graphics

## Testing

- ✅ TypeScript compilation successful
- ✅ No runtime errors
- ⏳ Visual testing needed (generate maps and compare grid sizes)
- ⏳ Verify room spacing is deterministic
- ⏳ Confirm grid cell sizes appear correctly in UI

## Notes

- Room spacing is now **deterministic** rather than random
- This may make layouts appear more "regular" - future enhancement could add optional variation
- Grid size affects both visual appearance AND game mechanics (movement distances)
- Larger grid cells mean fewer cells to traverse, making maps feel smaller in gameplay
