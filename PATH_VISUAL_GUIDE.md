# Path Generation - Visual Guide

## How L-Shaped Corridors Work

### Example 1: Horizontal-First Routing

```
Starting Point: Room A Door at (5, 3)
Ending Point:   Room B Door at (12, 8)
Path Width:     2 cells
Routing:        Horizontal-First
```

**Step 1: Horizontal Segment**

```
     0  1  2  3  4  5  6  7  8  9 10 11 12
  0  .  .  .  .  .  .  .  .  .  .  .  .  .
  1  .  .  .  .  .  .  .  .  .  .  .  .  .
  2  .  .  .  .  .  .  .  .  .  .  .  .  .
  3  .  .  .  .  . [A][=][=][=][=][=][=][ ]
  4  .  .  .  .  .  #  #  #  #  #  #  #  .
  5  .  .  .  .  .  .  .  .  .  .  .  .  .
```

Corridor points: (5,3), (6,3), (7,3), (8,3), (9,3), (10,3), (11,3), (12,3)

**Step 2: Vertical Segment**

```
     0  1  2  3  4  5  6  7  8  9 10 11 12
  0  .  .  .  .  .  .  .  .  .  .  .  .  .
  1  .  .  .  .  .  .  .  .  .  .  .  .  .
  2  .  .  .  .  .  .  .  .  .  .  .  .  .
  3  .  .  .  .  . [A][=][=][=][=][=][=][╗]
  4  .  .  .  .  .  #  #  #  #  #  #  # [║]
  5  .  .  .  .  .  .  .  .  .  .  .  . [║]
  6  .  .  .  .  .  .  .  .  .  .  .  . [║]
  7  .  .  .  .  .  .  .  .  .  .  .  . [║]
  8  .  .  .  .  .  .  .  .  .  .  .  . [B]
```

Additional points: (12,4), (12,5), (12,6), (12,7), (12,8)

**Result**: Clean L-shaped corridor from A to B

---

### Example 2: Vertical-First Routing

```
Starting Point: Room C Door at (3, 2)
Ending Point:   Room D Door at (9, 7)
Path Width:     2 cells
Routing:        Vertical-First
```

**Step 1: Vertical Segment**

```
     0  1  2  3  4  5  6  7  8  9
  0  .  .  .  .  .  .  .  .  .  .
  1  .  .  .  .  .  .  .  .  .  .
  2  .  .  . [C] .  .  .  .  .  .
  3  .  .  . [║] .  .  .  .  .  .
  4  .  .  . [║] .  .  .  .  .  .
  5  .  .  . [║] .  .  .  .  .  .
  6  .  .  . [║] .  .  .  .  .  .
  7  .  .  . [║] .  .  .  .  .  .
```

**Step 2: Horizontal Segment**

```
     0  1  2  3  4  5  6  7  8  9
  0  .  .  .  .  .  .  .  .  .  .
  1  .  .  .  .  .  .  .  .  .  .
  2  .  .  . [C] .  .  .  .  .  .
  3  .  .  . [║] .  .  .  .  .  .
  4  .  .  . [║] .  .  .  .  .  .
  5  .  .  . [║] .  .  .  .  .  .
  6  .  .  . [║] .  .  .  .  .  .
  7  .  .  . [╚][=][=][=][=][=][D]
```

**Result**: Inverted L-shape corridor from C to D

---

## Path Width Examples

### Width 1 (Forest Trails)

```
Room A ═════╗
            ║
            ╚═════ Room B
```

Single cell wide - narrow trail

### Width 2 (Standard Corridors)

```
Room A ══════╗
        ##  [║]
            [║]
            [╚]══════ Room B
```

Two cells wide - typical dungeon

### Width 3 (Cave Passages)

```
Room A ════════╗
        ####  [║]
        ####  [║]
              [║]
              [╚]════════ Room B
```

Three cells wide - spacious cavern passage

---

## Comparison: Old vs New

### OLD SYSTEM (Bounding Box)

```
     0  1  2  3  4  5  6  7  8  9
  0  .  .  .  .  .  .  .  .  .  .
  1  .  .  .  .  .  .  .  .  .  .
  2  .  .  . [A] .  .  .  .  .  .
  3  .  .  . [█][█][█][█][█] .  .
  4  .  .  . [█][█][█][█][█] .  .
  5  .  .  . [█][█][█][█][█] .  .
  6  .  .  . [█][█][█][█][█] .  .
  7  .  .  . [█][█][█][█][B] .  .
  8  .  .  .  .  .  .  .  .  .  .
```

**Problem**: Entire bounding box filled (25 cells!)

### NEW SYSTEM (L-Shaped)

```
     0  1  2  3  4  5  6  7  8  9
  0  .  .  .  .  .  .  .  .  .  .
  1  .  .  .  .  .  .  .  .  .  .
  2  .  .  . [A] .  .  .  .  .  .
  3  .  .  . [║] .  .  .  .  .  .
  4  .  .  . [║] .  .  .  .  .  .
  5  .  .  . [║] .  .  .  .  .  .
  6  .  .  . [║] .  .  .  .  .  .
  7  .  .  . [╚][═][═][═][B] .  .
  8  .  .  .  .  .  .  .  .  .  .
```

**Solution**: Only corridor cells filled (9 cells)

---

## Grid Rendering Order

### OLD Layer Stack

```
┌─────────────────────┐
│   5. Objects        │ ← Objects on top
├─────────────────────┤
│   4. Grid           │ ← Grid hidden behind objects!
├─────────────────────┤
│   3. Paths          │
├─────────────────────┤
│   2. Rooms          │
├─────────────────────┤
│   1. Background     │ ← Also had grid lines!
└─────────────────────┘
```

**Problems**:

- Grid behind objects (not visible)
- Duplicate grid on background
- Can't interact with grid

### NEW Layer Stack

```
┌─────────────────────┐
│   5. Grid           │ ← Grid on TOP! ✓
├─────────────────────┤
│   4. Objects        │
├─────────────────────┤
│   3. Paths          │
├─────────────────────┤
│   2. Rooms          │
├─────────────────────┤
│   1. Background     │ ← Clean, no grid
└─────────────────────┘
```

**Benefits**:

- Grid always visible
- Can select/move grid
- No duplicates
- Clean separation of concerns

---

## Door Connection Examples

### Rectangular Room Doors

```
     ┌─────────────┐
     │   Room A    │
     │             │
     │      *      │  ← Door on wall center
     └──────┬──────┘
            │
            ║  Corridor connects to door!
            │
     ┌──────┴──────┐
     │      *      │  ← Door on wall center
     │             │
     │   Room B    │
     └─────────────┘
```

### Organic Shape Connections

```
        ╭─────╮
       ╱       ╲
      │  Cave   │
      │    *    │  ← Center connection point
       ╲       ╱
        ╰───┬──╯
            │
            ║  Trail
            │
        ╭───┴──╮
       ╱   *   ╲  ← Center connection point
      │ Clearing│
       ╲       ╱
        ╰─────╯
```

---

## Special Cases

### Same Row Alignment (Future: Could be straight line)

```
[Room A][═════════════════][Room B]
```

Current: Still uses L-shape (goes right, then right again)
Future: Could optimize to single horizontal line

### Same Column Alignment (Future: Could be straight line)

```
    [Room C]
        ║
        ║
        ║
        ║
    [Room D]
```

Current: Still uses L-shape (goes down, then down again)
Future: Could optimize to single vertical line

### Diagonal Rooms (L-Shape Required)

```
[Room E]
        ╲
         ╚═════╗
               ║
               ║
            [Room F]
```

Perfect use case for L-shaped corridors!

---

## Implementation Details

### Corridor Point Generation

```typescript
const corridorPoints: Position[] = [];

if (horizontalFirst) {
  // Step 1: Horizontal
  for (let x = minX; x <= maxX; x++) {
    corridorPoints.push({ x, y: startY });
  }

  // Step 2: Vertical
  for (let y = minY; y <= maxY; y++) {
    corridorPoints.push({ x: endX, y });
  }
}
```

### Rendering Each Point

```typescript
corridorPoints.forEach((point, idx) => {
  <Rect
    x={point.x * gridSize}
    y={point.y * gridSize}
    width={pathWidth * gridSize}
    height={pathWidth * gridSize}
    fill={pathColor}
  />;
});
```

---

## Legend

```
[A], [B], [C] = Room doors/connection points
[═] = Horizontal corridor segment
[║] = Vertical corridor segment
[╗], [╚], [╝], [╔] = Corridor corners
[█] = Old system - filled bounding box
 *  = Door position
 #  = Path width visualization (multiple cells)
 .  = Empty space
```

---

## Summary

✅ **Corridors**: Now proper L-shaped paths with configurable width
✅ **Routing**: Randomized horizontal-first vs vertical-first
✅ **Width**: 1-3 cells based on terrain type
✅ **Connections**: Paths connect to door positions on rooms
✅ **Grid**: Renders on top, no duplicates
✅ **Performance**: Efficient rendering of individual corridor cells

The new system creates realistic, navigable dungeons that match professional game standards!
