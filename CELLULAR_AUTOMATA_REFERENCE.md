# Cellular Automata Cave Generation - Quick Reference

## Algorithm Overview

```
1. INITIALIZE
   ├─ Create grid (width × height)
   ├─ Set all edges to WALL
   └─ For each interior cell:
      └─ WALL if random() < (fillProbability × caveRoughness)
      └─ OPEN otherwise

2. SMOOTH (repeat for smoothIterations)
   ├─ For each cell:
   │  ├─ Count wall neighbors (8-direction)
   │  ├─ If neighbors >= wallThreshold → WALL
   │  └─ Otherwise → OPEN
   └─ Always keep edges as WALL

3. ENSURE CONNECTIVITY
   ├─ Find all disconnected regions (flood fill)
   ├─ Identify largest region
   ├─ Fill all other regions with WALL
   └─ Result: Single connected cave
```

## Cellular Automata Rule

### Standard Rule (wallThreshold = 4)

```
Cell State = {
  WALL   if count(wall_neighbors) >= 4
  OPEN   if count(wall_neighbors) < 4
}

Neighbor Check (8-direction):
┌───┬───┬───┐
│ N │ N │ N │  N = Neighbor
├───┼───┼───┤
│ N │ C │ N │  C = Current Cell
├───┼───┼───┤
│ N │ N │ N │
└───┴───┴───┘

Out of bounds = counted as WALL
```

### Effect of wallThreshold

| Threshold | Neighbors Needed | Result                    |
| --------- | ---------------- | ------------------------- |
| 3         | 3+               | Large caverns, wide halls |
| **4**     | **4+**           | **Balanced caves** ✅     |
| 5         | 5+               | Narrow passages, dense    |
| 6         | 6+               | Very tight, wall-heavy    |

## Parameter Effects

### fillProbability (Initial Wall Density)

```
Low (0.30-0.40)    →  Mostly open, few walls
                      Large chambers, wide passages

Medium (0.40-0.50) →  Balanced mix ✅
                      Natural cave patterns

High (0.50-0.60)   →  Mostly walls, narrow passages
                      Claustrophobic caves
```

### smoothIterations (CA Passes)

```
Few (1-3)    →  Rough, irregular edges
                Organic, natural look

Medium (4-5) →  Smooth, rounded ✅
                Polished cave walls

Many (6-8)   →  Very smooth, almost circular
                Less natural variation
```

### caveRoughness (Multiplier)

```
adjustedFillProb = baseFillProb × caveRoughness

Examples with baseFillProb = 0.45:

roughness = 0.5  →  0.225  Huge caverns, sparse walls
roughness = 0.8  →  0.360  Large open areas
roughness = 1.0  →  0.450  Balanced ✅
roughness = 1.2  →  0.540  Tighter passages
roughness = 1.5  →  0.675  Very rough, jagged
roughness = 2.0  →  0.800  Extremely dense walls
```

## Visual Representation

### Iteration 0 (Random)

```
████ ██  ██  ███   Random wall placement
  ██  ███  █  ██   fillProbability = 0.45
██   █ ██   ████   45% chance of wall per cell
 ███    ██ ██  █   No structure yet
██  ███ █   ████
```

### Iteration 1 (First CA Pass)

```
████████  █████    Walls cluster together
  ███ ███   ███    Small passages form
███     ██ █████   Open areas emerge
  ███     ███  █   Edges smooth out
███ ████   █████
```

### Iteration 4 (Fully Smoothed)

```
█████████████      Clean cave structure
     ███          Clear passages
███       ██████   Defined chambers
  ███        ███   Smooth walls
███ ████████████   Organic feel
```

### After Connectivity

```
█████████████      Same structure
     ███          Isolated regions removed
███             ◄─ Small chamber filled
  ███             Only largest region kept
███ ████████████
```

## Color Scheme

### Rendering

```
Open Spaces:  #6a6a7a (light gray-blue)
   └─ Floor of cave
   └─ Walkable areas

Walls:        #1a1a2a (very dark blue-black)
   └─ Rock walls
   └─ Impassable terrain

Edge Variation:
   └─ Walls next to open spaces get texture
   └─ Creates organic, rough appearance
```

## Code Snippet

```typescript
// Generate cave
const generator = new CaveGenerator({
  width: 80,
  height: 80,
  seed: 12345,
  fillProbability: 0.45, // Base density
  smoothIterations: 4, // CA passes
  wallThreshold: 4, // CA rule
  caveRoughness: 1.0, // Roughness multiplier
});

const map = generator.generate();

// Result
map.grid[y][x] === 0; // Open space
map.grid[y][x] === 1; // Wall
```

## Common Patterns

### Large Cavern

```typescript
{
  fillProbability: 0.35,
  smoothIterations: 5,
  wallThreshold: 4,
  caveRoughness: 0.8
}
// Result: Spacious cave with smooth walls
```

### Narrow Tunnels

```typescript
{
  fillProbability: 0.50,
  smoothIterations: 3,
  wallThreshold: 5,
  caveRoughness: 1.3
}
// Result: Tight passages, claustrophobic
```

### Natural Cave ✅

```typescript
{
  fillProbability: 0.45,
  smoothIterations: 4,
  wallThreshold: 4,
  caveRoughness: 1.0
}
// Result: Balanced, realistic cave
```

## Flood Fill Connectivity

```
1. Start: Multiple disconnected regions
   ┌─────────────┐
   │ ████ █████  │
   │   █     █   │  Region A (large)
   │ ████ █████  │
   │             │
   │  ██         │  Region B (small, isolated)
   │  ██         │
   └─────────────┘

2. Flood Fill: Find all regions
   Region A: 145 cells (largest)
   Region B: 23 cells
   Region C: 8 cells

3. Result: Keep only Region A
   ┌─────────────┐
   │ ████ █████  │
   │   █     █   │  Single connected cave
   │ ████ █████  │
   │             │
   │  ███████████│  Isolated areas filled
   │  ███████████│
   └─────────────┘
```

## Performance Tips

1. **Small Maps** (50x50): Use 4-5 iterations
2. **Medium Maps** (100x100): Use 4 iterations ✅
3. **Large Maps** (200x200): Use 3 iterations (faster)

4. **More Iterations** = Slower but smoother
5. **Flood Fill** = O(n) where n = cell count
6. **Total Time** = ~40ms for 70x70 map

## Debugging

```typescript
// Enable logging in CaveGenerator
[CaveGenerator] Starting cave generation
[CaveGenerator] Parameters: fillProb=0.450, roughness=1, iterations=4, threshold=4
[CaveGenerator] Initialized 70x70 grid with 0.5% fill
[CaveGenerator] Completed iteration 1/4
[CaveGenerator] Completed iteration 2/4
[CaveGenerator] Completed iteration 3/4
[CaveGenerator] Completed iteration 4/4
[CaveGenerator] Found 1 separate regions
[CaveGenerator] Largest region has 4198 cells
[CaveGenerator] Ensured connectivity - removed isolated regions
[CaveGenerator] Final cave: 4198/4900 open spaces (85.7%)
```

## Math Reference

```
Neighbor Count Formula:
count = Σ(grid[y+dy][x+dx] === 1) for all (dx,dy) where dx,dy ∈ {-1,0,1}, (dx,dy) ≠ (0,0)

Adjusted Fill Probability:
fillProb_adjusted = clamp(fillProb_base × roughness, 0.1, 0.8)

Open Space Percentage:
openPercent = (count(0) / (width × height)) × 100
```

---

**Quick Start**: Use default parameters (fillProb=0.45, iterations=4, threshold=4, roughness=1.0) for balanced, natural caves! 🗺️
