# Power Grid Builder - Deployment Guide

This package contains everything needed to deploy Power Grid Builder to various platforms.

## Deployment Options

### 1. Container Deployment (Docker/Podman) - Recommended

#### Quick Start
```bash
# Using installation script (Linux/macOS)
chmod +x install-docker.sh
./install-docker.sh

# Using installation script (Windows PowerShell)
.\install-docker.ps1

# Manual Docker deployment
docker build -t power-grid-builder:latest .
docker run -d --name power-grid-builder -p 8080:80 --restart unless-stopped power-grid-builder:latest

# Manual Podman deployment (rootless)
podman build -t power-grid-builder:latest .
podman run -d --name power-grid-builder -p 8080:80 --restart unless-stopped power-grid-builder:latest
```

#### Docker Compose
```bash
docker-compose up -d
```

### 2. Static Web Hosting

Deploy the contents of this directory to any static web hosting service:

- **Netlify**: Drag and drop this folder to Netlify dashboard
- **Vercel**: Connect GitHub repo or upload folder
- **GitHub Pages**: Push to gh-pages branch
- **AWS S3**: Upload to S3 bucket with static website hosting
- **Google Cloud Storage**: Upload to GCS bucket
- **Azure Static Web Apps**: Deploy via Azure portal

### 3. Traditional Web Server

Upload contents to your web server's document root:

- **Apache**: Copy to `/var/www/html/` or your virtual host directory
- **Nginx**: Copy to `/usr/share/nginx/html/` or your site directory
- **IIS**: Copy to `C:\inetpub\wwwroot\` or your site directory

### 4. Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

#### Railway
```bash
# Connect GitHub repo to Railway dashboard
# Or use Railway CLI:
railway login
railway init
railway up
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

## Configuration

### Environment Variables
- `PORT`: Server port (default: 8080 for Docker, 3000 for development)
- `NODE_ENV`: Environment (production/development)

### Custom Domain
Update any absolute URLs in the built files if deploying to a subdirectory.

## Performance Optimization

The built application includes:
- ✅ **Minified JavaScript and CSS**
- ✅ **Gzip compression** (Docker/nginx)
- ✅ **Browser caching** headers
- ✅ **Optimized images** and assets
- ✅ **Tree-shaken** code bundles

## Security Features

Docker deployment includes:
- ✅ **Security headers** (nginx configuration)
- ✅ **Non-root container** execution
- ✅ **Health checks** for container monitoring
- ✅ **Resource limits** (memory/CPU)

## Monitoring and Maintenance

### Health Checks
```bash
# Docker health check
docker exec power-grid-builder /healthcheck.sh

# Direct HTTP check
curl http://localhost:8080/health || curl http://localhost:8080/
```

### Container Management
```bash
# View logs
docker logs power-grid-builder

# Update application
docker pull power-grid-builder:latest
docker stop power-grid-builder
docker rm power-grid-builder
docker run -d --name power-grid-builder -p 8080:80 --restart unless-stopped power-grid-builder:latest

# Backup container data (if needed)
docker exec power-grid-builder tar czf - /usr/share/nginx/html > backup.tar.gz
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Use different port
   docker run -d --name power-grid-builder -p 8081:80 power-grid-builder:latest
   ```

2. **Container won't start**
   ```bash
   # Check logs
   docker logs power-grid-builder
   
   # Check health
   docker exec power-grid-builder /healthcheck.sh
   ```

3. **Application not loading**
   - Check browser console for errors
   - Verify all static assets are accessible
   - Check server logs for 404 errors

### Support
- 📧 Create an issue on GitHub repository
- 📖 Check the main README.md for detailed documentation
- 🐳 For Docker issues, check Docker logs and system resources

## File Structure

```
deployment-package/
├── index.html              # Main application entry point
├── assets/                 # Built JavaScript, CSS, and assets
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── nginx.conf             # Nginx server configuration
├── healthcheck.sh         # Container health check script
├── install-docker.sh      # Linux/macOS installation script
├── install-docker.ps1     # Windows PowerShell installation script
├── install-rhel.sh        # RHEL/CentOS specific installer
└── DEPLOYMENT.md          # This file
```
