// Simple WebSocket server for DM/Player synchronization
// Run with: node server/websocket-server.js

const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const PORT = process.env.WS_PORT || 7000;

// Store sessions and their connected clients
const sessions = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Server Running\n');
});

// Create WebSocket server with increased message size limit
const wss = new WebSocket.Server({ 
  server,
  maxPayload: 100 * 1024 * 1024, // 100MB max message size
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

wss.on('connection', (ws, req) => {
  const query = url.parse(req.url, true).query;
  const sessionId = query.sessionId;
  const role = query.role; // 'dm' or 'player'

  console.log(`[WebSocket] New ${role} connection to session: ${sessionId}`);

  if (!sessionId) {
    ws.close(1008, 'Session ID required');
    return;
  }

  // Add client to session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { dm: null, players: [] });
  }

  const session = sessions.get(sessionId);

  if (role === 'dm') {
    if (session.dm) {
      // Close existing DM connection
      session.dm.close(1008, 'Another DM connected');
    }
    session.dm = ws;
    ws.role = 'dm';
  } else {
    session.players.push(ws);
    ws.role = 'player';
  }

  ws.sessionId = sessionId;

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      // Convert Buffer to string if needed
      const messageStr = message.toString();
      const messageSizeKB = (messageStr.length / 1024).toFixed(2);
      
      const event = JSON.parse(messageStr);
      console.log(`[WebSocket] Received from ${role}: ${event.type} (${messageSizeKB} KB)`);

      // Broadcast to appropriate clients
      if (role === 'dm') {
        // DM sends to all players
        let successCount = 0;
        session.players.forEach((player) => {
          if (player.readyState === WebSocket.OPEN) {
            player.send(messageStr);
            successCount++;
          }
        });
        console.log(`[WebSocket] Broadcast to ${successCount} players`);
      } else {
        // Players send to DM
        if (session.dm && session.dm.readyState === WebSocket.OPEN) {
          session.dm.send(messageStr);
        }
      }
    } catch (error) {
      console.error('[WebSocket] Error processing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`[WebSocket] ${role} disconnected from session: ${sessionId}`);

    const session = sessions.get(sessionId);
    if (!session) return;

    if (role === 'dm') {
      session.dm = null;
    } else {
      session.players = session.players.filter((p) => p !== ws);
    }

    // Clean up empty sessions
    if (!session.dm && session.players.length === 0) {
      sessions.delete(sessionId);
      console.log(`[WebSocket] Session ${sessionId} closed`);
    }
  });

  // Send connection confirmation
  ws.send(
    JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      payload: { sessionId, role },
    })
  );
});

server.listen(PORT, () => {
  console.log(`[WebSocket] Server running on port ${PORT}`);
});
