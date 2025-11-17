# Terrain Configuration System

## Overview

The terrain configuration system provides a clean, modular way to define and manage different terrain types, subtypes, and their generation parameters. All configurations are separated from the generation engine, making it easy to add new terrain types or modify existing ones.

## Architecture

```
src/config/
├── index.ts                    # Main export point
├── types.ts                    # TypeScript type definitions
└── terrains/
    ├── houseConfig.ts          # House subtype configurations
    ├── colorThemes.ts          # Color themes for all terrains
    ├── forestConfig.ts         # (TODO) Forest subtype configurations
    ├── caveConfig.ts           # (TODO) Cave subtype configurations
    ├── townConfig.ts           # (TODO) Town subtype configurations
    └── dungeonConfig.ts        # (TODO) Dungeon subtype configurations
```

## Type Hierarchy

### TerrainConfig

Top-level configuration for a terrain type (HOUSE, FOREST, CAVE, TOWN, DUNGEON)

- Contains available subtypes
- Contains color themes
- Defines default generation parameters

### SubtypeConfig

Configuration for a specific variant within a terrain type

- Example: COTTAGE, MANOR, INN within HOUSE terrain
- Defines room shapes, sizes, and generation parameters
- Can include multi-story configurations

### StoryConfig

Configuration for a specific floor/story (houses only)

- Defines room count, sizes, and corridor widths
- Specifies whether to use basement colors
- Room padding and other per-story parameters

### TerrainColorTheme

Color palette for a terrain type

- Background color
- Path/room color
- Optional accent colors
- Contrast ratio for accessibility

## Usage Examples

### Importing Configurations

```typescript
import { HOUSE_SUBTYPES, getHouseConfig } from "@/config";
import { TERRAIN_COLOR_THEMES, getColorThemes } from "@/config";
```

### Getting a House Configuration

```typescript
const manorConfig = getHouseConfig(HouseSubtype.MANOR);
const stories = manorConfig.stories;
const firstFloor = stories.find((s) => s.story === HouseStory.STORY_1);
```

### Getting Color Themes

```typescript
const houseThemes = getColorThemes(MapTerrainType.HOUSE);
const randomTheme = houseThemes[Math.floor(Math.random() * houseThemes.length)];
```

## Current Implementations

### ✅ House Terrain

- **Subtypes**: Cottage, Manor, Inn, Castle, Wizard Tower
- **Multi-story**: 2-4 floors including basement
- **Special Features**: Wizard Tower has circular background structure
- **Color Themes**: 3 themes (Warm Wood, Stone & Slate, Rich Wood)

### ✅ Color Themes

- All terrain types have 3 color themes each
- Dungeon inherits from Cave themes
- Each theme includes accessibility contrast ratio

## Adding New Configurations

### Adding a New House Subtype

1. Create configuration in `houseConfig.ts`:

```typescript
export const MANSION_CONFIG: SubtypeConfig = {
  subtype: HouseSubtype.MANSION,
  name: 'Mansion',
  description: 'Luxurious multi-wing estate',
  roomShape: 'rectangle',
  stories: [...]
};
```

2. Add to HOUSE_SUBTYPES map:

```typescript
[HouseSubtype.MANSION, MANSION_CONFIG];
```

### Adding a New Terrain Type

1. Create new config file: `src/config/terrains/yourTerrainConfig.ts`
2. Define subtypes using `SubtypeConfig` interface
3. Export subtype map and helper functions
4. Add color themes to `colorThemes.ts`
5. Export from `index.ts`

## Benefits of This Architecture

1. **Separation of Concerns**: Configuration separate from generation logic
2. **Easy to Extend**: Add new subtypes without touching generation code
3. **Type Safety**: Full TypeScript support with interfaces
4. **Centralized**: All configs in one place
5. **Testable**: Can test configurations independently
6. **Maintainable**: Changes to one subtype don't affect others
7. **Discoverable**: Clear structure makes it easy to find and understand configs

## Migration Notes

The mapGenerationService will be refactored to:

1. Import configurations from config files instead of initializing them internally
2. Use configuration-driven generation instead of hardcoded logic
3. Support plugin-style background renderers (e.g., Wizard Tower circles)

## Future Enhancements

- [ ] Forest subtype configurations (Dense Forest, Enchanted Grove, etc.)
- [ ] Cave subtype configurations (Natural Cavern, Crystal Cave, etc.)
- [ ] Town subtype configurations (Village, Market District, etc.)
- [ ] Dungeon subtype configurations (Crypts, Prison, Temple, etc.)
- [ ] Plugin system for custom terrain types
- [ ] JSON schema for external configuration loading
- [ ] Visual configuration editor
