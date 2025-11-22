# View Window - Quick Start Guide

## For Dungeon Masters

### What You'll See

When you open the DM view after generating a map, you'll see a blue rectangle overlay on your map. This is the **View Window** - it controls exactly what your players can see.

### Moving the View Window

1. **Click and drag** anywhere inside the blue rectangle
2. The window will follow your mouse
3. The window cannot go outside the map boundaries
4. Players see exactly what's inside this window

### Resizing the View Window

The blue rectangle has **8 handles**:

- **4 corner handles** (circles): Resize diagonally
- **4 edge handles** (rectangles): Resize in one direction

To resize:

1. **Hover over a handle** - it will grow slightly
2. **Click and drag** the handle
3. The window will resize as you drag
4. The window cannot shrink below 800×600 pixels

### Handle Locations

```
    [N]
[NW]   [NE]
 [W]   [E]
[SW]   [SE]
    [S]
```

### Best Practices

#### Starting a Session

- Position the view window at the party's starting location
- Size it appropriately for the scene:
  - **Small** (800×600): Tight corridors, small rooms
  - **Medium** (1200×900): Normal combat encounters
  - **Large** (1600×1200+): Open areas, travel scenes

#### During Exploration

- **Drag the window** as the party moves
- Keep the window centered on the party's location
- Gradually reveal new areas as they explore

#### During Combat

- **Shrink the window** to focus on the battle area
- This zooms players in for better tactical view
- Move the window if combat spreads to new areas

#### Chase Sequences

- Smoothly drag the window to follow the action
- Keep both pursuers and pursued in view
- Creates cinematic, dynamic feel

#### Revealing Big Moments

- **Expand the window** when revealing:
  - Large throne rooms
  - Dragon lairs
  - Vast caverns
  - Spectacular vistas
- Let players appreciate the scale

### Tips

- The blue label shows current dimensions
- Changes update players **instantly**
- Players cannot control their own view
- Use fog of war for additional visibility control

## For Players

### What You'll See

Your view is **completely controlled by the DM**. You'll automatically:

- Pan to the area the DM wants you to see
- Zoom in/out based on the view window size
- Have the view centered in your screen

### What You Can Do

- View the map within your viewport
- See objects and terrain revealed by the DM
- Watch as your view moves during exploration
- **Cannot** pan or zoom independently

### Understanding the View

- **Zoomed In** = Small view window (close-up detail)
- **Zoomed Out** = Large view window (wide overview)
- **Panning** = DM is moving the view window
- View is always centered on your screen

## Technical Info

### Default Settings

- **Initial Size**: 800×600 pixels
- **Minimum Size**: 800×600 pixels (cannot be smaller)
- **Initial Position**: Top-left corner (0, 0)
- **Color**: Blue (#3498db)

### How It Works

1. DM adjusts view window on their map
2. Change sent via WebSocket to all players
3. Player view automatically adjusts pan and zoom
4. All players see the same viewport in real-time

### Performance

- Updates are instantaneous
- No lag with proper network connection
- Smooth dragging and resizing
- Efficient rendering

## Keyboard Shortcuts (Future)

_Not yet implemented - coming soon:_

- `Ctrl + Arrow Keys` - Pan view window
- `Ctrl + +/-` - Resize view window
- `Ctrl + R` - Reset to default position/size
- `Ctrl + F` - Fit view window to map

## Troubleshooting

### "View window is stuck"

- Try clicking directly on the blue rectangle (not handles)
- Ensure your mouse button is pressed while dragging

### "Can't resize smaller"

- The view window has a minimum size (800×600)
- This prevents accidentally hiding all content from players

### "Players aren't seeing my changes"

- Check WebSocket connection (chip in top-right)
- Ask players to refresh if connection dropped
- Verify you're in the DM view, not map builder

### "View window is outside map"

- This shouldn't happen - it's constrained to map bounds
- Try resetting the view window
- Regenerate the map if issue persists

## Examples

### Example 1: Dungeon Exploration

```
1. Start: View window at entrance (800×600)
2. Party enters: Drag window into first room
3. Combat starts: Shrink to 800×600, focus on room
4. After combat: Expand to 1200×900, show adjacent rooms
5. Party proceeds: Drag window following their path
```

### Example 2: Wilderness Travel

```
1. Start: Large window (1600×1200) showing region
2. Approaching destination: Gradually shrink window
3. Arrive at cave: Small window (800×600) at entrance
4. Enter cave: Drag window inward with party
```

### Example 3: Boss Fight

```
1. Approaching: Medium window (1200×900) showing corridor
2. Enter lair: Expand to 1800×1400 - reveal boss dramatically
3. Combat begins: Shrink to 1200×900 - tactical focus
4. Boss flees: Drag window following boss movement
5. Final stand: Small window (800×600) - intense close-up
```

## Advanced Techniques

### Creating Suspense

- Keep view window small
- Move slowly toward hidden threat
- Suddenly expand when revealing danger

### Cinematic Moments

- Start with tiny window
- Smoothly expand as dramatic reveal
- Pan slowly for emotional impact

### Split Party

- Alternate view window between groups
- Show one group's perspective at a time
- Creates dramatic irony

### Fog of War + View Window

- Combine both for maximum control
- View window = "camera position"
- Fog of war = "what's visible within camera"

## FAQ

**Q: Do all players see the same view?**  
A: Yes, all players share the same view window.

**Q: Can players zoom in on details?**  
A: No, only the DM controls zoom via view window size.

**Q: What happens if player joins late?**  
A: They automatically receive the current view window position.

**Q: Can I have multiple view windows?**  
A: Not currently - feature planned for future update.

**Q: Does this work with fog of war?**  
A: Yes! They work together - view window sets viewport, fog of war controls visibility within it.

**Q: What if my map is huge?**  
A: The view window scales to any map size. Maximum size is your map dimensions.

**Q: Can I disable the view window?**  
A: Currently no - it's always active. You can make it very large to show entire map.

## Summary

The View Window gives you cinematic control over your players' perspective, creating a dynamic, engaging experience that adapts to every moment of your adventure. Experiment with different sizes and positions to find what works best for your game!
