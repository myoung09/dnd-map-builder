# VPS Initial Setup Checklist

This checklist should be completed on the VPS (31.97.129.97) before the first automated deployment.

## Prerequisites Installation

### 1. Update System
```bash
ssh root@31.97.129.97
apt update && apt upgrade -y
```

### 2. Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version  # Should show v18.x
npm --version
```

### 3. Install PM2
```bash
npm install -g pm2
pm2 --version
```

### 4. Install Git
```bash
apt-get install -y git
git --version
```

### 5. Install Nginx
```bash
apt-get install -y nginx
systemctl status nginx
```

## Application Setup

### 6. Create Application Directory
```bash
mkdir -p /var/www/dnd-map-builder
cd /var/www/dnd-map-builder
```

### 7. Clone Repository
```bash
# Using SSH (recommended)
git clone git@github.com:myoung09/dnd-map-builder.git .

# OR using HTTPS
git clone https://github.com/myoung09/dnd-map-builder.git .

# Set to master branch
git checkout master
```

### 8. Set up SSH Key for Git (if using SSH)
```bash
ssh-keygen -t ed25519 -C "vps@31.97.129.97"
cat ~/.ssh/id_ed25519.pub
# Add this public key to GitHub repository deploy keys
```

### 9. Create Logs Directory
```bash
mkdir -p /var/www/dnd-map-builder/logs
```

### 10. Install Dependencies and Build
```bash
cd /var/www/dnd-map-builder
npm install
npm run build
```

### 11. Test WebSocket Server
```bash
node server/websocket-server.js
# Should show: [WebSocket] Server running on port 3001
# Press Ctrl+C to stop
```

### 12. Start with PM2
```bash
pm2 start ecosystem.config.cjs --env production
pm2 status  # Should show dnd-map-websocket running
pm2 save
pm2 startup  # Follow the instructions to enable PM2 on boot
```

### 13. Configure Nginx
```bash
# Copy the template
cp /var/www/dnd-map-builder/nginx.conf.template /etc/nginx/sites-available/dnd-map-builder

# Edit the server_name if needed
nano /etc/nginx/sites-available/dnd-map-builder

# Enable the site
ln -s /etc/nginx/sites-available/dnd-map-builder /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 14. Configure Firewall (if using UFW)
```bash
ufw allow 'Nginx Full'
ufw allow 'OpenSSH'
ufw enable
ufw status
```

### 15. Test the Application
```bash
# Test web server
curl http://localhost

# Test WebSocket server
curl http://localhost:3001
# Should return: WebSocket Server Running

# Test from external
curl http://31.97.129.97
```

## Optional: SSL/TLS with Let's Encrypt

### 16. Install Certbot
```bash
apt-get install -y certbot python3-certbot-nginx
```

### 17. Obtain SSL Certificate
```bash
# Replace your-domain.com with your actual domain
certbot --nginx -d your-domain.com

# Test auto-renewal
certbot renew --dry-run
```

## Verification Checklist

- [ ] Node.js installed and working
- [ ] PM2 installed globally
- [ ] Git installed and repository cloned
- [ ] Application built successfully
- [ ] Logs directory created
- [ ] PM2 process running (check with `pm2 status`)
- [ ] Nginx installed and configured
- [ ] Nginx serving the application (test with curl or browser)
- [ ] WebSocket server accessible
- [ ] Firewall configured (if applicable)
- [ ] SSL/TLS configured (optional but recommended)

## Post-Setup

After completing this checklist, the GitHub Actions workflow should work automatically when code is pushed to the master branch or manually triggered.

## Monitoring Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dnd-map-websocket

# Check Nginx status
systemctl status nginx

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop  # or top
```

## Troubleshooting

If the automated deployment fails, check:
1. SSH key has proper permissions on the self-hosted runner
2. VPS can be reached from the runner
3. Git can pull from the repository (check SSH keys or credentials)
4. Node modules install without errors
5. Build completes successfully
6. PM2 can restart the process

Review the deployment workflow logs in GitHub Actions for detailed error messages.
