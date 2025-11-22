# Mobile Responsive Testing Guide

## Quick Test Instructions

### Testing on Your Computer

#### 1. Chrome DevTools (Recommended)

1. Open the app in Chrome
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+M` (or click the device icon) to toggle device toolbar
4. Select a device from the dropdown:
   - **iPhone 12 Pro** - Mobile phone (390 x 844)
   - **iPad Air** - Tablet portrait (820 x 1180)
   - **iPad Pro** - Tablet landscape (1024 x 1366)
5. Test the responsive features!

#### 2. Firefox Responsive Design Mode

1. Press `Ctrl+Shift+M` to open Responsive Design Mode
2. Choose preset devices or custom dimensions
3. Test touch interactions

#### 3. Manual Browser Resize

1. Simply resize your browser window
2. Watch the layout change at 1200px (md breakpoint)

### What to Look For

#### Desktop Mode (Width >= 1200px)

- ✅ Control panel visible on right side (400px wide)
- ✅ Map fills left side
- ❌ NO floating action button (FAB) should be visible

#### Mobile Mode (Width < 1200px)

- ✅ Map fills entire screen
- ✅ Blue floating action button in bottom-right corner
- ✅ Click FAB → drawer slides up from bottom
- ✅ Drawer has rounded top corners
- ✅ Close (X) button in drawer header works
- ✅ Can still interact with map when drawer is closed
- ✅ All 4 tabs accessible: Lighting, Objects, Sprites, Sync

### Test Scenarios

#### Scenario 1: DM Places a Light Source (Mobile)

1. Resize browser to 800px wide
2. Click FAB button (blue circle, bottom-right)
3. Select "Lighting" tab
4. Choose light type (Torch, Lantern, etc.)
5. Click "Add Light Source"
6. Close drawer (X button)
7. Click on map to place light
8. ✅ Light should appear on map

#### Scenario 2: DM Manages Objects (Mobile)

1. Open drawer (FAB button)
2. Switch to "Objects" tab
3. Toggle object visibility
4. ✅ Changes should reflect on map

#### Scenario 3: DM Views Session Info (Mobile)

1. Open drawer
2. Switch to "Sync" tab
3. View session ID and stats
4. ✅ All information readable and formatted correctly

#### Scenario 4: Switch Between Desktop and Mobile

1. Start at desktop size (1400px wide)
2. ✅ Control panel visible on right
3. Slowly resize browser smaller
4. Watch at 1200px width:
   - ✅ Control panel should disappear
   - ✅ FAB button should appear
   - ✅ Map should expand to full width
5. Resize back larger
6. ✅ Should smoothly transition back to desktop layout

### Browser Compatibility

#### Fully Supported

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

#### Mobile Browsers

- ✅ iOS Safari 14+
- ✅ Chrome Mobile
- ✅ Firefox Mobile
- ✅ Samsung Internet

### Real Device Testing (Optional)

#### iPhone/iPad

1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Run app: `npm start` (usually on port 3000)
3. On iOS device, go to: `http://[YOUR_IP]:3000`
4. Test all interactions with touch

#### Android

1. Same steps as iPhone
2. Make sure device is on same WiFi network

### Common Issues & Solutions

#### Issue: FAB button not appearing on mobile

**Solution:** Check browser width is actually < 1200px in DevTools

#### Issue: Drawer not opening

**Solution:** Check console for errors, ensure React is running without errors

#### Issue: Content cut off in drawer

**Solution:** This is expected - content should scroll within the drawer

#### Issue: Can't close drawer

**Solution:** Click the X button in top-right of drawer header, or click outside drawer

#### Issue: Tabs not switching

**Solution:** Ensure `tabValue` state is updating (check React DevTools)

### Performance Testing

#### Check These Metrics

1. **Drawer Animation:** Should be smooth (60fps)
2. **Map Rendering:** Should not lag when drawer opens/closes
3. **Touch Response:** FAB should respond immediately to tap
4. **Memory:** Check no memory leaks when opening/closing drawer repeatedly

### Accessibility Testing

#### Keyboard Navigation

1. Tab through elements
2. ✅ FAB button should be focusable
3. ✅ Can close drawer with Escape key (if implemented)
4. ✅ Tab controls should be keyboard accessible

#### Screen Reader Testing

1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. ✅ FAB should announce "Open controls"
3. ✅ Drawer close button should announce "Close controls"
4. ✅ Tab labels should be clear

### Screenshots to Take

1. Desktop view (1400px) - control panel visible
2. Tablet view (900px) - FAB button + closed drawer
3. Mobile view (375px) - FAB button
4. Drawer open (any size < 1200px)
5. Each tab content

### Bug Report Template

```markdown
## Bug Report

**Device:** [Desktop / Mobile / Tablet]
**Browser:** [Chrome 120 / Safari 17 / etc.]
**Screen Size:** [Width x Height]
**Issue:** [Description]

### Steps to Reproduce

1.
2.
3.

### Expected Behavior

...

### Actual Behavior

...

### Screenshots

[Attach if applicable]
```

### Success Criteria

✅ All tests passed = **Mobile responsive implementation successful!**

- [ ] Desktop layout works >= 1200px
- [ ] Mobile layout works < 1200px
- [ ] FAB button visible and functional on mobile
- [ ] Drawer opens/closes smoothly
- [ ] All tabs accessible in both modes
- [ ] No layout breaks at any screen size
- [ ] Touch interactions work on real devices
- [ ] No console errors
- [ ] Performance is acceptable

---

**Happy Testing!** 🎉

If you find any issues, refer to `MOBILE_IMPLEMENTATION_SUMMARY.md` for implementation details.
