# Map Generation User Guide

## Quick Start Guide

### Generating a New Map

1. Click the **AI Generation** button (✨ icon) in the toolbar
2. Choose your map type from the visual selector:

   - 🏠 **House/Building** - For interior locations like homes, taverns, shops
   - 🌳 **Forest/Wilderness** - For outdoor forest areas with clearings
   - ⛰️ **Cave/Underground** - For cave systems and underground areas
   - 🏙️ **Town/City** - For urban areas with streets and buildings
   - 🏰 **Dungeon** - For classic dungeon crawls with chambers

3. **Quick Generation** (Recommended for fast results):

   - Leave the description box empty
   - Click "Quick Generate"
   - A procedural map will be created instantly based on your selected type

4. **AI Generation** (For custom requirements):
   - Enter a description of what you want
   - Example: "A small tavern with a bar, fireplace, and 3 tables"
   - Click "Generate with AI"
   - Wait for the AI to process your request

### Adjusting Generation Settings

**Map Size:**

- Use the sliders to adjust width and height (10-50 cells)
- Default is 30x30 cells
- Larger maps = more rooms and complexity

**Complexity:**

- **Simple**: 3 rooms, smaller room sizes
- **Moderate**: 5 rooms, balanced sizes (default)
- **Complex**: 8 rooms, larger room sizes

**Include Objects:**

- Toggle ON to add furniture, decorations, creatures
- Toggle OFF for empty rooms (faster generation)

---

## Working with the Generated Map

### Understanding Layers

After generation, your map will have these layers:

1. **Background** - Base color/terrain
2. **Rooms** - The room shapes and walls
3. **Paths** - Corridors or trails connecting rooms
4. **Grid** - NEW! Resizable grid overlay
5. **Objects** - Furniture, decorations, creatures

### Grid Layer Features

The grid is now a special object you can manipulate:

**Toggling Grid Visibility:**

- Open the Layer Panel (layers icon in toolbar)
- Find the "Grid" layer
- Click the eye icon (👁️) to show/hide

**Selecting the Grid:**

- Click the Select tool
- Click on the grid lines
- You'll see a dashed blue border when selected

**Moving the Grid:**

- Select the grid
- Drag it to a new position
- Useful for aligning with specific features

**Resizing the Grid:**

- Select the grid
- Use the resize handles (if your canvas supports it)
- Or edit the grid object properties directly

**Grid Opacity:**

- Adjust the Grid layer opacity slider
- Range: 0% (invisible) to 100% (solid)
- Default: 30%

### Understanding Room Connections

Maps now have intelligent path connections:

**Rectangular Rooms (Houses, Dungeons, Towns):**

- Doors are placed in the center of walls
- Paths connect door-to-door
- Look for the openings when planning movement

**Organic Shapes (Forests, Caves):**

- Connection points at clearing/cavern centers
- Trails naturally flow between spaces

**Path Types by Map Type:**

- **House/Building**: 2-cell wide corridors
- **Forest**: 1-cell wide trails
- **Cave**: 2-4 cell wide passages (varied)
- **Town**: Street network overlay
- **Dungeon**: 2-cell wide corridors

---

## Map Type Details

### 🏠 House/Building

**Best For:** Homes, taverns, shops, inns, mansions

**Features:**

- Rectangular rooms with walls
- 1-2 doors per room on wall centers
- Room types: bedroom, kitchen, living_room, study, storage
- Objects: chairs, beds, tables, doors, candles

**Generation Tips:**

- Use moderate complexity for typical buildings
- High complexity for large estates
- Enable objects for furnished interiors

---

### 🌳 Forest/Wilderness

**Best For:** Outdoor encounters, camping sites, druid groves

**Features:**

- Circular organic clearings
- Natural trails between clearings
- Dense undergrowth surroundings
- Objects: trees, rocks, mushrooms, campsites

**Generation Tips:**

- Use simple complexity for small encounters
- Increase map size for larger wilderness areas
- Organic shapes create natural-looking terrain

---

### ⛰️ Cave/Underground

**Best For:** Cave systems, mines, underground lairs

**Features:**

- Irregular cavern shapes
- Varying passage widths
- Dark stone walls
- Objects: rocks, fire sources, water, treasure, bats

**Generation Tips:**

- Complex caves have more chambers
- Narrow passages create chokepoints
- Great for tactical encounters

---

### 🏙️ Town/City

**Best For:** Urban encounters, marketplaces, city districts

**Features:**

- Building plots with streets
- Full street network coverage
- 4+ cell spacing between buildings
- Objects: houses, shops, market stalls, NPCs

**Generation Tips:**

- Large map sizes recommended (40x40+)
- Complex setting creates dense urban areas
- Streets automatically fill unused space

---

### 🏰 Dungeon

**Best For:** Classic dungeon crawls, fortresses, ancient ruins

**Features:**

- Mix of rectangular chambers and organic caverns
- Corridor connections
- Room types: chamber, trap_room, treasure_room, guard_room
- Objects: pillars, braziers, treasure, creatures

**Generation Tips:**

- Most versatile map type
- Randomly inherits from cave or building style
- Best for traditional D&D adventures

---

## Advanced Tips

### Creating Multi-Level Maps

1. Generate a map for each level
2. Use the Workspace feature to organize them
3. Name maps clearly (e.g., "Tower - Level 1", "Tower - Level 2")
4. Mark stairway locations manually

### Customizing Generated Maps

After generation, you can:

- Move individual rooms (if unlocked)
- Add/remove objects
- Paint additional terrain
- Adjust colors and opacity
- Add text labels for room names

### Grid Best Practices

- Keep grid visible during play for movement tracking
- Hide grid for presentation/screenshots
- Use 1:1 cell size for standard 5ft D&D squares
- Create multiple grids for different scales

### Performance Tips

- Smaller maps (20x20) generate faster
- Disable objects if you only need layout
- Simple complexity runs quickest
- Use procedural generation over AI for speed

---

## Troubleshooting

**Problem**: Grid not visible after generation

- **Solution**: Check Grid layer visibility (eye icon)
- **Solution**: Increase Grid layer opacity

**Problem**: Paths don't connect to rooms

- **Solution**: This is fixed! Regenerate your map to use door connections

**Problem**: Too many/too few rooms

- **Solution**: Adjust complexity setting before generation

**Problem**: Generation takes too long

- **Solution**: Use Quick Generate instead of AI generation
- **Solution**: Reduce map size
- **Solution**: Choose Simple complexity

**Problem**: Can't select grid

- **Solution**: Ensure Select tool is active
- **Solution**: Grid layer must be unlocked
- **Solution**: Grid layer must be visible

---

## Keyboard Shortcuts

While using the AI Generation Dialog:

- **ESC** - Close dialog (when not generating)
- **ENTER** - Start generation (when dialog is focused)

In the main editor:

- **Ctrl+G** - Toggle grid visibility
- **Ctrl+L** - Open Layer Panel
- **V** - Select tool (for selecting grid)
- **H** - Pan tool (for moving viewport)

---

## Examples

### Example 1: Tavern Interior

```
Map Type: House/Building
Size: 25x20
Complexity: Moderate
Objects: Enabled
Description: (optional) "A cozy tavern with a bar counter and fireplace"
```

### Example 2: Forest Encounter

```
Map Type: Forest/Wilderness
Size: 30x30
Complexity: Simple
Objects: Enabled
Description: (leave empty for quick generation)
```

### Example 3: Dungeon Level

```
Map Type: Dungeon
Size: 40x40
Complexity: Complex
Objects: Enabled
Description: (optional) "An ancient crypt with trapped corridors"
```

---

## FAQ

**Q: Can I have multiple grids on one map?**
A: Yes! Add grid objects to different layers for different purposes.

**Q: How do I change grid line color?**
A: Select the grid object and edit its properties (line color stored in properties)

**Q: Why don't paths connect through walls?**
A: Paths now connect to door positions! Doors are placed in room wall centers.

**Q: Can I manually add doors?**
A: Not yet in the UI, but this is a planned feature.

**Q: Which map type should I use for a ship?**
A: Use House/Building for interior ship decks, or create a custom layout.

**Q: How do I save my generated map?**
A: Use the Save button in the toolbar (Ctrl+S)

---

## Support

For issues, feature requests, or questions:

- Check the Implementation Summary (IMPLEMENTATION_SUMMARY.md)
- Review the main README.md
- Open an issue in the project repository

---

**Happy Mapping! 🗺️**
