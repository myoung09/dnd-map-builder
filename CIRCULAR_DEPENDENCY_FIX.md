# Circular Dependency Fix

## Problem
Runtime error: `Cannot read properties of undefined (reading 'get')`

**Root Cause:** Circular dependency between config files and service:
- `houseConfig.ts` imported enums from `mapGenerationService.ts`
- `mapGenerationService.ts` imported configs from `houseConfig.ts`
- This created a module loading order issue where `HOUSE_SUBTYPES` Map was undefined at runtime

## Solution
Created a centralized enums file to break the circular dependency.

### Changes Made

#### 1. Created `src/types/enums.ts` (NEW)
Extracted all enum definitions to a shared location:
- `MapTerrainType` enum
- `HouseSubtype` enum
- `ForestSubtype` enum
- `CaveSubtype` enum
- `TownSubtype` enum  
- `DungeonSubtype` enum
- `HouseStory` enum

#### 2. Updated `src/config/terrains/houseConfig.ts`
**Before:**
```typescript
import { HouseSubtype, HouseStory } from '../../services/mapGenerationService';
```

**After:**
```typescript
import { HouseSubtype, HouseStory } from '../../types/enums';
```

#### 3. Updated `src/config/terrains/colorThemes.ts`
**Before:**
```typescript
import { MapTerrainType } from '../../services/mapGenerationService';
```

**After:**
```typescript
import { MapTerrainType } from '../../types/enums';
```

#### 4. Updated `src/services/mapGenerationService.ts`
**Removed:** All enum definitions (~60 lines)

**Added:** Import and re-export pattern
```typescript
// Import enums for use in this file
import {
  MapTerrainType,
  HouseSubtype,
  ForestSubtype,
  CaveSubtype,
  TownSubtype,
  DungeonSubtype,
  HouseStory
} from '../types/enums';

// Re-export enums for other modules
export { 
  MapTerrainType,
  HouseSubtype,
  ForestSubtype,
  CaveSubtype,
  TownSubtype,
  DungeonSubtype,
  HouseStory
};
```

## Dependency Graph

### Before (Circular):
```
mapGenerationService.ts
    ↓ imports configs
houseConfig.ts
    ↓ imports enums
mapGenerationService.ts  ← CIRCULAR!
```

### After (Clean):
```
types/enums.ts  ← Single source of truth
    ↑               ↑
    │               │
    │          mapGenerationService.ts
    │               (imports & re-exports)
    │
houseConfig.ts
```

## Benefits

1. **No Circular Dependencies** - Clean module loading order
2. **Single Source of Truth** - Enums defined in one place
3. **Backward Compatible** - Service still exports enums (other code doesn't break)
4. **Better Organization** - Types separated from business logic
5. **Easier Maintenance** - Clear separation of concerns

## Testing
- ✅ Build successful (no TypeScript errors)
- ✅ No circular dependency warnings
- ✅ Bundle size unchanged (just reorganization)
- ⏳ Runtime testing (dev server restart needed)

## Migration Impact
**External code (components, etc.):** No changes needed
- They import from `mapGenerationService` which still exports all enums

**Internal code (config files):** Already updated
- Now import from `types/enums` instead of service

## Files Modified
1. `src/types/enums.ts` - Created (70 lines)
2. `src/config/terrains/houseConfig.ts` - Import path updated
3. `src/config/terrains/colorThemes.ts` - Import path updated
4. `src/services/mapGenerationService.ts` - Enums removed, import/re-export added

## Verification Steps
1. ✅ TypeScript compilation passes
2. ✅ Build succeeds  
3. ⏳ Dev server runs without errors
4. ⏳ AI Generation Dialog opens without crashes
5. ⏳ House config selection works properly

## Next Steps
- Restart development server to test runtime behavior
- Verify AI Generation Dialog loads correctly
- Test house subtype and story selection dropdowns
