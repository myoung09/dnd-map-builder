# Player View Map Rendering Fix

## Issue

The player view was not rendering the map because the `mapData` was never being sent from the DM to the players. The PlayerPage component had `mapData` initialized to `null` and was waiting for the map data to be provided via WebSocket events.

## Root Cause

1. **Missing Map Data in DMSessionState**: The `DMSessionState` type did not include the actual map data, only metadata like `mapId`, `terrainType`, etc.
2. **No Initial Sync**: When the DM connected, no initial sync was sent to inform players about the map
3. **Player Not Receiving Map Data**: The PlayerPage was listening for map data but never received it from sync events

## Solution

### 1. Updated Type Definitions (`src/types/dm.ts`)

Added `mapData` field to `DMSessionState`:

```typescript
export interface DMSessionState {
  sessionId: string;
  workspaceId: string;
  mapId: string;
  mapData?: any; // MapData from generator types - ADDED
  lighting: LightingState;
  objects: DMObject[];
  revealedAreas: RevealedArea[];
  createdAt: number;
  updatedAt: number;
}
```

### 2. Updated DMPage (`src/pages/DMPage.tsx`)

#### Initial Sync on Connection

Added a useEffect that sends an initial sync when the DM connects, including the full map data:

```typescript
useEffect(() => {
  wsService.connect(sessionId, "dm").then(() => {
    setConnected(true);

    // Send initial sync with map data to any connected players
    const initialState: DMSessionState = {
      sessionId,
      workspaceId: "workspace_1",
      mapId: "map_1",
      mapData: mapData, // Include full map data
      lighting,
      objects: dmObjects,
      revealedAreas: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    wsService.send({
      type: WSEventType.SYNC_NOW,
      payload: {
        sessionState: initialState,
      },
    });
  });
}, [sessionId, mapData, lighting, dmObjects]);
```

#### Updated Manual Sync

Modified `handleSyncNow` to include map data:

```typescript
const handleSyncNow = useCallback(() => {
  const sessionState: DMSessionState = {
    // ... other fields
    mapData: mapData, // Include map data
    // ...
  };
  // ...
}, [sessionId, mapData, lighting, dmObjects]);
```

#### Updated Session Save

Modified `handleSaveSession` to include map data:

```typescript
const handleSaveSession = useCallback(() => {
  const sessionState: DMSessionState = {
    // ... other fields
    mapData: mapData, // Include map data
    // ...
  };
  // ...
}, [sessionId, mapData, lighting, dmObjects]);
```

### 3. Updated PlayerPage (`src/pages/PlayerPage.tsx`)

Modified the SYNC_NOW event handler to extract and set the map data:

```typescript
const unsubSync = wsService.on(WSEventType.SYNC_NOW, (event: WSEvent) => {
  if (event.type === WSEventType.SYNC_NOW) {
    const state: DMSessionState = event.payload.sessionState;

    // Update map data if provided - ADDED
    if (state.mapData) {
      setMapData(state.mapData);
      console.log("[PlayerPage] Map data loaded");
    }

    setLighting(state.lighting);
    setVisibleObjects(state.objects.filter((o) => o.visibleToPlayers));
  }
});
```

## How It Works Now

### DM Side

1. DM clicks "Start Campaign" with a generated map
2. DMPage loads with the map data passed from the builder
3. On WebSocket connection, DM immediately broadcasts a SYNC_NOW event
4. The sync event includes the full `MapData` object with terrain, rooms, etc.

### Player Side

1. Player opens the session link
2. PlayerPage connects to the WebSocket with the session ID
3. Player receives the SYNC_NOW event from the DM
4. Map data is extracted and set in the `mapData` state
5. MapCanvas receives the map data and renders the map

### Manual Sync

When the DM clicks "Sync Now" button:

1. Current map data is packaged into the session state
2. SYNC_NOW event is broadcast to all players
3. Players receive and update their map data

## Testing Steps

1. **Start the servers**: `npm run dev`
2. **Build a map**: Generate a dungeon/forest/cave in the builder
3. **Start campaign**: Click "Start Campaign" button
4. **Copy player link**: Go to Sync tab, copy the player link
5. **Open player view**: Paste link in new browser tab/window
6. **Verify map renders**: Player should see the same map as the DM

## Expected Behavior

✅ **Player view should now show:**

- The complete map with terrain (walls, floors, paths)
- Grid overlay (if enabled)
- Rooms and corridors
- Trees/vegetation (for forests)
- All visible objects placed by the DM

✅ **Real-time updates:**

- Changes to lighting sync immediately
- Object visibility toggles sync
- Manual sync button forces full refresh

## Console Logs

Look for these console messages to verify it's working:

**DM Console:**

```
[DMPage] Connected to session: session-xxx
[DMPage] Sent initial sync with map data
```

**Player Console:**

```
[PlayerPage] Connected to session: session-xxx
[PlayerPage] Full sync received: {sessionId: "...", mapData: {...}, ...}
[PlayerPage] Map data loaded
```

## Troubleshooting

### Player still sees blank canvas

1. Check browser console for errors
2. Verify WebSocket connection (green "Connected" chip)
3. Ensure DM has generated a map before starting campaign
4. Try clicking "Sync Now" button in DM's Sync tab
5. Refresh player page after DM connects

### Map data is null

1. Ensure you generated a map before clicking "Start Campaign"
2. Check that `mapData` is not null in App.tsx when navigating
3. Verify DMPage received the map data via location.state

### WebSocket not connecting

1. Ensure `npm run dev` is running (not just `npm start`)
2. Check that WebSocket server is running on port 3001
3. Verify no firewall is blocking the connection
4. Check for errors in the terminal running the WebSocket server

## Performance Considerations

**Map Data Size:**

- Map data can be large (especially for 80x80+ grids)
- Consider compression for production
- May add slight delay on initial sync

**Optimization Ideas (Future):**

1. Only send map data on initial connection
2. Use delta updates for changes
3. Compress map data before sending
4. Cache map data on player side

## Related Files

- `src/types/dm.ts` - Added mapData to DMSessionState
- `src/pages/DMPage.tsx` - Send map data in sync events
- `src/pages/PlayerPage.tsx` - Receive and set map data
- `src/components/MapCanvas.tsx` - Renders the map

## Future Enhancements

1. **Map Caching**: Cache map data on player side to avoid re-sending
2. **Incremental Updates**: Only send changed cells/sections
3. **Map Transitions**: Smooth transitions when DM switches maps
4. **Map Preloading**: Preload adjacent maps for seamless transitions
5. **Compression**: Compress map data for network efficiency

## Summary

The fix ensures that when a DM starts a campaign, the complete map data is immediately synchronized to all connected players. Players now see the same map the DM sees, with all terrain, structures, and features rendered correctly.
