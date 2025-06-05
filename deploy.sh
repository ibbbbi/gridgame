#!/bin/bash

# Power Grid Builder - Comprehensive Deployment Script
# Supports multiple deployment targets: Docker, Static hosting, Cloud platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="power-grid-builder"
VERSION="2.0.0"
BUILD_DIR="dist"
PACKAGE_DIR="deployment-package"
DOCKER_IMAGE="$PROJECT_NAME:$VERSION"
CONTAINER_RUNTIME=""  # Will be set to 'docker' or 'podman'

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect available container runtime
detect_container_runtime() {
    if command_exists docker; then
        CONTAINER_RUNTIME="docker"
        print_success "Docker detected and will be used as container runtime"
    elif command_exists podman; then
        CONTAINER_RUNTIME="podman"
        print_success "Podman detected and will be used as container runtime"
    else
        CONTAINER_RUNTIME=""
        print_warning "No container runtime detected"
    fi
}

# Function to choose container runtime
choose_container_runtime() {
    print_header "Container Runtime Selection"
    
    # Check what's available
    local docker_available=false
    local podman_available=false
    
    if command_exists docker; then
        docker_available=true
    fi
    
    if command_exists podman; then
        podman_available=true
    fi
    
    if [ "$docker_available" = true ] && [ "$podman_available" = true ]; then
        echo -e "${CYAN}Both Docker and Podman are available. Which would you like to use?${NC}"
        echo "1) Docker"
        echo "2) Podman"
        read -p "Enter your choice (1-2): " choice
        
        case $choice in
            1)
                CONTAINER_RUNTIME="docker"
                print_success "Docker selected as container runtime"
                ;;
            2)
                CONTAINER_RUNTIME="podman"
                print_success "Podman selected as container runtime"
                ;;
            *)
                print_warning "Invalid choice. Defaulting to Docker"
                CONTAINER_RUNTIME="docker"
                ;;
        esac
    elif [ "$docker_available" = true ]; then
        CONTAINER_RUNTIME="docker"
        print_success "Docker will be used as container runtime"
    elif [ "$podman_available" = true ]; then
        CONTAINER_RUNTIME="podman"
        print_success "Podman will be used as container runtime"
    else
        print_error "No container runtime found! Please install Docker or Podman first."
        print_status "Run ./install-docker.sh to install a container runtime"
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking deployment prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is required but not installed!"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is required but not installed!"
        exit 1
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found! Make sure you're in the project directory."
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
    print_status "Node.js version: $(node --version)"
    print_status "npm version: $(npm --version)"
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully!"
}

# Function to build the project
build_project() {
    print_header "Building the project..."
    
    # Clean previous build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    # Build the project
    npm run build
    
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build failed! $BUILD_DIR directory not created."
        exit 1
    fi
    
    print_success "Project built successfully!"
    print_status "Build output available in: $BUILD_DIR/"
}

# Function to create deployment package
create_deployment_package() {
    print_header "Creating deployment package..."
    
    # Create package directory
    rm -rf "$PACKAGE_DIR"
    mkdir -p "$PACKAGE_DIR"
    
    # Copy build files
    cp -r "$BUILD_DIR"/* "$PACKAGE_DIR/"
    
    # Copy deployment files
    cp Dockerfile "$PACKAGE_DIR/" 2>/dev/null || true
    cp docker-compose.yml "$PACKAGE_DIR/" 2>/dev/null || true
    cp nginx.conf "$PACKAGE_DIR/" 2>/dev/null || true
    cp healthcheck.sh "$PACKAGE_DIR/" 2>/dev/null || true
    cp install-*.sh "$PACKAGE_DIR/" 2>/dev/null || true
    cp install-*.ps1 "$PACKAGE_DIR/" 2>/dev/null || true
    cp build-*.sh "$PACKAGE_DIR/" 2>/dev/null || true
    cp build-*.ps1 "$PACKAGE_DIR/" 2>/dev/null || true
    
    # Create deployment documentation
    create_deployment_docs
    
    print_success "Deployment package created in: $PACKAGE_DIR/"
}

# Function to create deployment documentation
create_deployment_docs() {
    cat > "$PACKAGE_DIR/DEPLOYMENT.md" << 'EOF'
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
EOF

    # Create simple deployment scripts for different platforms
    create_platform_scripts
}

# Function to create platform-specific deployment scripts
create_platform_scripts() {
    # Netlify deployment
    cat > "$PACKAGE_DIR/deploy-netlify.sh" << 'EOF'
#!/bin/bash
echo "🌐 Deploying to Netlify..."
echo "1. Install Netlify CLI: npm install -g netlify-cli"
echo "2. Login to Netlify: netlify login"
echo "3. Deploy: netlify deploy --prod --dir=."
echo "📖 Or drag and drop this folder to https://app.netlify.com/"
EOF

    # Vercel deployment
    cat > "$PACKAGE_DIR/deploy-vercel.sh" << 'EOF'
#!/bin/bash
echo "▲ Deploying to Vercel..."
echo "1. Install Vercel CLI: npm install -g vercel"
echo "2. Login to Vercel: vercel login"
echo "3. Deploy: vercel --prod"
echo "📖 Or connect GitHub repo at https://vercel.com/"
EOF

    # AWS S3 deployment
    cat > "$PACKAGE_DIR/deploy-s3.sh" << 'EOF'
#!/bin/bash
echo "☁️ Deploying to AWS S3..."
echo "1. Install AWS CLI: pip install awscli"
echo "2. Configure AWS: aws configure"
echo "3. Create bucket: aws s3 mb s3://your-bucket-name"
echo "4. Enable static hosting: aws s3 website s3://your-bucket-name --index-document index.html"
echo "5. Upload files: aws s3 sync . s3://your-bucket-name --delete"
echo "6. Set public read: aws s3api put-bucket-policy --bucket your-bucket-name --policy file://s3-policy.json"
EOF

    # Make scripts executable
    chmod +x "$PACKAGE_DIR"/*.sh 2>/dev/null || true
    
    print_success "Platform deployment scripts created!"
}

# Function to build container image
build_container_image() {
    if [ -z "$CONTAINER_RUNTIME" ]; then
        choose_container_runtime
    fi
    
    if ! command_exists "$CONTAINER_RUNTIME"; then
        print_warning "$CONTAINER_RUNTIME not found. Skipping container image build."
        return
    fi
    
    print_header "Building $CONTAINER_RUNTIME image..."
    
    # Build the image
    $CONTAINER_RUNTIME build -t "$DOCKER_IMAGE" .
    $CONTAINER_RUNTIME tag "$DOCKER_IMAGE" "$PROJECT_NAME:latest"
    
    print_success "$CONTAINER_RUNTIME image built: $DOCKER_IMAGE"
    
    # Create container load script
    local script_name="load-${CONTAINER_RUNTIME}-image.sh"
    cat > "$PACKAGE_DIR/$script_name" << EOF
#!/bin/bash
# Load $CONTAINER_RUNTIME image from file
echo "🐳 Loading $CONTAINER_RUNTIME image..."
if [ -f "power-grid-builder-${VERSION}.tar" ]; then
    $CONTAINER_RUNTIME load < power-grid-builder-${VERSION}.tar
    echo "✅ $CONTAINER_RUNTIME image loaded successfully!"
    echo "🚀 Run with: $CONTAINER_RUNTIME run -d --name power-grid-builder -p 8080:80 --restart unless-stopped $DOCKER_IMAGE"
else
    echo "❌ $CONTAINER_RUNTIME image file not found!"
    echo "💡 Build the image with: $CONTAINER_RUNTIME build -t $DOCKER_IMAGE ."
fi
EOF

    chmod +x "$PACKAGE_DIR/$script_name"
    
    # Also create a generic load script for backwards compatibility
    if [ "$CONTAINER_RUNTIME" = "docker" ]; then
        cp "$PACKAGE_DIR/$script_name" "$PACKAGE_DIR/load-docker-image.sh"
    fi
}

# Function to create archive packages
create_archives() {
    print_header "Creating deployment archives..."
    
    # Create tar.gz archive
    if command_exists tar; then
        tar -czf "${PROJECT_NAME}-${VERSION}-deployment.tar.gz" -C "$PACKAGE_DIR" .
        print_success "Created: ${PROJECT_NAME}-${VERSION}-deployment.tar.gz"
    fi
    
    # Create zip archive
    if command_exists zip; then
        cd "$PACKAGE_DIR"
        zip -r "../${PROJECT_NAME}-${VERSION}-deployment.zip" .
        cd ..
        print_success "Created: ${PROJECT_NAME}-${VERSION}-deployment.zip"
    fi
    
    # Calculate sizes
    if [ -f "${PROJECT_NAME}-${VERSION}-deployment.tar.gz" ]; then
        local size=$(du -h "${PROJECT_NAME}-${VERSION}-deployment.tar.gz" | cut -f1)
        print_status "Archive size (tar.gz): $size"
    fi
    
    if [ -f "${PROJECT_NAME}-${VERSION}-deployment.zip" ]; then
        local size=$(du -h "${PROJECT_NAME}-${VERSION}-deployment.zip" | cut -f1)
        print_status "Archive size (zip): $size"
    fi
}

# Function to save container image
save_container_image() {
    if [ -z "$CONTAINER_RUNTIME" ]; then
        choose_container_runtime
    fi
    
    if ! command_exists "$CONTAINER_RUNTIME" || ! $CONTAINER_RUNTIME image inspect "$DOCKER_IMAGE" >/dev/null 2>&1; then
        print_warning "$CONTAINER_RUNTIME image not available. Skipping image save."
        return
    fi
    
    print_header "Saving $CONTAINER_RUNTIME image..."
    
    # Save container image to file
    $CONTAINER_RUNTIME save "$DOCKER_IMAGE" > "power-grid-builder-${VERSION}.tar"
    
    local size=$(du -h "power-grid-builder-${VERSION}.tar" | cut -f1)
    print_success "$CONTAINER_RUNTIME image saved: power-grid-builder-${VERSION}.tar ($size)"
}

# Function to generate deployment summary
generate_summary() {
    print_header "Deployment Package Summary"
    
    echo -e "${CYAN}📦 Package Contents:${NC}"
    echo -e "  📁 Deployment directory: ${GREEN}$PACKAGE_DIR/${NC}"
    
    if [ -f "${PROJECT_NAME}-${VERSION}-deployment.tar.gz" ]; then
        echo -e "  📦 Compressed package: ${GREEN}${PROJECT_NAME}-${VERSION}-deployment.tar.gz${NC}"
    fi
    
    if [ -f "${PROJECT_NAME}-${VERSION}-deployment.zip" ]; then
        echo -e "  📦 Zip package: ${GREEN}${PROJECT_NAME}-${VERSION}-deployment.zip${NC}"
    fi
    
    if [ -f "power-grid-builder-${VERSION}.tar" ]; then
        echo -e "  🐳 Container image: ${GREEN}power-grid-builder-${VERSION}.tar${NC}"
    fi
    
    echo
    echo -e "${CYAN}🚀 Deployment Options:${NC}"
    echo -e "  🐳 ${BLUE}Docker/Podman:${NC} Use install-docker.sh or docker-compose.yml"
    echo -e "  🌐 ${BLUE}Static hosting:${NC} Upload $PACKAGE_DIR/ contents to any web server"
    echo -e "  ☁️  ${BLUE}Cloud platforms:${NC} Use platform-specific scripts in $PACKAGE_DIR/"
    echo
    echo -e "${CYAN}📖 Documentation:${NC}"
    echo -e "  📄 Deployment guide: ${GREEN}$PACKAGE_DIR/DEPLOYMENT.md${NC}"
    echo -e "  🔧 Installation scripts: ${GREEN}$PACKAGE_DIR/install-*.sh${NC}"
    echo
    echo -e "${GREEN}✅ Deployment package ready!${NC}"
    echo -e "🌐 Quick start: ${BLUE}cd $PACKAGE_DIR && ./install-docker.sh${NC}"
}

# Function to show menu
show_menu() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              Power Grid Builder - Deployment                ║"
    echo "║                  Package Creator v2.0                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo "Please select deployment options:"
    echo
    echo "1) 📦 Full deployment package (recommended)"
    echo "2) 🐳 Docker image only"
    echo "3) 🌐 Static files only"
    echo "4) ☁️  Cloud platform packages"
    echo "5) 🔄 Everything (full package + Docker image)"
    echo "6) ❌ Exit"
    echo
}

# Main deployment function
main() {
    # Check if running in interactive mode
    if [ -t 0 ]; then
        show_menu
        read -p "Enter your choice (1-6): " choice
        echo
    else
        choice="5"  # Default to everything in non-interactive mode
    fi
    
    case $choice in
        1)
            check_prerequisites
            install_dependencies
            build_project
            create_deployment_package
            create_archives
            generate_summary
            ;;
        2)
            check_prerequisites
            install_dependencies
            build_project
            build_container_image
            save_container_image
            ;;
        3)
            check_prerequisites
            install_dependencies
            build_project
            create_deployment_package
            ;;
        4)
            check_prerequisites
            install_dependencies
            build_project
            create_deployment_package
            print_success "Cloud platform scripts available in: $PACKAGE_DIR/"
            ;;
        5)
            check_prerequisites
            install_dependencies
            build_project
            create_deployment_package
            build_container_image
            create_archives
            save_container_image
            generate_summary
            ;;
        6)
            print_status "Deployment cancelled."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'print_error "Deployment interrupted!"; exit 1' INT TERM

# Check if script is run from project directory
if [ ! -f "package.json" ] || ! grep -q "power-grid-builder" package.json; then
    print_error "This script must be run from the Power Grid Builder project directory!"
    exit 1
fi

# Run main function
main "$@"
