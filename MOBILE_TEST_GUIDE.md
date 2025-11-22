# Quick Mobile Pan & Coordinate Fix Test Guide

## What Was Fixed

1. ✅ **Coordinate Translation Bug** - Lights now place correctly when zoomed in/out
2. ✅ **Mobile Panning** - Can now drag map with finger on mobile
3. ✅ **Pinch to Zoom** - Two-finger pinch gesture for zoom on mobile

---

## Quick Desktop Test (2 minutes)

### Test Coordinate Fix:

1. Open http://localhost:3000
2. Generate a forest map
3. Zoom OUT using scroll wheel (make map smaller)
4. Click "Start Placing Lights"
5. **Click anywhere on the map**
6. ✅ **VERIFY:** Light appears exactly where you clicked (not offset to top-left)
7. Zoom IN, place another light
8. ✅ **VERIFY:** Light still appears exactly where you clicked
9. Press Ctrl and drag map to pan it
10. Place another light
11. ✅ **VERIFY:** Light appears at click location (not affected by pan)

### Expected Results:

- Before: Lights would appear in wrong location when zoomed/panned
- After: Lights appear exactly where you click, regardless of zoom/pan level ✅

---

## Quick Mobile Test (3 minutes)

### Test Mobile Panning:

1. Open http://localhost:3000 on mobile device
2. Generate a forest map
3. **Drag with one finger anywhere on map**
4. ✅ **VERIFY:** Map moves smoothly as you drag
5. **No page scrolling happens** ✅

### Test Pinch Zoom:

1. Place two fingers on map
2. **Pinch fingers apart** (spread)
3. ✅ **VERIFY:** Map zooms IN
4. **Pinch fingers together**
5. ✅ **VERIFY:** Map zooms OUT

### Test Mobile Light Placement:

1. Tap "Start Placing Lights" button (in drawer)
2. **Zoom OUT** using pinch gesture
3. **Tap on map to place light**
4. ✅ **VERIFY:** Light appears exactly where you tapped
5. **Zoom IN** using pinch gesture
6. **Tap on map to place another light**
7. ✅ **VERIFY:** Light appears exactly where you tapped
8. **Pan the map** by dragging
9. **Tap to place another light**
10. ✅ **VERIFY:** Light appears at tap location

### Expected Mobile Results:

- ✅ Can pan map by dragging with finger
- ✅ Can zoom with two-finger pinch
- ✅ Lights place at correct coordinates regardless of zoom/pan
- ✅ No browser zoom interference
- ✅ No accidental page scrolling

---

## What to Look For

### 🟢 GOOD Signs:

- Lights appear exactly where clicked/tapped
- Map pans smoothly on mobile
- Pinch zoom works intuitively
- No page scrolling when touching map
- Cursor changes appropriately (desktop)

### 🔴 BAD Signs:

- Lights offset from click location when zoomed
- Can't drag map on mobile
- Page scrolls when trying to pan
- Pinch zoom doesn't work
- Map jumps or stutters during pan

---

## Quick Fix Verification

Run these 3 quick tests:

### 1. Zoom Out Test (10 seconds)

```
1. Zoom out to 0.5x
2. Click "Start Placing Lights"
3. Click center of map
Result: Light at center ✅
```

### 2. Pan Test (10 seconds)

```
1. Ctrl+Drag map to corner
2. Click "Start Placing Lights"
3. Click visible area
Result: Light where clicked ✅
```

### 3. Mobile Pan Test (15 seconds - mobile only)

```
1. Drag map with finger
2. Map moves ✅
3. Page doesn't scroll ✅
```

---

## Troubleshooting

### Desktop Issues:

**Q: Lights still offset when zoomed?**

- Check browser console for errors
- Verify zoom level in console logs
- Clear browser cache and refresh

**Q: Can't pan with Ctrl+Drag?**

- Make sure you're holding Ctrl key
- Try refreshing the page
- Check console for errors

### Mobile Issues:

**Q: Can't pan on mobile?**

- Verify you're testing on actual mobile device (not Chrome DevTools mobile mode)
- Check if `touchAction: 'none'` is applied
- Look for JavaScript errors in mobile console

**Q: Page scrolls instead of map panning?**

- This means `touchAction: 'none'` not working
- Try in different mobile browser
- Check if CSS override is present

**Q: Pinch zoom doesn't work?**

- Make sure using two fingers
- Try refreshing page
- Check browser console for errors

**Q: Lights still offset on mobile?**

- Same fix as desktop should work
- Check console logs for coordinate calculations
- Verify touch coordinates are being calculated

---

## Console Debugging

If issues occur, check browser console for these logs:

```
[MapCanvas] Click coords: {clientX: 500, clientY: 300, rectLeft: 0, rectTop: 0, panX: 100, panY: 50, zoom: 1.5, x: 266.67, y: 166.67, gridX: 66, gridY: 41, cellSize: 4}
```

**What to verify:**

- `panX`, `panY` should match current pan offset
- `zoom` should match current zoom level
- `x`, `y` should be calculated correctly: `(clientX - rectLeft - panX) / zoom`
- `gridX`, `gridY` should be `floor(x / cellSize)`, `floor(y / cellSize)`

---

## Success Criteria

All three must pass:

- ✅ **Coordinate Accuracy:** Lights place exactly where clicked at any zoom/pan level
- ✅ **Mobile Pan:** Can drag map smoothly with one finger on mobile
- ✅ **Mobile Zoom:** Can pinch to zoom in/out on mobile

If all three pass, fix is successful! 🎉

---

Last Updated: November 22, 2024
