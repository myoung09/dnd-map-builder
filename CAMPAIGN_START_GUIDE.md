# Campaign Start Quick Guide

## Step-by-Step Instructions

### 1. Build Your Map

![Map Builder](./docs/images/map-builder.png)

1. Open the map builder at `http://localhost:3000`
2. Select terrain type (Dungeon, Forest, Cave, or House)
3. Adjust parameters and generate your map
4. Place objects and sprites on the map
5. Customize to your liking

### 2. Start the Campaign

![Start Campaign Button](./docs/images/start-campaign-button.png)

1. Look for the **"Start Campaign"** button in the top-right menu bar
2. It's a blue button next to the "Export" button
3. Click it to launch the DM view
4. Your map and all objects will automatically load

### 3. Share with Players

![Player Link](./docs/images/player-link.png)

1. In the DM view, click the **"Sync"** tab
2. Find the "Player Link" section
3. Click the **"Copy"** button to copy the link
4. Share the link with your players via:
   - Discord
   - Email
   - Slack
   - Any other communication method

The link will look like:

```
http://localhost:3000/player?session=session-1704123456789-x7k9m2p4q
```

### 4. Control the Campaign

#### Lighting Tab

![Lighting Controls](./docs/images/lighting-controls.png)

- **Brightness**: Adjust overall brightness (0.0 - 2.0)
- **Contrast**: Adjust contrast (0.0 - 2.0)
- **Fog of War**: Toggle to hide unexplored areas
- **Light Sources**: Add torches, lanterns, or magical lights
  - Set radius and intensity for each light
  - Position lights on the map

#### Objects Tab

![Object Controls](./docs/images/object-controls.png)

- **Filter by Category**: View specific object types
  - Monsters
  - Traps
  - NPCs
  - Treasure
  - Environment
- **Toggle Visibility**: Show/hide objects from players
- **Quick Actions**: Add common monsters quickly

#### Sync Tab

![Sync Controls](./docs/images/sync-controls.png)

- **Session ID**: Unique identifier for this campaign
- **Player Link**: URL for players to join
- **Session Name**: Give your campaign a memorable name
- **Sync Now**: Force update all players
- **Save Session**: Preserve current state
- **Session Stats**: View object counts and settings

### 5. Return to Builder

![Back to Builder](./docs/images/back-to-builder.png)

1. Click **"Back to Builder"** in the top-left corner
2. You'll return to the map editor
3. Your campaign session continues running
4. Players remain connected
5. Make changes and generate new maps

## Common Workflows

### Scenario 1: Starting a New Campaign

```
1. Generate dungeon map (80x80)
2. Add monsters from sprite palette
3. Place traps and treasure
4. Click "Start Campaign"
5. Copy player link
6. Share with 4 players
7. Set fog of war enabled
8. Add torch light sources in starting room
9. Begin adventure!
```

### Scenario 2: Multi-Session Campaign

```
1. Import workspace with saved maps
2. Load Map 1 (Entrance)
3. Click "Start Campaign"
4. Players join using same link as last session
5. Run session 1
6. Save session state
7. Return to builder
8. Load Map 2 (Deeper Levels)
9. Start new campaign for next session
```

### Scenario 3: Dynamic Map Editing

```
1. Start campaign with initial map
2. Players exploring
3. Click "Back to Builder"
4. Generate new section (secret room)
5. Add objects and details
6. Click "Start Campaign" again
7. DM reveals new area to players
```

## Tips and Tricks

### For Dungeon Masters

1. **Pre-place Light Sources**: Add torches before starting to create atmosphere
2. **Hide Objects Initially**: Set monsters to invisible, reveal during encounters
3. **Use Fog of War**: Build tension by hiding unexplored areas
4. **Test Player View**: Open player link in incognito to see what players see
5. **Name Your Session**: Use descriptive names like "Temple of Doom - Session 3"
6. **Save Frequently**: Use "Save Session" after important changes

### For Better Performance

1. **Close Unused Tabs**: Keep only DM view and one player test view open
2. **Use Modern Browser**: Chrome, Firefox, or Edge for best WebSocket support
3. **Local Network**: For best latency, host on local network
4. **Sprite Optimization**: Use compressed sprite sheets for faster loading

### Keyboard Shortcuts (Future)

Currently planning:

- `Ctrl+S` - Save session
- `Ctrl+F` - Toggle fog of war
- `Ctrl+L` - Switch to lighting tab
- `Ctrl+B` - Back to builder
- `Space` - Sync now

## Troubleshooting

### "Start Campaign" button is grayed out

**Solution**: Generate a map first using the parameters drawer

### Players see blank screen

**Solution**:

1. Check WebSocket server is running
2. Verify session ID in URL matches
3. Ensure port 3001 is accessible

### Map doesn't show in DM view

**Solution**:

1. Return to builder
2. Generate a new map
3. Try "Start Campaign" again

### Changes not syncing to players

**Solution**:

1. Check connection status (green = connected)
2. Click "Sync Now" to force update
3. Restart WebSocket server if needed

### Player link doesn't work remotely

**Solution**:

1. Replace `localhost` with your local IP address
2. Example: `http://192.168.1.100:3000/player?session=...`
3. Ensure firewall allows port 3000 and 3001
4. Use port forwarding for internet access

## Advanced Features

### Custom Session IDs

You can create memorable session IDs by:

1. Modifying the session generation in `handleStartCampaign`
2. Using campaign name as part of ID
3. Format: `{campaignName}-{date}-{randomString}`

### Persistent Sessions

To enable session recovery after refresh:

1. Sessions are stored in browser localStorage
2. On page load, check for existing sessions
3. Offer to resume or start new

### Multiple DMs (Future)

Planning to support:

- Co-DM functionality
- DM role handoff
- Assistant DM with limited controls

## Best Practices Summary

✅ **DO:**

- Generate and test map before starting campaign
- Save session state regularly
- Use descriptive session names
- Test player view before sharing
- Run both servers with `npm run dev`
- Share session links securely

❌ **DON'T:**

- Start campaign without generating a map
- Share session links on public forums
- Close builder tab while running campaign
- Forget to save after major changes
- Use session across multiple campaigns simultaneously

## Next Steps

After mastering the campaign start feature:

1. **Explore Advanced Lighting**: Create atmospheric scenes with multiple light sources
2. **Object Management**: Master visibility controls for dramatic reveals
3. **Multi-Map Campaigns**: Learn to transition between workspace maps
4. **Custom Sprites**: Build your own sprite palette for unique campaigns
5. **Session Templates**: Create reusable campaign setups

## Support

For issues or questions:

- Check the troubleshooting section
- Review CAMPAIGN_START_FEATURE.md for technical details
- Check DM_PLAYER_SYSTEM.md for WebSocket information
- Open an issue on GitHub

## Feedback

We'd love to hear about your campaigns! Share:

- Feature requests
- Bug reports
- Campaign stories
- Suggestions for improvement

Happy gaming! 🎲🗺️
