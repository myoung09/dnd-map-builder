# D&D Map Builder - Fresh Start

## Overview
Complete clean slate - all previous map generation code has been removed. The project is now a minimal React application ready to be rebuilt from scratch.

## What Was Removed
- All components (`src/components/`)
- All services (`src/services/`)
- All hooks (`src/hooks/`)
- All utilities (`src/utils/`)
- All config files (`src/config/`)
- All map generation logic, algorithms, and AI integration
- All UI components (toolbars, panels, dialogs, etc.)

## What Remains

### Core Files
- `src/App.tsx` - Minimal React app component
- `src/App.css` - Basic styling
- `src/index.tsx` - React entry point (cleaned)
- `src/index.css` - Global styles
- `package.json` - React dependencies
- `tsconfig.json` - TypeScript configuration

### Type Definitions (`src/types/`)
- `map.ts` - Minimal core types:
  - `Position` - x, y coordinates
  - `Size` - width, height
  - `Color` - r, g, b, a
  - `GridConfig` - cell size, visibility, snap settings, grid type, display scale
  - `MapMetadata` - id, name, dates, author, tags
  - `DnDMap` - metadata, dimensions, gridConfig, backgroundColor
  - `MapExportData` - export format data
  - `ViewportState` - position, zoom, rotation
  - `EditorState` - currentMap, viewportState, isDirty

- `workspace.ts` - Workspace structure (kept for future use)
- `campaign.ts` - Campaign structure (kept for future use)

### Assets
- `src/assets/` - Empty directory for future assets
- `public/` - Standard Create React App public files

## Current State
✅ **App compiles successfully** - `npm run build` works  
✅ **Clean type definitions** - Minimal foundation ready for expansion  
✅ **No errors** - All TypeScript compilation errors resolved  
✅ **React-only** - Pure React application with no custom functionality yet

## What's Next
You now have a completely clean foundation to build whatever you want. The basic type structures for maps, workspaces, and campaigns are in place, but all implementation has been removed.

You can now:
1. Add new components as needed
2. Implement new map generation algorithms from scratch
3. Build new services with a fresh approach
4. Create a completely different feature set
5. Or anything else you want to build!

## Running the App
```bash
npm start    # Start development server
npm build    # Build for production
npm test     # Run tests
```

## Notes
- The project still uses Material-UI dependencies (in package.json) but they're not imported in the code
- The workspace and campaign type definitions remain for reference but aren't used
- All old generation code, algorithms, and documentation have been permanently deleted
