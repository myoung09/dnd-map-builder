# Simple FTP Deployment Instructions

## What to Upload

After running `npm run build`, upload these files/folders to your VPS:

```
/var/www/dnd-map-builder/
├── build/              (entire folder - your React app)
├── server/             (entire folder - websocket server)
├── node_modules/       (optional - install on server instead)
├── package.json
├── package-lock.json
├── ecosystem.config.js
└── .env.production
```

## On Your VPS (via SSH)

```bash
cd /var/www/dnd-map-builder

# Install dependencies
npm install --production

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Or start manually without PM2
node server/websocket-server.js &  # Runs on port 7000
npx serve -s build -l 6000 &       # Runs on port 6000
```

## nginx Configuration

Copy `nginx.conf` to your nginx sites and restart nginx.

## That's it!

Your app will be running on:
- Client: http://localhost:6000
- WebSocket: http://localhost:7000
- Public: https://dnd.mypixelforge.io (via nginx proxy)
