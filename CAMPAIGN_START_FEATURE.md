# Campaign Start Feature

## Overview

The "Start Campaign" feature provides a seamless one-click transition from the map builder workspace to the DM (Dungeon Master) campaign view, allowing DMs to instantly begin running their campaign with the current workspace.

## Features

### 1. Start Campaign Button

- **Location**: Top menu bar (right side, after Export button)
- **Style**: Prominent blue "Contained" button with Campaign Wizard icon
- **Behavior**: Navigates to DM view with current workspace state preserved

### 2. State Transfer

When you click "Start Campaign", the following data is automatically transferred to the DM view:

- **Map Data**: Current generated map (terrain, rooms, corridors, etc.)
- **Workspace**: Complete workspace structure with all maps
- **Palette**: Custom sprite palette and categories
- **Placed Objects**: All objects placed on the current map
- **Spritesheets**: All loaded sprite sheets
- **Session ID**: Unique session identifier for player connections

### 3. DM View Enhancements

#### Header Bar

- **DM Campaign View**: Title showing you're in DM mode
- **Back to Builder**: Button to return to the map builder without losing your work

#### Player Connection

The Sync tab now displays:

- **Session ID**: Unique identifier for the current session
- **Player Link**: Full URL for players to join (`http://localhost:3000/player?session=<sessionId>`)
- **Copy Button**: One-click copy of the player link to clipboard

#### Session Management

- Session name input for organizing campaigns
- Sync Now button for force-synchronizing with players
- Save Session button for persisting campaign state
- Real-time connection status (Connected/Disconnected)
- Session statistics (object counts, light sources, fog status)

### 4. Player Experience

Players can join using the provided link:

1. Copy the player link from the DM's Sync tab
2. Share it with players
3. Players navigate to the link in their browser
4. They see a read-only view of the map with:
   - Real-time updates as the DM makes changes
   - Only objects visible to players
   - Fog of war effects (if enabled)
   - Lighting changes
   - Connection status indicator

## Usage Flow

### Starting a Campaign

1. **Build Your Map**

   - Use the map builder to create your dungeon, forest, cave, or house
   - Place sprites and objects on the map
   - Customize using your sprite palette
   - Save to workspace (optional)

2. **Start Campaign**

   - Click the "Start Campaign" button in the top menu bar
   - You're instantly taken to the DM view
   - All your map data and objects are preserved
   - A unique session ID is generated

3. **Share with Players**

   - Navigate to the "Sync" tab in the DM view
   - Copy the player link using the Copy button
   - Share the link with your players via Discord, email, etc.

4. **Run the Campaign**

   - Use the Lighting tab to control brightness, contrast, and fog of war
   - Add light sources for dramatic effect
   - Toggle object visibility in the Objects tab
   - All changes sync to players in real-time

5. **Return to Builder**
   - Click "Back to Builder" to return to the map editor
   - Your campaign session continues running
   - You can edit and generate new maps

## Technical Details

### Session ID Generation

Each campaign session gets a unique ID in the format:

```
session-{timestamp}-{random-string}
```

Example: `session-1704123456789-x7k9m2p4q`

### State Persistence

Currently, session state is held in memory. When you navigate back to the builder:

- The DM view retains its state for the session
- Players remain connected
- Returning to the DM view may require reconnection

**Future Enhancement**: Implement localStorage or backend persistence for session recovery.

### WebSocket Communication

The campaign uses WebSocket connections for real-time synchronization:

- **Server**: Runs on `ws://localhost:3001`
- **Protocol**: Event-based communication with 11 event types
- **Reconnection**: Automatic retry with exponential backoff (up to 5 attempts)
- **Session Isolation**: Each session maintains separate DM and player connections

### Data Structure

The navigation state passed to the DM view:

```typescript
{
  mapData: MapData | null,
  workspace: Workspace | null,
  palette: Palette | null,
  placedObjects: PlacedObject[],
  spritesheets: SpriteSheet[],
  sessionId: string
}
```

Objects are converted from `PlacedObject` to `DMObject` format:

- `gridX, gridY` → `x, y`
- Adds `category`, `visibleToPlayers`, and `notes` fields
- Preserves scale, rotation, and zIndex

## Development Notes

### Files Modified

1. **src/components/TopMenuBar.tsx**

   - Added `onStartCampaign` prop
   - Added "Start Campaign" button with Campaign Wizard icon

2. **src/App.tsx**

   - Imported `useNavigate` from react-router-dom
   - Added `handleStartCampaign` function with state packaging
   - Connected button to navigation handler

3. **src/pages/DMPage.tsx**
   - Imported `useLocation` and `useNavigate`
   - Extract passed state from `location.state`
   - Initialize map data and objects from passed state
   - Convert PlacedObjects to DMObjects
   - Added header with "Back to Builder" button
   - Added player link with copy functionality in Sync tab

### Component Structure

```
App (Builder)
  ↓ [Start Campaign]
DMPage (DM View)
  ├── Header (Back to Builder)
  ├── MapCanvas (Map Display)
  └── Control Panel
      ├── Lighting Tab
      ├── Objects Tab
      └── Sync Tab (Player Link)
```

### Router Integration

The app uses React Router for navigation:

- `/` - Map Builder (App.tsx)
- `/dm` - DM Campaign View (DMPage.tsx)
- `/player?session=<id>` - Player View (PlayerPage.tsx)

Navigation with state:

```typescript
navigate("/dm", {
  state: {
    mapData,
    workspace,
    palette,
    placedObjects,
    spritesheets,
    sessionId,
  },
});
```

## Future Enhancements

### Planned Improvements

1. **Session Persistence**

   - Save sessions to localStorage
   - Allow resuming campaigns after browser refresh
   - Session history and management

2. **Multi-Map Support**

   - Switch between workspace maps in DM view
   - Seamless map transitions for players
   - Map preloading for smoother experience

3. **Enhanced Player Controls**

   - Allow players to control tokens
   - Implement turn order and initiative
   - Player-specific visibility settings

4. **Campaign Templates**

   - Pre-built campaign scenarios
   - Quick-start templates with maps and objects
   - Save custom templates

5. **Advanced Lighting**

   - Dynamic shadows based on object positions
   - Light source animations (flickering torches)
   - Player-specific light sources (darkvision)

6. **Voice/Chat Integration**
   - Built-in voice chat for remote play
   - Text chat with dice rolling
   - Notification system for important events

## Troubleshooting

### Button Doesn't Appear

- Ensure you have react-router-dom installed
- Check that TopMenuBar component is receiving the prop
- Verify the App component has the navigation handler

### State Not Transferred

- Check browser console for errors
- Verify location.state is being read correctly
- Ensure all required types are imported in DMPage

### Players Can't Connect

- Verify WebSocket server is running (`npm run ws-server`)
- Check that port 3001 is not blocked by firewall
- Ensure session ID is correctly formatted in the player link

### Map Not Displaying in DM View

- Check that mapData is not null when starting campaign
- Generate a map before clicking "Start Campaign"
- Verify MapCanvas is receiving the mapData prop

## Best Practices

1. **Generate Map First**: Always create a map before starting a campaign
2. **Save Workspace**: Save your workspace before starting to preserve your work
3. **Test Player Link**: Test the player link in an incognito window before sharing
4. **Run WebSocket Server**: Ensure `npm run dev` is used to run both servers
5. **Share Links Securely**: Session IDs are not encrypted; use secure channels for sharing

## Conclusion

The Campaign Start feature streamlines the transition from map building to campaign running, making it easier than ever to go from creative design to immersive gameplay. With one click, you can transform your workspace into a living, breathing campaign that players can join and experience in real-time.
