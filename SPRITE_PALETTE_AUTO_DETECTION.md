# Sprite Palette - Auto-Detection System

## Overview

The sprite palette system automatically detects and extracts all non-blank sprites from the 32Rogues sprite pack. The system filters out empty tiles and organizes sprites by their source file.

## Features

### ✅ Automatic Detection

- Scans each sprite sheet pixel-by-pixel
- Extracts all 32x32 sprites sequentially
- No manual cataloging required

### ✅ Blank Tile Filtering

- Detects transparent/empty sprites
- Only includes sprites with visible content
- Uses alpha channel analysis (>4% opacity threshold)

### ✅ No Duplicates

- Each sprite extracted once
- Sequential processing from each file
- Proper sprite sheet isolation

### ✅ All Files Included

- ✅ rogues.png - Character sprites
- ✅ monsters.png - Monster sprites
- ✅ animals.png - Animal sprites
- ✅ items.png - Weapons, armor, items, potions
- ✅ animated-tiles.png - Environmental objects, torches, fires

## Categories

The palette organizes sprites into 5 categories based on source files:

1. **Characters (rogues.png)**

   - Player character classes
   - NPCs and townspeople
   - Workers and peasants

2. **Monsters (monsters.png)**

   - Fantasy creatures
   - Enemies and bosses
   - Undead and aberrations

3. **Animals (animals.png)**

   - Wildlife and pets
   - Livestock
   - Birds and reptiles

4. **Items & Equipment (items.png)**

   - Weapons (swords, axes, bows, staves)
   - Armor pieces and shields
   - Magic items and jewelry
   - Consumables (potions, scrolls)
   - Keys, coins, food

5. **Environment (animated-tiles.png)**
   - Light sources (torches, braziers, lamps)
   - Fire effects
   - Water and environmental hazards
   - Animated objects

## How It Works

### Detection Algorithm

```typescript
1. Load each PNG sprite sheet
2. Get image dimensions and calculate grid
3. For each 32x32 tile:
   a. Analyze pixel alpha values
   b. Calculate average opacity
   c. If >4% opacity: extract sprite
   d. If <=4% opacity: skip (blank tile)
4. Assign sequential IDs and names
5. Store extracted sprite as base64 PNG
```

### Blank Detection

Sprites are considered blank if:

- Average alpha (transparency) < 10 (on 0-255 scale)
- This means less than ~4% opacity
- Filters out empty grid spaces

## Usage

### Accessing the Palette

1. Open the application
2. Click menu icon (☰) in top-left
3. Select the **"Palette"** tab
4. Browse sprites by category

### Sprite Information

Each sprite includes:

- **Auto-generated name**: e.g., "characters 15", "items 42"
- **Category**: Based on source file
- **Position**: Original x,y coordinates in sheet
- **Image data**: Base64-encoded 32x32 PNG

### Placing Sprites

1. Select a sprite from the palette
2. Click on the map to place
3. Sprite appears at cursor position

## Technical Details

### Files

- **`src/utils/simplePalette.ts`**: Auto-detection logic
- **`src/App.tsx`**: Palette initialization
- **`src/components/PalettePanel.tsx`**: UI display
- **`src/assets/*.png`**: Sprite sheet images

### Performance

- Initial load: ~2-3 seconds
- Processes all sheets in parallel
- Sprites cached after extraction
- No reloading during session

### Memory Usage

- ~2-3 MB for all extracted sprites
- Base64 encoding for web compatibility
- Individual sprite images stored separately

## Console Output

When the palette loads, you'll see:

```
[App] Palette useEffect triggered
[App] Loading sprite palette with auto-detection...
[SimplePalette] Starting sprite extraction...
[SimplePalette] Extracted X non-blank sprites from rogues
[SimplePalette] Extracted X non-blank sprites from monsters
[SimplePalette] Extracted X non-blank sprites from animals
[SimplePalette] Extracted X non-blank sprites from items
[SimplePalette] Extracted X non-blank sprites from animated-tiles
[SimplePalette] Total sprites extracted: XXX
[App] Palette loaded with XXX non-blank sprites
[App] Sprites by category:
  - Characters (rogues.png): XX sprites
  - Monsters (monsters.png): XX sprites
  - Animals (animals.png): XX sprites
  - Items & Equipment (items.png): XX sprites
  - Environment (animated-tiles.png): XX sprites
```

## Benefits Over Manual Cataloging

### Advantages

✅ **No manual work** - Auto-detects everything
✅ **No duplicates** - Each sprite counted once
✅ **No missing sprites** - Gets everything from all files
✅ **No blank tiles** - Automatically filtered
✅ **Accurate positions** - Calculated from actual layout
✅ **Easy updates** - Just replace PNG files

### Trade-offs

⚠️ **Generic names** - "characters 15" instead of "Knight"
⚠️ **Basic categories** - File-based instead of semantic
⚠️ **No tags** - Can't search by "magic" or "heavy armor"

## Future Enhancements

### Planned

- [ ] Custom sprite naming UI
- [ ] Add tags to sprites after loading
- [ ] Save/load custom sprite metadata
- [ ] Manual blank tile removal tools
- [ ] Sprite preview on hover
- [ ] Search and filter sprites

### Advanced

- [ ] Animation frame detection
- [ ] Multi-frame sprite support
- [ ] Custom sprite categorization
- [ ] Sprite thumbnail size options
- [ ] Batch rename tools

## Troubleshooting

### No Sprites Showing

**Symptoms**: Empty palette or "No Sprites Yet" message
**Solutions**:

1. Check browser console for errors
2. Verify PNG files in `src/assets/` folder
3. Hard refresh (Ctrl+Shift+R)
4. Check console for extraction messages

### Wrong Sprite Count

**Symptoms**: Too many or too few sprites
**Solutions**:

1. Check blank detection threshold (currently 4%)
2. Verify PNG files aren't corrupted
3. Look at console output for extraction counts

### Sprites Not Clickable

**Symptoms**: Can't select sprites in palette
**Solutions**:

1. Ensure palette state is not null
2. Check React DevTools for component state
3. Verify sprite imageData is populated

## Credits

**Sprite Pack**: 32Rogues v0.5.0  
**System**: Auto-detection with blank filtering  
**Implementation**: DnD Map Builder Team

---

**System Status**: ✅ Fully Operational  
**Total Processing Time**: ~2-3 seconds  
**Blank Tiles Filtered**: Automatic  
**All Files Included**: Yes
