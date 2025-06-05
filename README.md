# Power Grid Builder

A realistic power grid building and simulation game built with TypeScript and Vite. Design and optimize electrical power networks with radial and meshed topologies.

## Features

### Grid Components
- **Generators**: Power plants that produce electricity (50-150 MW capacity)
- **Substations**: Transform voltage levels and distribute power (200 MW capacity)
- **Load Centers**: Represent electricity demand (20-100 MW demand)

### Transmission Infrastructure
- **Transmission Lines**: High-capacity power lines (300 MW, $2k/km)
- **Distribution Lines**: Lower-capacity local distribution (100 MW, $1k/km)

### Network Topologies
- **Radial Networks**: Simple tree-like structure, lower cost but less reliable
- **Meshed Networks**: Interconnected grid with redundancy, higher reliability

### Realistic Simulation
- Power flow calculations based on network topology
- Voltage drop modeling with line resistance
- Transmission losses and efficiency calculations
- Reliability analysis with redundancy factors
- Economic constraints with budget management

## How to Play

1. **Select Components**: Choose generators, substations, or load centers from the toolbar
2. **Place Components**: Click on the grid to place selected components
3. **Connect with Lines**: Select transmission or distribution lines, then click two components to connect them
4. **Choose Network Type**: Select between radial or meshed network configurations
5. **Run Simulation**: Click "Run Simulation" to analyze your grid's performance
6. **Optimize Design**: Adjust your grid based on efficiency, reliability, and cost metrics

## Controls

### Mouse Controls
- **Left Click**: Place components or select existing ones
- **Line Placement**: Click first component, then second to create a line

### Keyboard Shortcuts
- `G` - Select Generator tool
- `S` - Select Substation tool  
- `L` - Select Load Center tool
- `T` - Select Transmission Line tool
- `D` - Select Distribution Line tool
- `Ctrl+R` - Run Simulation
- `Escape` - Clear tool selection

## Game Mechanics

### Economics
- Starting budget: $100,000
- Component costs: Generator ($10k), Substation ($5k), Load (Free)
- Line costs: Transmission ($2k/km), Distribution ($1k/km)

### Power System Physics
- **Power Flow**: Calculated based on generation capacity and load demand
- **Voltage Levels**: Generator (138kV), Substation (69kV), Load (13.8kV)
- **Transmission Losses**: Based on line resistance and distance
- **Network Reliability**: Radial (85%), Meshed (95%)

### Scoring Metrics
- **Load Served**: Amount of electricity demand successfully supplied (MW)
- **Efficiency**: Percentage of generated power delivered to loads
- **Reliability**: Network's ability to maintain service during failures

## Technical Implementation

### Architecture
- **TypeScript**: Type-safe game logic and simulation
- **Canvas Rendering**: Real-time grid visualization
- **Modular Design**: Separate simulation engine and game interface

### Simulation Engine
- Newton-Raphson inspired power flow calculations
- Network topology analysis for radial vs meshed systems
- Real-time power flow and voltage calculations
- Economic optimization constraints

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

## Docker Deployment

### Quick Start with Docker
```bash
# Build and run with PowerShell script (Windows)
.\build-docker.ps1

# Or build and run with bash script (Linux/Mac)
./build-docker.sh

# Or manually with Docker commands
docker build -t power-grid-builder:latest .
docker run -d --name power-grid-builder -p 8080:80 power-grid-builder:latest
```

### Using Docker Compose
```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down
```

### Docker Commands
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Stop and remove container
npm run docker:stop

# View logs
npm run docker:logs

# Using compose
npm run docker:compose
npm run docker:compose:down
```

### Docker Configuration
- **Base Image**: nginx:alpine (production-ready)
- **Port**: 8080 (host) → 80 (container)
- **Build**: Multi-stage build for optimized image size
- **Features**: Gzip compression, security headers, health checks
- **Access**: http://localhost:8080

## Educational Value

This game teaches:
- Power system fundamentals (generation, transmission, distribution)
- Network topology trade-offs (radial vs meshed)
- Economic optimization in infrastructure planning
- Electrical engineering concepts (power flow, voltage, reliability)
- Systems thinking and complex problem solving

Perfect for students studying electrical engineering, power systems, or anyone interested in understanding how electrical grids work!
