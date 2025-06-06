# Power Grid Builder - Python Edition

A comprehensive power grid building and simulation game with both **Web Interface** and **CLI Interface**. Design and optimize electrical power networks using European standards, featuring advanced AC power flow simulation, multi-connection grid nodes, and professional-grade undo/redo functionality.

## 🚀 **Quick Start**

### Web Interface (Recommended)
**Interactive canvas-based grid builder with modern web interface**

```bash
# Install dependencies
pip install -r requirements.txt

# Start web server
python web_app.py

# Open browser to http://127.0.0.1:5000
```

### CLI Interface (Power Users)
**Command-line interface for scriptable grid building**

```bash
# Install dependencies  
pip install -r requirements.txt

# Start CLI game
python main.py
```

## ✨ **What's New**
- **🌐 Web Interface**: Complete browser-based GUI with interactive canvas
- **🎨 Modern UI**: Responsive design with real-time statistics and visual feedback
- **🔧 REST API**: Full RESTful API for programmatic access
- **📱 Cross-Platform**: Works on desktop and tablet devices
- **⚡ Real-Time**: Live updates and immediate visual feedback

## 🎮 **Core Features**

### Grid Components
- **Generators**: Power plants that produce electricity (50-150 MW capacity, $10,000)
- **Substations**: Transform voltage levels and distribute power (200 MW capacity, $5,000)
- **Load Centers**: Represent electricity demand (20-100 MW demand, Free)
- **Grid Nodes**: Electrical connection points allowing multiple components to connect (Free)

### Transmission Infrastructure
- **Transmission Lines**: High-capacity power lines (300 MW, $1,000/km)
- **Distribution Lines**: Lower-capacity local distribution (100 MW, $500/km)
- **HVDC Lines**: High-voltage direct current transmission (500 MW, $2,000/km)

### Network Topologies
- **Radial Networks**: Simple tree-like structure, lower cost but less reliable
- **Meshed Networks**: Interconnected grid with redundancy, higher reliability
- **Multi-Connection Nodes**: Advanced grid nodes supporting complex interconnections

### Advanced Simulation Features
- **European AC Power Flow**: Newton-Raphson calculations with 50Hz frequency
- **N-1 Contingency Analysis**: System reliability under single component failure
- **Voltage Profile Analysis**: Per-unit voltage magnitudes and angles at each bus
- **Line Loading Analysis**: Thermal limits and loading percentages
- **Economic Optimization**: Budget constraints ($500,000 starting budget)
- **Undo/Redo System**: Professional command pattern with 50-command history

---

## 🌐 **Web Interface Guide**

### Features
- **Interactive Canvas**: Visual grid building with zoom, pan, and real-time feedback
- **Component Configuration**: Modal dialogs for capacity and voltage settings
- **Line Connections**: Click-to-connect interface with visual previews
- **Real-time Statistics**: Live budget, generation, load, and efficiency tracking
- **Simulation Results Panel**: Comprehensive performance analysis and error reporting
- **Responsive Design**: Works on desktop and tablet devices

### How to Use Web Interface

1. **Start the Web Server**
   ```bash
   python web_app.py
   ```
   
2. **Open Browser**: Navigate to `http://127.0.0.1:5000`

3. **Build Your Grid**:
   - **Select Components**: Click toolbar buttons (Generator, Substation, Load, Node)
   - **Place Components**: Click on canvas, configure in modal dialog
   - **Connect Lines**: Select line type, click start component, then end component
   - **View Statistics**: Real-time updates in header bar

4. **Run Simulation**: Click "Simulate" button to analyze grid performance

5. **Manage Grid**: Use Undo/Redo/Reset buttons for grid management

### Web Interface Controls
- **Left Click**: Place components or select for connections
- **Mouse Wheel**: Zoom in/out on canvas
- **Drag**: Pan around large grids
- **Tool Selection**: Component and line tools in left toolbar
- **Coordinate Display**: Mouse position shown in overlay

### Web API Endpoints
- `GET /api/game/status` - Current game statistics
- `GET /api/game/components` - All grid components
- `GET /api/game/lines` - All transmission lines
- `POST /api/game/place-component` - Place new component
- `POST /api/game/place-line` - Create line connection
- `POST /api/game/simulate` - Run grid simulation
- `POST /api/game/undo` / `POST /api/game/redo` - Command history
- `POST /api/game/reset` - Reset entire grid

---

## 💻 **CLI Interface Guide**

### CLI Commands Reference

#### Component Placement
- `gen <x> <y> [capacity]` - Place generator at position (x, y)
- `sub <x> <y> [capacity]` - Place substation at position (x, y)
- `load <x> <y> [capacity]` - Place load center at position (x, y)
- `node <x> <y> [voltage]` - Place grid node at position (x, y)

#### Line Connections
- `trans <from_id> <to_id>` - Connect with transmission line
- `dist <from_id> <to_id>` - Connect with distribution line
- `hvdc <from_id> <to_id>` - Connect with HVDC line

#### Network Configuration
- `radial` - Set network type to radial
- `meshed` - Set network type to meshed

#### Simulation & Analysis
- `sim` - Run complete power flow simulation
- `stats` - Show current grid statistics
- `clear` - Clear entire grid (with confirmation)

#### Information & Management
- `list` - List all components, nodes, and lines
- `info <id>` - Show detailed information for component/node
- `help` - Show all available commands
- `undo` - Undo last action (50-command history)
- `redo` - Redo last undone action
- `quit` / `exit` - Exit the game

### CLI Example Session

```bash
# Start the CLI game
python main.py

# Build a simple grid
>>> gen 100 100 120        # 120MW generator at (100,100)
>>> sub 200 100 200        # 200MW substation at (200,100)  
>>> load 300 100 80        # 80MW load at (300,100)

# Connect with transmission lines
>>> trans generator_1 substation_1
>>> dist substation_1 load_1

# Run simulation and check results
>>> sim
>>> stats

# Use grid nodes for complex topologies
>>> node 150 200 110       # 110kV grid node
>>> trans generator_1 node_1
>>> dist node_1 load_1

# Manage grid
>>> undo                   # Undo last action
>>> list                   # Show all components
>>> clear                  # Clear entire grid
```

---

## 🔧 **Technical Implementation**

## 🔧 **Technical Architecture**

### Project Structure
```
py/
├── web_app.py                           # Flask web application & REST API
├── main.py                              # CLI interface entry point
├── power_grid_game.py                   # Core game logic & state management
├── european_power_flow_simulator.py     # AC power flow simulation engine
├── grid_types.py                        # Data structures & type definitions
├── requirements.txt                     # Python dependencies
├── templates/
│   └── index.html                       # Web interface HTML template
└── static/
    ├── css/style.css                    # Modern responsive CSS styling
    └── js/app.js                        # Interactive JavaScript application
```

### Core Technologies
- **Backend**: Flask REST API with JSON responses
- **Frontend**: HTML5 Canvas + Pure JavaScript (no frameworks required)
- **Simulation**: NumPy-based AC power flow calculations
- **Architecture**: Command pattern with modular design
- **Standards**: European power system standards (50Hz, EU voltage levels)

### Key Design Patterns
- **Command Pattern**: Professional undo/redo system with state management
- **Modular Architecture**: Separate concerns (game logic, simulation, UI)
- **RESTful API**: Clean separation between frontend and backend
- **Type Safety**: Comprehensive type hints throughout codebase
- **European Standards**: Real-world power system modeling

### Simulation Engine Features
- **Newton-Raphson Power Flow**: Realistic AC power calculations
- **N-1 Contingency Analysis**: System reliability testing
- **European Grid Standards**: 50Hz frequency, ±5% voltage tolerance
- **Multi-Bus Analysis**: Support for complex grid topologies
- **Economic Modeling**: Realistic component costs and budget constraints

---

## 📚 **Game Mechanics & Learning**

### Economic System
- **Starting Budget**: $500,000 (increased for educational flexibility)
- **Component Costs**: 
  - Generator: $10,000 (adjustable 50-150 MW capacity)
  - Substation: $5,000 (200 MW capacity)
  - Load Center: Free (20-100 MW demand)
  - Grid Nodes: Free (configurable voltage levels)
- **Line Costs**: Distance-based pricing
  - Transmission: $1,000 per km
  - Distribution: $500 per km  
  - HVDC: $2,000 per km

### Power System Physics
- **Voltage Levels**: European standard levels (400kV, 220kV, 110kV, 50kV, 20kV, 10kV)
- **Frequency**: 50Hz European standard
- **Voltage Tolerance**: ±5% (0.95-1.05 per unit)
- **Power Flow**: AC calculations with complex impedance
- **Transmission Losses**: Realistic line resistance modeling
- **Reliability**: Network topology dependent (Radial: 85%, Meshed: 95%)

### Educational Objectives
This game teaches essential concepts in:

**Electrical Engineering**:
- Power system fundamentals (generation, transmission, distribution)
- AC power flow analysis and voltage regulation
- Network topology trade-offs and reliability analysis
- European grid standards and operational practices

**Systems Engineering**:
- Complex system design and optimization
- Economic constraints in infrastructure planning
- Trade-offs between cost, reliability, and performance
- Multi-objective decision making under constraints

**Software Engineering**:
- Command pattern implementation and state management
- Modular architecture with separation of concerns
- RESTful API design and web interface development
- Type-safe programming with comprehensive documentation

---

## 🚀 **Getting Started**

### Prerequisites
- **Python 3.7+ with pip** package manager
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **4GB+ RAM** recommended for large grid simulations

### Installation & Setup
```bash
# Clone or download the project
cd /path/to/power-grid-builder/py

# Install all dependencies
pip install -r requirements.txt

# Run web interface (recommended)
python web_app.py
# Open browser to http://127.0.0.1:5000

# Or run CLI interface
python main.py
```

### What's Included
- **Flask Web Application** (`web_app.py`) with REST API
- **Interactive Web Interface** (HTML5 Canvas + JavaScript)
- **CLI Interface** (`main.py`) for command-line users
- **Power Flow Simulator** with European standards
- **Professional Undo/Redo System** (50-command history)
- **Modern Responsive Design** with real-time updates

### Dependencies
```bash
# Core dependencies (requirements.txt)
flask>=2.0.0
numpy>=1.20.0
```

### Development Setup
```bash
# Run with debug mode
FLASK_DEBUG=1 python web_app.py

# Run tests (if available)
python -m pytest tests/
```

### Production Deployment
```bash
# Use production WSGI server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 web_app:app

# Or use Docker/Podman (if containerfile available)
podman build -t power-grid-builder .
podman run -p 5000:5000 power-grid-builder
```

---

## 🎯 **Usage Examples**

### Example 1: Simple Radial Grid (Web Interface)
1. Open `http://127.0.0.1:5000` in browser
2. Click "Generator" tool, click on canvas, set 100MW capacity
3. Click "Substation" tool, place it 200 pixels right of generator
4. Click "Load" tool, place it 200 pixels right of substation
5. Click "Transmission Line" tool, connect generator to substation
6. Click "Distribution Line" tool, connect substation to load
7. Click "Simulate" to analyze performance

### Example 2: Complex Meshed Grid (CLI)
```bash
# Create multiple generators and loads
>>> gen 100 100 120
>>> gen 300 100 150  
>>> sub 200 200 200
>>> load 100 300 80
>>> load 300 300 90

# Create grid node for interconnection
>>> node 200 100 220

# Build meshed topology
>>> trans generator_1 node_1
>>> trans generator_2 node_1
>>> trans node_1 substation_1
>>> dist substation_1 load_1
>>> dist substation_1 load_2

# Switch to meshed network and simulate
>>> meshed
>>> sim
>>> stats
```

### Example 3: HVDC Long-Distance Transmission
```bash
# Long-distance power transfer scenario
>>> gen 0 0 200        # Large coastal wind farm
>>> node 500 0 400     # Long-distance connection point
>>> sub 1000 0 200     # Remote city substation
>>> load 1000 100 150  # City load center

# Use HVDC for long-distance efficiency
>>> hvdc generator_1 node_1
>>> trans node_1 substation_1
>>> dist substation_1 load_1

>>> sim  # Analyze long-distance transmission efficiency
```

---

## 🔍 **Troubleshooting**

### Common Issues

**Web Interface won't start**:
```bash
# Check if Flask is installed
pip install flask

# Check if port 5000 is available
netstat -tulpn | grep 5000

# Try different port
python web_app.py  # Modify port in code if needed
```

**CLI commands not working**:
- Ensure correct syntax: `gen 100 100` (space-separated coordinates)
- Check component IDs: Use `list` command to see available IDs
- Verify budget: Use `stats` to check remaining budget

**Simulation errors**:
- Ensure network is connected (no isolated components)
- Check for at least one generator and one load
- Verify all lines have valid endpoints
- Use `info <id>` to debug specific components

**Performance issues**:
- Reduce grid complexity for better performance
- Use smaller coordinate values (< 1000) for efficiency
- Clear browser cache if web interface is slow

### Error Messages
- `"Network is not fully connected"`: Add lines to connect all components
- `"No generators found"`: Place at least one generator
- `"Insufficient budget"`: Check costs with `help` command
- `"Component not found"`: Use `list` to see valid component IDs

---

## 📈 **Performance & Limitations**

### Recommended Grid Sizes
- **Web Interface**: Up to 50 components with smooth performance
- **CLI Interface**: Up to 100+ components (limited by terminal display)
- **Simulation Engine**: Handles 200+ bus systems efficiently

### System Requirements
- **Memory**: 2GB+ RAM for large grids (>50 components)
- **CPU**: Modern CPU recommended for real-time simulations
- **Browser**: Chrome/Firefox for best web interface performance
- **Network**: Local deployment only (no remote database)

### Known Limitations
- **Single-user**: No multi-player or concurrent sessions
- **In-memory storage**: Grid resets when application restarts
- **Simplified physics**: Educational model, not production-grade simulation
- **Static topology**: No dynamic reconfiguration during simulation

---

## 🤝 **Contributing**

### Development Guidelines
- Follow PEP 8 Python style guidelines
- Use type hints for all function signatures
- Add docstrings for public methods and classes
- Test both web and CLI interfaces for changes
- Maintain European power system standards

### Future Enhancement Ideas
- **Database persistence**: Save/load grid configurations
- **Advanced visualization**: 3D grid rendering, animated power flows
- **Economic analysis**: Time-series economic optimization
- **Weather modeling**: Renewable generation variability
- **Multi-user support**: Collaborative grid design
- **Export capabilities**: Grid data export to industry formats

---

## 📄 **License & Credits**

### Educational Use
This software is designed for educational purposes to teach power system concepts, electrical engineering principles, and software development practices. It implements realistic power system physics while maintaining accessibility for learning.

### Technical Credits
- **Power Flow Algorithms**: Based on Newton-Raphson power flow methods
- **European Standards**: ENTSO-E grid codes and operational practices  
- **Web Interface**: Modern responsive design with HTML5 Canvas
- **Software Architecture**: Professional software engineering patterns

Perfect for electrical engineering students, power system professionals, software developers, and anyone interested in understanding how electrical grids work!
