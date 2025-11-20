# Fog of War Masking Fix

## Problem

The fog of war was not revealing the map underneath the light sources. Instead, it was showing:

- Complete black screen with white/colored circles
- Light "holes" were just drawn on top of the fog
- Map remained hidden even where lights were placed

## Root Cause

The previous implementation used:

```tsx
<Box sx={{ backgroundColor: "rgba(0, 0, 0, 1)" }}>
  {lights.map((light) => (
    <Box
      sx={{
        background: "radial-gradient(...)",
        mixBlendMode: "screen",
      }}
    />
  ))}
</Box>
```

**Issue:** `mixBlendMode: 'screen'` only lightens the black background but doesn't create actual transparency to reveal the map underneath.

## Solution: SVG Mask

Used SVG `<mask>` element to create actual transparent holes in the fog layer.

### How SVG Masks Work

1. **White areas** in the mask = **Opaque** (fog visible)
2. **Black areas** in the mask = **Transparent** (map visible)
3. **Gray areas** in the mask = **Semi-transparent** (partial visibility)

### Implementation

```tsx
<svg>
  <defs>
    {/* Create gradient for each light */}
    {lights.map((light) => (
      <radialGradient id={`lightGradient-${light.id}`}>
        <stop offset="0%" stopColor="black" /> {/* Center: fully visible */}
        <stop offset="70%" stopColor="black" /> {/* Mid: mostly visible */}
        <stop offset="100%" stopColor="white" /> {/* Edge: fog returns */}
      </radialGradient>
    ))}

    {/* Mask definition */}
    <mask id="fogMask">
      {/* Start with white = everything is fogged */}
      <rect width="100%" height="100%" fill="white" />

      {/* Black circles = reveal map */}
      {lights.map((light) => (
        <circle
          cx={light.x}
          cy={light.y}
          r={light.radius}
          fill={`url(#lightGradient-${light.id})`}
        />
      ))}
    </mask>
  </defs>
</svg>;

{
  /* Apply mask to black fog layer */
}
<Box
  sx={{
    backgroundColor: "rgba(0, 0, 0, 1)",
    mask: "url(#fogMask)",
    WebkitMask: "url(#fogMask)", // Safari support
  }}
/>;
```

## Visual Explanation

### Before (Incorrect)

```
Layer Stack:
┌─────────────────────┐
│   White circles     │ ← screen blend mode (doesn't reveal)
│   (not real holes)  │
├─────────────────────┤
│   Solid black fog   │ ← blocks everything
├─────────────────────┤
│   Map canvas        │ ← hidden underneath
└─────────────────────┘
```

### After (Correct)

```
Layer Stack:
┌─────────────────────┐
│ Colored glow effect │ ← atmospheric lighting
├─────────────────────┤
│ Black fog with      │ ← SVG mask creates real holes
│ transparent holes   │
├─────────────────────┤
│   Map canvas        │ ← visible through holes!
└─────────────────────┘
```

## Gradient Falloff

The radial gradient in the mask creates smooth transitions:

```
Center (0%):  ████████  100% visible (black in mask)
         ↓
Middle (70%): ██████▓▓  70% visible (dark gray)
         ↓
Edge (100%):  ▓▓▓▓░░░░  0% visible (white in mask = fog)
```

### Code Breakdown

```tsx
<radialGradient id="lightGradient-123">
  {/* Center of light - fully visible */}
  <stop offset="0%" stopColor="black" stopOpacity="1" />

  {/* 70% of radius - partially visible */}
  <stop offset="70%" stopColor="black" stopOpacity="0.7" />

  {/* Edge - back to fog */}
  <stop offset="100%" stopColor="white" stopOpacity="0" />
</radialGradient>
```

## Atmospheric Glow Layer

Added optional colored glow for realism:

```tsx
{
  lights.map((light) => (
    <Box
      key={`glow-${light.id}`}
      sx={{
        position: "absolute",
        left: `${light.x}px`,
        top: `${light.y}px`,
        width: `${light.radius * 2.2}px`,
        height: `${light.radius * 2.2}px`,
        transform: "translate(-50%, -50%)",
        background: `radial-gradient(circle, 
        ${light.color}33 0%,      // 20% opacity at center
        ${light.color}22 40%,     // 13% opacity mid
        transparent 70%           // fade to nothing
      )`,
        filter: `blur(${light.radius * 0.2}px)`,
      }}
    />
  ));
}
```

**Purpose:**

- Adds warm/cool tones based on light type
- Creates atmospheric lighting feel
- Doesn't block the map (semi-transparent)
- Enhances immersion

## Light Type Color Examples

| Type    | Color        | Hex     | Effect              |
| ------- | ------------ | ------- | ------------------- |
| Torch   | Warm Orange  | #FFA500 | Cozy firelight      |
| Lantern | Bright Gold  | #FFD700 | Steady illumination |
| Spell   | Magical Blue | #00BFFF | Arcane glow         |
| Ambient | Soft White   | #FFFFFF | Moonlight/daylight  |

## Browser Compatibility

### CSS Mask Support

```tsx
sx={{
  mask: 'url(#fogMask)',           // Standard
  WebkitMask: 'url(#fogMask)',     // Safari/WebKit
}}
```

**Supported:**

- ✅ Chrome 53+
- ✅ Firefox 53+
- ✅ Safari 15.4+
- ✅ Edge 79+

**Not Supported:**

- ❌ IE 11 (use fallback)

### Fallback for Old Browsers

```tsx
{
  lighting.fogOfWarEnabled && (
    <>
      {/* Modern browsers: SVG mask */}
      {supportsMask && <FogWithMask />}

      {/* Old browsers: Simple overlay */}
      {!supportsMask && <SimpleFogOverlay />}
    </>
  );
}
```

## Performance Considerations

### SVG Mask Performance

**Pros:**

- Hardware accelerated in modern browsers
- Efficient for circular shapes
- Good performance up to 20-30 lights

**Cons:**

- Re-renders entire mask when lights change
- Can be slower than canvas-based approaches for many lights

### Optimization Tips

1. **Limit Light Count**

   ```tsx
   // Warn if too many lights
   if (lights.length > 20) {
     console.warn("Too many lights may impact performance");
   }
   ```

2. **Memoize Mask SVG**

   ```tsx
   const maskSVG = useMemo(() => <svg>...</svg>, [lighting.lightSources]);
   ```

3. **Debounce Updates**
   ```tsx
   const debouncedLights = useDebounce(lighting.lightSources, 100);
   ```

## Testing

### Visual Test Cases

1. **No Lights**

   - Expected: Complete black screen
   - Map should be invisible

2. **Single Torch (100px)**

   - Expected: Small circular area revealed
   - Map visible in circle
   - Smooth gradient to black at edges

3. **Multiple Lights**

   - Expected: Multiple revealed areas
   - Overlapping lights merge smoothly
   - Map visible in all lit areas

4. **Large Ambient Light (300px)**

   - Expected: Large area revealed
   - Wide visibility zone
   - Gradual fade to fog

5. **Light Colors**
   - Expected: Warm orange tint for torch
   - Bright gold for lantern
   - Blue glow for spell
   - Neutral for ambient

### Console Verification

```javascript
// Check if mask is applied
const fogLayer = document.querySelector('[style*="mask"]');
console.log("Fog layer:", fogLayer);
console.log("Mask applied:", getComputedStyle(fogLayer).mask);

// Check light count
console.log("Lights:", lighting.lightSources.length);
```

## Troubleshooting

### Map Still Not Visible

**Check:**

1. Is fog enabled? `lighting.fogOfWarEnabled === true`
2. Are there lights? `lighting.lightSources.length > 0`
3. Are light positions on screen? `light.x >= 0 && light.y >= 0`
4. Is browser supported? Check mask CSS property

**Debug:**

```tsx
// Temporarily disable fog to see map
{
  false && lighting.fogOfWarEnabled && <FogLayer />;
}
```

### Lights Not Creating Holes

**Check:**

1. SVG mask ID matches: `url(#fogMask)`
2. Gradient IDs are unique: `lightGradient-${light.id}`
3. Circle coordinates are correct: `cx={light.x} cy={light.y}`
4. Mask colors: Black = reveal, White = hide

**Debug:**

```tsx
// Make mask visible to inspect
<rect width="100%" height="100%" fill="white" opacity="0.5" />
```

### Performance Issues

**Check:**

1. Light count: `lighting.lightSources.length`
2. Radius sizes: Very large radii slow down rendering
3. Browser: Older browsers slower with masks
4. GPU acceleration: Check if hardware acceleration enabled

**Optimize:**

```tsx
// Reduce light count
const activeLights = lights.slice(0, 15);

// Reduce radius for distant lights
const optimizedRadius = distance > 1000 ? radius * 0.5 : radius;
```

## Alternative Approaches

### 1. Canvas-Based Fog

```typescript
// Draw fog on canvas
ctx.globalCompositeOperation = "destination-out";
lights.forEach((light) => {
  const gradient = ctx.createRadialGradient(
    light.x,
    light.y,
    0,
    light.x,
    light.y,
    light.radius
  );
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
  ctx.fill();
});
```

**Pros:** Better performance for many lights
**Cons:** More complex implementation

### 2. WebGL Shader

```glsl
uniform vec2 lights[10];
uniform float radii[10];

void main() {
  float visibility = 0.0;
  for(int i = 0; i < 10; i++) {
    float dist = distance(gl_FragCoord.xy, lights[i]);
    visibility += smoothstep(radii[i], 0.0, dist);
  }
  gl_FragColor = vec4(0, 0, 0, 1.0 - visibility);
}
```

**Pros:** Best performance
**Cons:** Complex, requires WebGL knowledge

## Related Files

- `src/pages/PlayerPage.tsx` - Fog mask implementation
- `src/pages/DMPage.tsx` - Light placement
- `src/types/dm.ts` - LightSource interface

## Summary

The SVG mask approach correctly reveals the map underneath light sources by creating actual transparent holes in the fog layer, rather than just drawing colored circles on top. The gradient falloff provides smooth transitions, and the colored glow layer adds atmospheric lighting effects. This solution works reliably across modern browsers and provides good performance for typical use cases (up to 20 lights).
