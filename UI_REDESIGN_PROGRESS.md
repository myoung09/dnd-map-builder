# Modern Material-UI Drawer Redesign

## Status: IN PROGRESS

### Goal

Transform the DnD Map Builder from a fixed left-panel design to a modern Material-UI drawer-based interface following Material Design guidelines.

### Components Status

#### ✅ Completed

1. **ControlDrawer** (`components/ControlDrawer.tsx`) - 249 lines

   - Material-UI Drawer component with 360px width
   - Integrated all existing controls: TerrainSelector, PresetSelector, ParameterForm
   - Modern Paper-based sections with proper spacing
   - Seed control with random button
   - Display options with Material-UI Checkboxes
   - Cell size slider with marks
   - Map info section
   - Generate button at bottom
   - Scrollable content area

2. **TopMenuBar** (`components/TopMenuBar.tsx`) - Updated
   - Added hamburger menu icon (MenuIcon) and `onOpenDrawer` prop
   - Map icon next to title
   - Cleaner button spacing with Dividers
   - Removed status text for cleaner look
   - Full-height Toolbar (not dense)

#### ⚠️ In Progress

3. **App.tsx** - Needs Complete Restructure
   - Current state: Partially modified, build failing
   - Backup created: `App.tsx.backup`
   - Need to:
     - Add ThemeProvider with darkTheme
     - Add CssBaseline for consistent baseline styles
     - Add drawer state: `const [drawerOpen, setDrawerOpen] = useState(false)`
     - Add generating state: `const [isGenerating, setIsGenerating] = useState(false)`
     - Update imports to remove TerrainSelector, PresetSelector, ParameterForm (now in drawer)
     - Add ControlDrawer import
     - Completely replace return statement with new structure

### New App Structure

```tsx
<ThemeProvider theme={darkTheme}>
  <CssBaseline />
  <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
    {/* Top Menu Bar */}
    <TopMenuBar
      onOpenDrawer={() => setDrawerOpen(true)}
      placementMode={placementMode}
      onPlacementModeChange={setPlacementMode}
      showGrid={showGrid}
      onToggleGrid={() => setShowGrid(!showGrid)}
      showObjectLayer={showObjectLayer}
      onToggleObjectLayer={() => setShowObjectLayer(!showObjectLayer)}
      showPalette={showPalette}
      onTogglePalette={handleTogglePalette}
      onExport={handleExportPNG}
      disabled={!mapData}
    />

    {/* Control Drawer (slides from left) */}
    <ControlDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      terrain={terrain}
      onTerrainChange={handleTerrainChange}
      parameters={parameters}
      onParameterChange={setParameters}
      onPresetLoad={handlePresetLoad}
      onGenerate={generateMap}
      onRandomSeed={handleRandomSeed}
      showGrid={showGrid}
      onToggleGrid={() => setShowGrid(!showGrid)}
      showRooms={showRooms}
      onToggleRooms={() => setShowRooms(!showRooms)}
      showCorridors={showCorridors}
      onToggleCorridors={() => setShowCorridors(!showCorridors)}
      showTrees={showTrees}
      onToggleTrees={() => setShowTrees(!showTrees)}
      cellSize={cellSize}
      onCellSizeChange={setCellSize}
      mapData={mapData}
      isGenerating={isGenerating}
    />

    {/* Main Canvas Area */}
    <Box
      sx={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <MapCanvas
          ref={canvasRef}
          mapData={mapData}
          cellSize={cellSize}
          showGrid={showGrid}
          showRooms={showRooms}
          showCorridors={showCorridors}
          showTrees={showTrees}
          showObjects={showObjectLayer}
          placedObjects={placedObjects}
          spritesheets={spritesheets}
          placementMode={placementMode}
          selectedSpriteId={selectedSpriteId}
          onObjectPlace={handleObjectPlace}
          onObjectClick={handleObjectDelete}
        />
      </Box>
    </Box>

    {/* Object Palette (floating, right side) */}
    <ObjectPalette
      spritesheets={spritesheets}
      terrainType={mapData?.terrainType || TerrainType.Forest}
      selectedSpriteId={selectedSpriteId}
      onSpriteSelect={setSelectedSpriteId}
      onClose={() => setShowPalette(false)}
      visible={showPalette}
    />
  </Box>
</ThemeProvider>
```

### Design Changes

#### Before

- Fixed left control panel (320px wide)
- Always visible, takes up space
- Header with gradient background
- Custom CSS styling
- Light text on dark background
- Manual checkbox/slider HTML

#### After

- Collapsible drawer (360px wide)
- Slides in from left when hamburger clicked
- No permanent header taking vertical space
- Material-UI components throughout
- Consistent Material Design dark theme
- Material-UI Checkbox, Slider, TextField components
- More screen real estate for map canvas
- Professional, modern appearance

### Theme Configuration

```typescript
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3498db", // Blue accent
    },
    secondary: {
      main: "#2ecc71", // Green accent
    },
    background: {
      default: "#1a1a1a", // Main dark background
      paper: "#252525", // Slightly lighter for cards
    },
  },
});
```

### Benefits

1. **More Canvas Space**: Full width available for map viewing
2. **Modern UI**: Material Design guidelines throughout
3. **Mobile-Friendly**: Drawer can overlay on small screens
4. **Cleaner**: No permanent clutter, controls hidden when not needed
5. **Consistent**: All Material-UI components with same theme
6. **Professional**: Matches industry-standard UI patterns

### Next Steps

1. ✅ Create ControlDrawer component
2. ✅ Update TopMenuBar with hamburger menu
3. ⏳ Fix App.tsx structure (CURRENT TASK)
   - Revert to clean state
   - Add theme setup
   - Add drawer state
   - Replace entire return statement
   - Remove old App-header and app-container divs
4. Test functionality
5. Fine-tune spacing and colors
6. Update documentation

### Files Modified

- `src/components/ControlDrawer.tsx` (NEW)
- `src/components/TopMenuBar.tsx` (UPDATED)
- `src/App.tsx` (IN PROGRESS)

### Potential Issues

- App.tsx currently in broken state - needs complete restructure of return statement
- Need to ensure all event handlers (handleTerrainChange, handleRandomSeed, etc.) exist
- May need to adjust cellSize slider min/max to match original (2-10 vs 4-20)
- ObjectPalette positioning may need adjustment with new layout

### Testing Checklist

Once implemented:

- [ ] Hamburger menu opens drawer
- [ ] Drawer closes on backdrop click or X button
- [ ] Generate Map button works
- [ ] All parameter controls function
- [ ] Display options toggle correctly
- [ ] Object placement still works
- [ ] Export functions still work
- [ ] Responsive on different screen sizes
