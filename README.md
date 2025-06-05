# Power Grid Builder

A realistic power grid building and simulation game built with TypeScript and Vite. Design and optimize electrical power networks with radial and meshed topologies, featuring advanced grid node infrastructure and professional-grade undo/redo functionality.

## Features

### Grid Components
- **Generators**: Power plants that produce electricity (50-150 MW capacity)
- **Substations**: Transform voltage levels and distribute power (200 MW capacity)
- **Load Centers**: Represent electricity demand (20-100 MW demand)
- **Grid Nodes**: Electrical connection points allowing multiple components to connect to the same electrical node

### Transmission Infrastructure
- **Transmission Lines**: High-capacity power lines (300 MW, $2k/km)
- **Distribution Lines**: Lower-capacity local distribution (100 MW, $1k/km)
- **HVDC Lines**: High-voltage direct current transmission for long distances (500 MW, $3k/km)

### Network Topologies
- **Radial Networks**: Simple tree-like structure, lower cost but less reliable
- **Meshed Networks**: Interconnected grid with redundancy, higher reliability
- **Multi-Connection Nodes**: Advanced grid nodes supporting complex interconnections

### Advanced Features
- **Undo/Redo System**: Professional command pattern implementation with 50-command history
- **Component Deletion**: Right-click context menu for removing components and nodes
- **Visual Connection Indicators**: Dotted lines showing component-to-node connections
- **Connection Count Badges**: Visual indicators showing how many connections each node has
- **Detailed Info Panels**: Comprehensive component and node information display

### Realistic Simulation
- Power flow calculations based on network topology
- Voltage drop modeling with line resistance
- Transmission losses and efficiency calculations
- Reliability analysis with redundancy factors
- Economic constraints with budget management

## How to Play

1. **Select Components**: Choose generators, substations, or load centers from the toolbar
2. **Place Components**: Click on the grid to place selected components
3. **Create Grid Nodes**: Click the "Grid Node (Free)" button and place nodes for multi-connection points
4. **Connect with Lines**: Select transmission, distribution, or HVDC lines, then click two components/nodes to connect them
5. **Choose Network Type**: Select between radial or meshed network configurations
6. **Run Simulation**: Click "Run Simulation" to analyze your grid's performance
7. **Optimize Design**: Adjust your grid based on efficiency, reliability, and cost metrics
8. **Use Undo/Redo**: Ctrl+Z to undo, Ctrl+Y to redo any action

## Controls

### Mouse Controls
- **Left Click**: Place components, select existing ones, or place grid nodes
- **Right Click**: Delete components or grid nodes (with confirmation)
- **Line Placement**: Click first component/node, then second to create a line

### Keyboard Shortcuts
- `G` - Select Generator tool
- `S` - Select Substation tool  
- `L` - Select Load Center tool
- `N` - Select Grid Node tool
- `T` - Select Transmission Line tool
- `D` - Select Distribution Line tool
- `H` - Select HVDC Line tool
- `Ctrl+Z` - Undo last action
- `Ctrl+Y` - Redo last undone action
- `Ctrl+Shift+Z` - Alternative redo shortcut
- `Ctrl+R` - Run Simulation
- `Escape` - Clear tool selection

## User Interface

### Toolbar Sections
- **Power Components**: Generator, Substation, Load Center
- **Grid Infrastructure**: Grid Node (Free placement)
- **Transmission Lines**: Transmission, Distribution, HVDC lines
- **Network Configuration**: Radial/Meshed topology selection

### Action Buttons
- **Run Simulation**: Analyze grid performance and power flow
- **Clear Grid**: Reset entire grid (with confirmation dialog)
- **Undo (Ctrl+Z)**: Reverse last action (disabled when no history)
- **Redo (Ctrl+Y)**: Restore last undone action (disabled when no redo available)

### Information Panel
- Real-time display of selected component/node details
- Connection information and grid node relationships
- Deletion instructions and helpful tips

### Status Indicators
- **Budget**: Current available funds
- **Load Served**: Percentage of demand satisfied
- **Efficiency**: Power delivery efficiency
- **Reliability**: Network reliability score

### Helpful Tips Panel
Built-in usage instructions including:
- Component placement and connection strategies
- Grid node usage for complex topologies
- Keyboard shortcuts and right-click actions
- Undo/redo functionality guide

## Game Mechanics

### Economics
- Starting budget: $100,000
- Component costs: Generator ($10k), Substation ($5k), Load (Free)
- Grid nodes: Free to place
- Line costs: Transmission ($2k/km), Distribution ($1k/km), HVDC ($3k/km)

### Power System Physics
- **Power Flow**: Calculated based on generation capacity and load demand
- **Voltage Levels**: Generator (138kV), Substation (69kV), Load (13.8kV), Grid Nodes (configurable)
- **Transmission Losses**: Based on line resistance and distance
- **Network Reliability**: Radial (85%), Meshed (95%)
- **Multi-Connection Support**: Grid nodes enable complex electrical topologies

### Advanced Grid Features
- **Grid Node Connections**: Components auto-connect to nearby grid nodes
- **Visual Connection Indicators**: Dotted lines show component-to-node relationships
- **Connection Counting**: Nodes display badges showing total connections
- **Command History**: Full undo/redo with 50-action memory
- **Intelligent Deletion**: Prevents deletion of nodes with active connections

### Scoring Metrics
- **Load Served**: Amount of electricity demand successfully supplied (MW)
- **Efficiency**: Percentage of generated power delivered to loads
- **Reliability**: Network's ability to maintain service during failures

## Technical Implementation

### Architecture
- **TypeScript**: Type-safe game logic and simulation with comprehensive interfaces
- **Canvas Rendering**: Real-time grid visualization with advanced graphics
- **Modular Design**: Separate simulation engine and game interface
- **Command Pattern**: Professional undo/redo system with full state management
- **Event-Driven**: Keyboard shortcuts and context menus for enhanced UX

### Advanced Features
- **Grid Node System**: Multi-connection electrical nodes with visual indicators
- **State Management**: Command history with execute/undo operations
- **Real-time Updates**: Dynamic button states and UI feedback
- **Context Menus**: Right-click deletion with confirmation dialogs
- **Visual Enhancements**: Connection badges, dotted lines, and detailed info panels

### Simulation Engine
- Newton-Raphson inspired power flow calculations
- Network topology analysis for radial vs meshed systems
- Real-time power flow and voltage calculations with grid node support
- Economic optimization constraints with comprehensive cost modeling

## Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

## Easy Deployment Package

### Quick Deployment Package Creation

Create a complete deployment package with our automated scripts:

**Linux/macOS:**
```bash
# Create full deployment package
chmod +x deploy.sh
./deploy.sh

# Or using npm
npm run package
```

**Windows (PowerShell):**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\deploy.ps1

# Or using npm  
npm run package:windows
```

#### Deployment Package Features
- 📦 **Complete deployment package** with all necessary files
- 🐳 **Docker image export** for offline deployment
- 🌐 **Static files** ready for any web server
- ☁️ **Cloud platform scripts** (AWS, Azure, GCP, Netlify, Vercel)
- 📖 **Comprehensive documentation** for each deployment method
- 🎯 **Platform-specific installers** included
- 📱 **Multiple archive formats** (zip, tar.gz)
- 🔧 **One-click deployment scripts** for major platforms

#### Deployment Options
```bash
# NPM Scripts for deployment
npm run deploy              # Interactive deployment menu
npm run deploy:full         # Complete package with documentation
npm run deploy:docker       # Docker image only
npm run deploy:static       # Static files for web servers
npm run deploy:cloud        # Cloud platform packages
npm run deploy:all          # Everything (recommended)

# Windows PowerShell equivalents
npm run deploy:windows      # Windows deployment script
npm run package:windows     # Complete Windows package
```

#### What's Included
- **Built application** (optimized and minified)
- **Docker configuration** (Dockerfile, docker-compose.yml)
- **Installation scripts** (Linux, Windows, RHEL-specific)
- **Platform deployment guides** (AWS S3, Azure, GCP, Netlify, Vercel, IIS)
- **Health check scripts** and monitoring tools
- **Comprehensive documentation** for each deployment method
- **Archive packages** ready for distribution

## Docker Deployment

### Quick Installation

#### Automatic Installation (Recommended)
Use our automated installation scripts that handle container runtime installation and application setup:

**Linux/macOS:**
```bash
# Docker/Podman installation (auto-detects preference)
chmod +x install-docker.sh
./install-docker.sh

# Podman-specific installation
chmod +x install-podman.sh
./install-podman.sh

# Or using npm
npm run container:install    # Docker/Podman auto-selection
npm run docker:install      # Docker-specific
npm run podman:install      # Podman-specific
```

**Windows (PowerShell):**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install-docker.ps1

# Or using npm
npm run docker:install:windows
```

#### Installation Script Features
- 🔍 **Auto-detects** your operating system and container runtime preference
- 🐳 **Container Runtime Support**: Both Docker and Podman with automatic selection
- ⚙️ **Smart Installation**: Installs Docker or Podman based on your preference and system
- 🔧 **Configures services** and user permissions automatically
- 🌐 **Port conflict detection** with automatic port selection
- 🧹 **Cleanup existing containers** with user confirmation
- 🎨 **Colored output** and progress indicators
- 📱 **Auto-opens browser** when installation completes
- ❌ **Error handling** with helpful troubleshooting messages
- 🔒 **Podman Benefits**: Rootless operation, no daemon, enhanced security

#### Container Runtime Options

**Docker (Traditional):**
- Full-featured container runtime
- Requires daemon and root privileges
- Extensive ecosystem support
- Docker Compose integration

**Podman (Rootless):**
- Rootless container execution
- No daemon required
- Drop-in Docker replacement
- Enhanced security model
- Systemd integration

#### Manual Installation

#### Manual Installation

### Quick Start with Containers
```bash
# Build and run with PowerShell script (Windows)
.\build-docker.ps1

# Or build and run with bash script (Linux/Mac)
./build-docker.sh

# Docker commands
docker build -t power-grid-builder:latest .
docker run -d --name power-grid-builder -p 8080:80 power-grid-builder:latest

# Podman commands (rootless alternative)
podman build -t power-grid-builder:latest .
podman run -d --name power-grid-builder -p 8080:80 power-grid-builder:latest

# NPM scripts for containers
npm run docker:build       # Build with Docker
npm run docker:run         # Run with Docker
npm run podman:build       # Build with Podman
npm run podman:run         # Run with Podman
```

### Using Docker Compose
```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down
```

### Container Commands
```bash
# Installation scripts
npm run container:install           # Auto-detects Docker/Podman preference
npm run docker:install              # Docker-specific Linux/macOS installer
npm run podman:install              # Podman-specific installer
npm run docker:install:windows      # Windows PowerShell installer

# Docker commands
npm run docker:build                # Build Docker image
npm run docker:run                  # Run Docker container
npm run docker:stop                 # Stop and remove Docker container
npm run docker:logs                 # View Docker container logs
npm run docker:compose              # Start with Docker Compose
npm run docker:compose:down         # Stop Docker Compose

# Podman commands (rootless alternative)
npm run podman:build                # Build Podman image
npm run podman:run                  # Run Podman container
npm run podman:stop                 # Stop and remove Podman container
npm run podman:logs                 # View Podman container logs
```

### Container Configuration
- **Base Image**: nginx:alpine (production-ready)
- **Port**: 8080 (host) → 80 (container)
- **Build**: Multi-stage build for optimized image size
- **Features**: Gzip compression, security headers, health checks
- **Access**: http://localhost:8080
- **Podman Benefits**: Rootless execution, no daemon, enhanced security

## Educational Value

This game teaches:
- Power system fundamentals (generation, transmission, distribution)
- Network topology trade-offs (radial vs meshed)
- Economic optimization in infrastructure planning
- Electrical engineering concepts (power flow, voltage, reliability)
- Systems thinking and complex problem solving
- Grid interconnection strategies and multi-node topologies
- Professional software development patterns (command pattern, state management)
- User experience design (undo/redo, context menus, keyboard shortcuts)

Perfect for students studying electrical engineering, power systems, software engineering, or anyone interested in understanding how electrical grids work and professional application development!

## Changelog

### Version 2.0 - Grid Node Infrastructure & Professional UX
- ✅ **Multi-Connection Grid Nodes**: Free-placement electrical nodes supporting multiple component connections
- ✅ **Professional Undo/Redo System**: Command pattern with 50-action history and keyboard shortcuts
- ✅ **Enhanced Deletion**: Right-click context menus with confirmation dialogs and full undo support
- ✅ **Visual Connection System**: Dotted lines showing component-to-node relationships
- ✅ **Connection Count Badges**: Visual indicators on nodes showing total connections
- ✅ **HVDC Transmission Lines**: High-voltage DC lines for long-distance power transfer
- ✅ **Detailed Info Panels**: Comprehensive component and node information display
- ✅ **Advanced UI Controls**: Button state management, keyboard shortcuts (N for nodes)
- ✅ **Helpful Tips Panel**: Built-in usage instructions and keyboard shortcut guide
- ✅ **Grid Clear Confirmation**: Safety dialog preventing accidental grid deletion

### Version 1.0 - Core Power Grid Simulation
- ✅ Basic power grid components (Generator, Substation, Load)
- ✅ Transmission and distribution lines
- ✅ Radial and meshed network topologies
- ✅ European AC power flow simulation
- ✅ Economic constraints and budget management
- ✅ Real-time performance metrics
- ✅ Canvas-based grid visualization
