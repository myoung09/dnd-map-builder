# Deployment Guide for DnD Map Builder

This guide covers the deployment of the DnD Map Builder application to a Hostinger VPS.

## Architecture Overview

The application consists of two main components:
1. **React Frontend**: A single-page application built with Create React App
2. **WebSocket Server**: A Node.js server for real-time DM/Player synchronization

## Prerequisites

### On the VPS (31.97.129.97):

1. **Node.js and npm**: Version 14+ recommended
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **PM2**: Process manager for Node.js applications
   ```bash
   npm install -g pm2
   ```

3. **Git**: For pulling code changes
   ```bash
   sudo apt-get install git
   ```

4. **Web Server**: Nginx or Apache to serve the static frontend
   ```bash
   sudo apt-get install nginx
   ```

### On GitHub (Self-hosted Runner):

1. A self-hosted runner must be configured with:
   - SSH key at `~/.ssh/id_ed25519_vps_v2` with access to root@31.97.129.97
   - Git and npm installed

## Initial VPS Setup

### 1. Create Application Directory

```bash
ssh root@31.97.129.97
mkdir -p /var/www/dnd-map-builder
cd /var/www/dnd-map-builder
```

### 2. Clone the Repository

```bash
git clone https://github.com/myoung09/dnd-map-builder.git .
# Or if already cloned from a different branch:
git checkout master
git pull origin master
```

### 3. Install Dependencies and Build

```bash
npm install
npm run build
```

### 4. Create Logs Directory

```bash
mkdir -p logs
```

### 5. Start the WebSocket Server with PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### 6. Configure Nginx

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/dnd-map-builder
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your actual domain or IP

    # Serve static React build files
    root /var/www/dnd-map-builder/build;
    index index.html;

    # React Router support - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/dnd-map-builder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Automated Deployment with GitHub Actions

The deployment is automated through GitHub Actions using a self-hosted runner.

### Workflow Triggers

The deployment workflow (`.github/workflows/deploy.yml`) runs on:
- Manual trigger via `workflow_dispatch`
- Push to the `master` branch

### Deployment Process

When triggered, the workflow:
1. Checks out the latest code
2. SSHs to the VPS
3. Pulls the latest changes from the master branch
4. Installs/updates npm dependencies
5. Builds the React application
6. Restarts the PM2 processes (or starts them if not running)
7. Saves the PM2 process list

### Manual Deployment

To manually trigger a deployment:

1. Go to the GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to VPS" workflow
4. Click "Run workflow"
5. Select the branch (master)
6. Click "Run workflow"

## Monitoring and Maintenance

### Check Application Status

```bash
# SSH to VPS
ssh root@31.97.129.97

# Check PM2 processes
pm2 status

# View WebSocket server logs
pm2 logs dnd-map-websocket

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart WebSocket server
pm2 restart dnd-map-websocket

# Restart Nginx
sudo systemctl restart nginx

# Restart all PM2 processes
pm2 restart all
```

### Update Application Manually

```bash
cd /var/www/dnd-map-builder
git pull origin master
npm install
npm run build
pm2 restart ecosystem.config.cjs --env production
```

## Environment Variables

The WebSocket server uses the following environment variables (configured in `ecosystem.config.cjs`):

- `NODE_ENV`: Set to `production` for production deployment
- `WS_PORT`: WebSocket server port (default: 3001)

## Troubleshooting

### Build Fails

If the build fails due to ESLint errors:
```bash
# Check for errors locally
npm run build

# Fix any linting issues
# Note: CI=true treats warnings as errors
```

### WebSocket Connection Issues

1. Check if the WebSocket server is running:
   ```bash
   pm2 status
   ```

2. Test WebSocket connectivity:
   ```bash
   curl http://localhost:3001
   ```

3. Check firewall rules:
   ```bash
   sudo ufw status
   # Ensure port 3001 is open or Nginx is properly proxying
   ```

### Permission Issues

Ensure the application directory has proper permissions:
```bash
sudo chown -R www-data:www-data /var/www/dnd-map-builder
# Or for the current user
sudo chown -R $USER:$USER /var/www/dnd-map-builder
```

## Security Considerations

1. **SSH Keys**: Keep SSH keys secure and use strong passphrases
2. **Firewall**: Configure UFW to only allow necessary ports
3. **HTTPS**: Consider setting up SSL/TLS with Let's Encrypt
4. **Updates**: Regularly update Node.js, npm, and system packages
5. **Secrets**: Never commit sensitive data to the repository

## SSL/TLS Setup (Optional but Recommended)

To enable HTTPS with Let's Encrypt:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to obtain and install the SSL certificate. Certbot will automatically update the Nginx configuration.

## Rollback Procedure

If a deployment causes issues:

```bash
# SSH to VPS
ssh root@31.97.129.97
cd /var/www/dnd-map-builder

# View commit history
git log --oneline

# Rollback to previous commit
git reset --hard <commit-hash>

# Rebuild and restart
npm install
npm run build
pm2 restart all
```

## Support

For issues or questions:
- Check the repository issues: https://github.com/myoung09/dnd-map-builder/issues
- Review application logs: `pm2 logs`
- Review web server logs: `/var/log/nginx/`
