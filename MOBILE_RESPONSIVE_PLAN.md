# Mobile Responsive Implementation Plan

## Goal

Make the D&D Map Builder interface mobile-friendly for both the builder, DM, and player views.

## Completed Changes

### 1. Mobile Viewport Meta Tags ✅

**File:** `public/index.html`

Added proper mobile meta tags:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
/>
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>
```

## Pending Changes

### 2. DM Page Mobile Responsive Design

**File:** `src/pages/DMPage.tsx`

**Strategy:**

- **Desktop (>= md breakpoint):** Fixed 400px right panel with tabs
- **Mobile (< md breakpoint):** Bottom drawer that slides up, with FAB button to toggle

**Implementation:**

```typescript
// Add imports
import { Drawer, useMediaQuery, useTheme, Fab } from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";

// Inside component
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down("md"));
const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

// Extract control panel content into reusable function
const renderControlPanelContent = () => (
  <>
    <TabPanel value={tabValue} index={0}>
      {/* Lighting controls */}
    </TabPanel>
    <TabPanel value={tabValue} index={1}>
      {/* Object management */}
    </TabPanel>
    {/* ... other tabs */}
  </>
);

// In JSX return:
{
  isMobile ? (
    <>
      <Fab
        color="primary"
        onClick={() => setMobileDrawerOpen(true)}
        sx={{ position: "fixed", bottom: 16, right: 16 }}
      >
        <MenuIcon />
      </Fab>
      <Drawer
        anchor="bottom"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      >
        {renderControlPanelContent()}
      </Drawer>
    </>
  ) : (
    <Paper sx={{ width: 400 }}>{renderControlPanelContent()}</Paper>
  );
}
```

**Benefits:**

- Mobile users get full screen for map viewing
- Controls accessible via FAB button
- Bottom drawer is thumb-friendly
- Same functionality as desktop

### 3. Player Page Mobile Optimization

**File:** `src/pages/PlayerPage.tsx`

**Changes Needed:**

- Remove connection status chip or move to top-right corner
- Ensure map fills entire viewport on mobile
- Add touch gesture support for examining the map (optional zoom/pan)
- Optimize fog/light rendering for mobile performance

**Implementation:**

```typescript
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

// Adjust connection status position
<Chip
  sx={{
    position: "absolute",
    top: isMobile ? 8 : 16,
    right: isMobile ? 8 : 16,
    left: isMobile ? "auto" : 16,
    zIndex: 1000,
  }}
  size={isMobile ? "small" : "medium"}
  label={connected ? "Connected" : "Disconnected"}
  color={connected ? "success" : "error"}
/>;
```

### 4. Main Builder (App.tsx) Mobile Responsive

**File:** `src/App.tsx`

**Changes Needed:**

- Drawer width: 400px → 90vw on mobile
- Top menu bar: Stack buttons vertically on mobile
- Convert toolbar to bottom navigation on mobile
- Make palette scrollable on mobile

**Implementation:**

```typescript
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

<Drawer
  anchor="left"
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  variant={isMobile ? 'temporary' : 'persistent'}
  PaperProps={{
    sx: {
      width: isMobile ? '90vw' : '400px',
      maxWidth: isMobile ? '90vw' : '400px'
    }
  }}
>
```

### 5. Touch Gestures for Map Navigation

**New Utility:** `src/utils/touchGestures.ts`

**Implementation:**

```typescript
export const useTouchGestures = (
  onPinchZoom: (scale: number) => void,
  onPan: (deltaX: number, deltaY: number) => void
) => {
  // Implement pinch-to-zoom
  // Implement two-finger pan
  // Return touch event handlers
};
```

**Usage in MapCanvas:**

```typescript
const { touchStart, touchMove, touchEnd } = useTouchGestures(
  handleZoomChange,
  handlePan
);

<canvas
  onTouchStart={touchStart}
  onTouchMove={touchMove}
  onTouchEnd={touchEnd}
  // ... other props
/>;
```

## Material-UI Breakpoints Reference

```typescript
theme.breakpoints.down("xs"); // 0px - 599px (phones)
theme.breakpoints.down("sm"); // 0px - 899px (tablets portrait)
theme.breakpoints.down("md"); // 0px - 1199px (tablets landscape)
theme.breakpoints.down("lg"); // 0px - 1535px (desktop)
theme.breakpoints.down("xl"); // 0px+ (large desktop)
```

## Testing Checklist

### Desktop (>= 1200px)

- [ ] Control panel stays fixed at 400px width
- [ ] All tabs accessible and functional
- [ ] Map canvas fills remaining space
- [ ] Drag/resize view window works

### Tablet Landscape (900px - 1199px)

- [ ] Controls switch to bottom drawer
- [ ] FAB button visible in bottom-right
- [ ] Map fills full width
- [ ] Drawer slides up smoothly

### Tablet Portrait (600px - 899px)

- [ ] Same as tablet landscape
- [ ] Controls optimized for vertical layout
- [ ] Text remains readable

### Mobile (< 600px)

- [ ] All controls accessible via drawer
- [ ] FAB button thumb-friendly
- [ ] Map fills entire screen
- [ ] Touch gestures work (if implemented)
- [ ] No horizontal scrolling
- [ ] Buttons large enough to tap

## Performance Considerations

1. **Conditional Rendering:** Use `useMediaQuery` with `noSsr` option to avoid hydration mismatch
2. **Touch Event Passive:** Add `{ passive: false }` to prevent scroll lag on touch
3. **Canvas Size:** Consider lowering resolution on mobile for better performance
4. **Debounce:** Debounce window resize events to avoid excessive re-renders

## Future Enhancements

1. **PWA Support:** Add service worker for offline capability
2. **Responsive Images:** Load lower-res sprites on mobile
3. **Gesture Library:** Consider using `react-use-gesture` for advanced touch support
4. **Mobile-Specific Features:**
   - Swipe to switch tabs
   - Long-press for context menus
   - Shake to undo/redo

## Next Steps

1. Fix the DMPage.tsx file (currently has syntax errors from partial edit)
2. Test the mobile viewport meta tags
3. Implement mobile drawer for DM controls
4. Optimize Player page for mobile
5. Add touch gesture support
6. Test on real devices (iOS Safari, Android Chrome)
