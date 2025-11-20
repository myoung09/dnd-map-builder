# DM/Player System

This application now includes a Dungeon Master (DM) and Player system that allows real-time synchronization between a DM's control interface and players' views.

## Features

### DM Route (`/dm`)

The Dungeon Master interface provides complete control over the game session:

#### Lighting Tab

- **Brightness Slider**: Adjust global brightness (0-2x normal)
- **Contrast Slider**: Adjust global contrast (0-2x normal)
- **Fog of War Toggle**: Enable/disable fog of war for players
- **Light Sources**: Place and manage light sources (torches, lanterns, spells)
  - Each light source has position, radius, and intensity
  - Dynamic illumination effects

#### Objects Tab

- **Category Filter**: Filter objects by type (monsters, traps, NPCs, treasure, environment)
- **Quick Actions**: Fast placement buttons for common monster types
- **Object Management**: View all placed objects with:
  - Position display
  - Visibility toggle (show/hide from players)
  - Category indicators
- **Drag-and-Drop**: Place objects from palette directly onto the map

#### Sync Tab

- **Session Management**: View session ID and connection status
- **Sync Now**: Force immediate synchronization of all state to players
- **Save Session**: Persist current session state
- **Session Stats**: View counts of objects, light sources, and visibility settings

### Player Route (`/player`)

Clean, read-only view for players:

- **Real-time Updates**: Automatically receives all DM changes
- **Lighting Effects**: Displays brightness, contrast, and fog of war
- **Visible Objects Only**: Shows only objects the DM has made visible
- **Connection Status**: Indicator showing connection to session
- **Minimal UI**: Focus on the game, not the controls

## Usage

### Starting the Application

1. **Start both servers**:

   ```bash
   npm run dev
   ```

   This starts both the React app (port 3000) and WebSocket server (port 3001)

2. **Or start individually**:

   ```bash
   # Terminal 1: Start WebSocket server
   npm run ws-server

   # Terminal 2: Start React app
   npm start
   ```

### Creating a Session

1. Navigate to `/dm` to open the DM interface
2. A new session ID is automatically generated
3. Share the session ID with players

### Joining as a Player

1. Navigate to `/player?session=SESSION_ID`
2. The player view automatically connects and displays what the DM reveals

## WebSocket Events

The system uses the following event types:

- `MAP_INIT`: Initialize map with terrain type, seed, and dimensions
- `LIGHTING_UPDATE`: Update brightness, contrast, fog of war, and light sources
- `OBJECT_PLACED`: Place a new object on the map
- `OBJECT_REMOVED`: Remove an object from the map
- `OBJECT_UPDATED`: Update object position or visibility
- `AREA_REVEALED`: Reveal a specific area to players
- `AREA_HIDDEN`: Hide a specific area from players
- `SYNC_NOW`: Force full state synchronization
- `SESSION_SAVE`: Save session state
- `SESSION_LOAD`: Load saved session state

## Architecture

### Client-Side

- **React Router**: Handles routing between builder, DM, and player views
- **WebSocket Service**: Manages connections and event broadcasting
- **Material-UI**: Provides responsive, accessible UI components
- **State Management**: React hooks for local state, WebSocket for sync

### Server-Side

- **WebSocket Server**: Simple Node.js server managing sessions
- **Session Management**: Tracks DM and player connections per session
- **Event Broadcasting**: Routes events from DM to players and vice versa

## Development

### Adding New Events

1. Define the event type in `src/types/dm.ts`:

   ```typescript
   export enum WSEventType {
     MY_NEW_EVENT = "MY_NEW_EVENT",
   }

   export interface WSMyNewEvent {
     type: WSEventType.MY_NEW_EVENT;
     payload: {
       /* your data */
     };
   }
   ```

2. Add the event to the union type:

   ```typescript
   export type WSEvent = /* ... */ WSMyNewEvent;
   ```

3. Send the event from DM:

   ```typescript
   wsService.send({
     type: WSEventType.MY_NEW_EVENT,
     payload: {
       /* your data */
     },
   });
   ```

4. Listen for the event in Player view:
   ```typescript
   const unsub = wsService.on(WSEventType.MY_NEW_EVENT, (event) => {
     // Handle event
   });
   ```

### Session Persistence

Sessions are automatically persisted when the DM clicks "Save Session". The session state includes:

- Lighting settings
- Placed objects and their visibility
- Revealed areas
- Session metadata

## Future Enhancements

- [ ] Authentication and session security
- [ ] Multiple DM roles (co-DMs)
- [ ] Player cursors and annotations
- [ ] Voice/text chat integration
- [ ] Advanced fog of war with manual reveal tools
- [ ] Monster stat blocks and initiative tracker
- [ ] Dice roller with broadcast results
- [ ] Grid-based movement with turn order
- [ ] Terrain effects and hazards
- [ ] Token customization and status effects

## Troubleshooting

### WebSocket Connection Failed

- Ensure the WebSocket server is running (`npm run ws-server`)
- Check that port 3001 is not blocked by firewall
- Verify `REACT_APP_WS_URL` environment variable if using custom URL

### Player Not Seeing Updates

- Check connection status indicator
- Verify both DM and player are in the same session
- Click "Sync Now" button in DM interface to force update

### Objects Not Appearing

- Ensure object visibility is toggled on (eye icon in DM interface)
- Check that the object category matches the filter
- Verify the object is within map bounds
