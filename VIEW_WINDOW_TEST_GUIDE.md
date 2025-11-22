# Quick View Window Test Guide

## What Was Fixed

✅ **Player View Window** can now be dragged and resized on DM page
✅ Works on both desktop (mouse) and mobile (touch)
✅ No interference with light/object placement

---

## Quick Desktop Test (1 minute)

### Test Dragging:

1. Open http://localhost:3000
2. Generate a map
3. Click "Start DM Session"
4. **Look for blue rectangle** labeled "Player View"
5. **Click and drag the blue rectangle**
6. ✅ **VERIFY:** Window moves smoothly as you drag
7. ✅ **VERIFY:** Cursor changes to "grab" when hovering
8. ✅ **VERIFY:** Cursor changes to "grabbing" while dragging

### Test Resizing:

1. **Look for blue circles at corners** of the window
2. **Click and drag a corner handle**
3. ✅ **VERIFY:** Window resizes diagonally
4. **Look for blue rectangular handles on edges**
5. **Click and drag an edge handle**
6. ✅ **VERIFY:** Window resizes in one direction
7. Try to resize smaller than minimum
8. ✅ **VERIFY:** Stops at minimum size (won't go smaller)

### Test with Light Placement:

1. Click "Start Placing Lights"
2. **Click inside the blue window**
3. ✅ **VERIFY:** Window still drags (doesn't place light)
4. **Click outside the blue window**
5. ✅ **VERIFY:** Light is placed (not dragging window)

---

## Quick Mobile Test (2 minutes)

### Test Mobile Dragging:

1. Open http://localhost:3000 on mobile device
2. Generate a map
3. Start DM session
4. **Touch and drag the blue rectangle with one finger**
5. ✅ **VERIFY:** Window moves smoothly
6. ✅ **VERIFY:** Page doesn't scroll while dragging
7. Lift finger
8. ✅ **VERIFY:** Dragging stops

### Test Mobile Resizing:

1. **Touch a corner handle**
2. **Drag to resize**
3. ✅ **VERIFY:** Window resizes
4. ⚠️ **NOTE:** Handles may be small on mobile (known limitation)

### Test with Zoom/Pan:

1. **Pinch to zoom** the DM map view
2. **Drag the player window**
3. ✅ **VERIFY:** Still works correctly
4. **Pan the DM map** (drag with finger)
5. **Drag the player window**
6. ✅ **VERIFY:** Still works correctly

---

## Visual Indicators

### What to Look For:

**Player View Window:**

- 🔵 Blue border (3px solid)
- 💧 Semi-transparent blue fill
- 🌟 Blue glow/shadow around edges
- 🏷️ Label at top: "Player View (400×300)"

**Resize Handles:**

- 🔵 **4 Corner Handles:** Round blue circles (12px)
- 🔵 **4 Edge Handles:** Rectangular blue bars (40px)
- ⚪ White borders on all handles
- 🎨 Turn darker blue on hover

**Cursors (Desktop Only):**

- Default: Arrow
- Hover window body: Grab hand (open)
- Dragging window: Grabbing hand (closed)
- Hover corner handle: Diagonal resize arrows
- Hover edge handle: Horizontal/vertical resize arrows

---

## Expected Behavior

### ✅ GOOD Signs:

- Window drags smoothly
- Window resizes from handles
- Handles visible and clickable
- No light placement when clicking window
- Light placement works outside window
- Works at any zoom level
- Works with map panned

### 🔴 BAD Signs:

- Can't drag window (clicks do nothing)
- Window jumps or stutters
- Can't click resize handles
- Light placement triggered when clicking window
- Window disappears when zooming/panning
- Handles not visible

---

## Troubleshooting

### Q: Can't drag the window?

**Check:**

- Is the window visible? (blue rectangle)
- Are you clicking the window body (not a handle)?
- Check browser console for errors

**Try:**

- Refresh the page
- Clear browser cache
- Check if light placement mode is interfering

### Q: Can't resize the window?

**Check:**

- Can you see the resize handles? (blue circles/rectangles)
- Are you clicking directly on a handle?
- Handles may be small on mobile

**Try:**

- Zoom in the browser to make handles larger
- Use desktop for easier resize testing
- Check console for errors

### Q: Window moves when placing lights?

**This is the bug that was fixed!**

- Should NOT happen anymore
- Clicking window should drag it, not place lights
- Clicking outside window should place lights

### Q: Window doesn't move correctly when DM view is zoomed?

**This is the coordinate bug that was fixed!**

- Should work correctly at any zoom level
- If still broken, check console logs
- Verify dmZoom is being passed correctly

---

## Console Debugging

Check browser console for these logs:

```
[ViewWindowOverlay] Rendering with: {viewWindow, mapWidth, mapHeight, cellSize, dmZoom, dmPanX, dmPanY}
[ViewWindowOverlay] Transform calculation: {viewWindow, dmTransform, result}
[DMPage] View window updated (canvas coords): {x, y, width, height}
```

**What to verify:**

- `dmZoom`, `dmPanX`, `dmPanY` should match DM view transform
- `transformedX`, `transformedY` should be calculated correctly
- No error messages about event handlers

---

## Success Criteria

All must pass:

- ✅ **Can drag window** with mouse/touch
- ✅ **Can resize window** with handles
- ✅ **No interference** with light placement
- ✅ **Works at any zoom** level
- ✅ **Works when map panned**
- ✅ **Smooth interaction** on both desktop and mobile

If all pass, fix is successful! 🎉

---

## What's Next?

After testing the view window, you can:

1. Test the full mobile panning (from previous fix)
2. Test continuous light placement (from earlier fix)
3. Continue with mobile responsive layout improvements

---

Last Updated: November 22, 2024
