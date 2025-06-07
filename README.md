# European Power Grid Builder

A realistic power grid building and simulation game featuring both classic grid design and **European System Operation Guideline (SO GL) compliance mode**. Built with TypeScript/Vite frontend and Python backend, this game teaches power system fundamentals while incorporating real Continental Europe grid standards and regulations.

## 🌍 European SO GL Mode - NEW!

Experience realistic power grid operations using actual **Continental Europe System Operation Guidelines**:

### European Grid Standards Implementation
- **Frequency Control**: Real 50.000 Hz ± 50 mHz standard range with FCR/FRR activation
- **Voltage Standards**: Continental Europe ranges (0.90-1.118 pu for 110-300kV, 0.90-1.05 pu for 300-400kV)  
- **Reserve Standards**: FCR full activation in 30s at ±200 mHz deviation
- **N-1 Security**: ENTSO-E grid code compliance with 3,000 MW reference incident
- **Real-time Simulation**: 1-second time steps with continuous grid dynamics

### Realistic European Components
- **Nuclear Power Plant**: 1,400 MW capacity with FCR capability
- **Coal Power Plant**: 800 MW capacity with frequency response
- **Gas Power Plant**: 400 MW fast-response units
- **Hydro Power Plant**: 300 MW with excellent FCR characteristics
- **Wind Farm**: 200 MW renewable generation
- **Solar Farm**: 100 MW photovoltaic systems

### European Grid Events
Experience real Continental Europe scenarios:
- **Nuclear Plant Trips**: 1,400 MW sudden loss events
- **HVDC Outages**: 1,000 MW interconnector failures  
- **Wind Power Drops**: 500 MW renewable intermittency
- **Load Surges**: 800 MW demand increases
- **Transmission Outages**: N-1 contingency analysis

### SO GL Compliance Monitoring
- **System States**: Normal/Alert/Emergency classification
- **Frequency Quality**: Real-time deviation monitoring in mHz
- **FCR Availability**: Automatic frequency containment reserve
- **FRR Availability**: Frequency restoration reserve tracking
- **Compliance Scoring**: Performance against ENTSO-E requirements

## 🎮 Game Features

### Classic Mode
- **Grid Components**: Generators, substations, load centers with realistic power ratings
- **Transmission Infrastructure**: High-voltage transmission, distribution, and HVDC lines
- **Network Topologies**: Radial and meshed networks with reliability analysis
- **Advanced Features**: Undo/redo system, component deletion, visual connection indicators

### European SO GL Mode  
- **Realistic Power Plants**: Nuclear (1,400MW), Coal (800MW), Gas (400MW), Hydro (300MW), Wind (200MW), Solar (100MW)
- **Continental Europe Standards**: Actual ENTSO-E frequency, voltage, and reserve requirements
- **Grid Events**: Nuclear trips, HVDC outages, wind drops, and other realistic disturbances
- **Compliance Monitoring**: Real-time SO GL compliance scoring and system state tracking
- **FCR/FRR Simulation**: Automatic frequency control with realistic response times

### Dual Interface Options
1. **Web Interface**: Flask backend with comprehensive European grid API endpoints
2. **TypeScript Frontend**: Vite-based interactive grid builder with dual-mode support

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+** (for European SO GL backend)
- **Node.js 16+** (for TypeScript frontend)
- **Flask 2.0+** and **NumPy** (for simulation engine)

### Quick Start - European Grid Game

**1. Install Python Dependencies:**
```bash
cd py/
pip install -r requirements.txt
```

**2. Start the European Grid Game:**
```bash
python web_app.py
```

**3. Open Your Browser:**
```
http://localhost:5000
```

### Alternative - TypeScript Frontend Only

**1. Install and Run:**
```bash
npm install
npm run dev
```

## 🎯 How to Play

### European SO GL Mode (Recommended)
1. **Toggle European Mode**: Switch from Classic to European SO GL mode
2. **Build Realistic Grid**: Use nuclear, coal, gas, hydro, wind, and solar plants
3. **Monitor Compliance**: Watch frequency deviation, FCR/FRR availability, system state
4. **Handle Grid Events**: Respond to realistic Continental Europe disturbances
5. **Maintain Standards**: Keep within ±50 mHz frequency range, ensure N-1 security
6. **Optimize Performance**: Balance reliability, compliance, and cost efficiency

### Classic Mode
1. **Select Components**: Choose generators, substations, or load centers
2. **Place Components**: Click on grid to place selected components  
3. **Connect with Lines**: Select line types and connect components
4. **Run Simulation**: Analyze grid performance and optimize design

## 📊 European SO GL Standards Reference

### Continental Europe Frequency Standards
- **Nominal Frequency**: 50.000 Hz
- **Standard Range**: ± 50 mHz (49.950 - 50.050 Hz)
- **Alert Limit**: ± 200 mHz steady-state deviation  
- **Emergency Limit**: ± 800 mHz instantaneous deviation
- **FCR Full Activation**: 30 seconds at ±200 mHz
- **FCR Deadband**: 10 mHz
- **Restoration Time**: 15 minutes maximum

### Continental Europe Voltage Standards  
- **110-300 kV Systems**: 0.90 - 1.118 pu (continuous operation)
- **300-400 kV Systems**: 0.90 - 1.05 pu (continuous operation)
- **Voltage Quality**: Maintained within statutory limits

### Reserve Requirements
- **FCR Capacity**: Frequency Containment Reserve for immediate response
- **FRR Capacity**: Frequency Restoration Reserve for system rebalancing  
- **Reference Incident**: 3,000 MW simultaneous loss capability
- **N-1 Security**: System survives largest single contingency

## 🎮 Game Mechanics

### European Mode Economics
- **Starting Budget**: €500,000 (realistic regional grid budget)
- **Nuclear Plant**: €150,000 (1,400 MW with FCR)
- **Coal Plant**: €80,000 (800 MW with frequency response)
- **Gas Plant**: €40,000 (400 MW fast response)
- **Hydro Plant**: €60,000 (300 MW excellent FCR)
- **Wind Farm**: €30,000 (200 MW renewable)
- **Solar Farm**: €15,000 (100 MW PV)

### European Physics Simulation
- **Frequency Control**: Real FCR activation with 10 mHz deadband
- **Voltage Regulation**: Continental Europe statutory ranges
- **Grid Events**: Realistic ENTSO-E disturbance scenarios
- **System States**: Normal/Alert/Emergency classification
- **Compliance Scoring**: Performance against actual SO GL requirements

### Classic Mode Economics  
- **Starting Budget**: $100,000
- **Component Costs**: Generator ($10k), Substation ($5k), Load (Free)
- **Line Costs**: Transmission ($2k/km), Distribution ($1k/km), HVDC ($3k/km)

## 🏗️ Technical Architecture

### Dual Implementation
- **Python Backend**: European grid simulation with SO GL compliance engine
- **TypeScript Frontend**: Interactive grid builder with dual-mode support
- **Flask Web API**: RESTful endpoints for European grid operations
- **Real-time Simulation**: Background threading for continuous grid dynamics
- **High-Performance Computing**: Fortran-accelerated numerical calculations

### European Grid Engine (`py/`)
- **`european_grid_standards.py`**: Complete SO GL standards implementation
- **`european_power_flow_simulator.py`**: Continental Europe AC power flow
- **`european_grid_game.py`**: Realistic grid game with ENTSO-E compliance
- **`web_app.py`**: Flask application with European API endpoints
- **`fortran_interface.py`**: High-performance Fortran integration via f2py

### High-Performance Fortran Backend (`py/fortran/`)
- **`power_flow.f90`**: Optimized Newton-Raphson power flow solver with complex arithmetic
- **`frequency_control.f90`**: European SO GL compliant FCR/FRR algorithms
- **`grid_optimization.f90`**: Economic dispatch, line sizing, and carbon optimization

### Key Python Modules
```python
# European SO GL Standards
from european_grid_standards import EuropeanGridStandards

# Realistic Power Flow Simulation  
from european_power_flow_simulator import EuropeanACPowerFlowSimulator

# Complete Grid Game Engine
from european_grid_game import EuropeanGridGame

# High-Performance Fortran Interface
from fortran_interface import fortran_solver
```

### Fortran Integration Features
- **f2py Compilation**: Automatic Fortran module compilation with Python fallbacks
- **Newton-Raphson Solver**: Optimized power flow calculations with Gaussian elimination
- **European FCR/FRR**: SO GL compliant frequency control with deadband logic
- **Economic Dispatch**: Merit order optimization with European carbon pricing
- **N-1 Contingency**: Fast reliability analysis for grid security assessment
- **System State Detection**: Real-time normal/alert/emergency classification

### Performance Optimization
- **Numerical Acceleration**: Fortran provides 5-10x speedup for mathematical calculations
- **Memory Efficiency**: Fortran column-major arrays for optimal cache utilization
- **Error Handling**: Graceful degradation to Python when Fortran compilation fails
- **Zero Dependencies**: Optional acceleration that doesn't break existing functionality

### API Endpoints
- **`/api/european/status`**: Real-time grid status with SO GL compliance
- **`/api/european/standards`**: Continental Europe standards reference
- **`/api/european/components`**: Available European component types
- **`/api/european/compliance`**: SO GL compliance monitoring
- **`/api/european/start_simulation`**: Start real-time grid simulation

### High-Performance Fortran Integration

The European Power Grid Game leverages optimized Fortran modules for computationally intensive numerical calculations, providing significant performance improvements for large-scale grid simulations.

#### Fortran Modules

**`power_flow.f90` - Newton-Raphson Power Flow Solver**
- Optimized complex arithmetic for AC power calculations
- Gaussian elimination with partial pivoting for linear systems
- European grid parameter calculations with realistic line impedances
- Convergence tolerance: 1e-6 for professional-grade accuracy

**`frequency_control.f90` - European SO GL Frequency Control**
- FCR response with 10 mHz deadband and ±200 mHz full activation
- System state determination (Normal/Alert/Emergency) per ENTSO-E standards
- N-1 contingency analysis with 3,000 MW reference incident capability
- Real-time frequency dynamics simulation with 1-second time steps

**`grid_optimization.f90` - Economic Dispatch & Optimization**
- Merit order economic dispatch following European practices
- Optimal transmission line sizing with safety margins
- Reserve optimization for FCR/FRR allocation per SO GL requirements
- Carbon emission optimization aligned with EU Green Deal targets
- Reliability optimization with redundancy planning

#### Performance Benefits
- **5-10x Speedup**: Numerical calculations accelerated via optimized Fortran
- **Memory Efficiency**: Column-major arrays for optimal cache utilization
- **Scalability**: Handles 200+ bus systems efficiently
- **Professional Accuracy**: Double precision floating-point throughout

#### Graceful Degradation
- **Automatic Fallback**: Python implementations when Fortran compilation fails
- **Zero Dependencies**: Optional acceleration that doesn't break functionality
- **Error Handling**: Comprehensive exception management with informative logging
- **Cross-Platform**: Works on Linux, macOS, and Windows with appropriate compilers

## 📚 Educational Value

### Power System Engineering
- **Frequency Control**: FCR/FRR operation and system balancing
- **Voltage Regulation**: Statutory ranges and power quality
- **N-1 Security**: Contingency analysis and grid reliability
- **Grid Codes**: Real European transmission system requirements
- **Reserve Management**: Automatic and manual frequency restoration
- **Numerical Methods**: Newton-Raphson power flow and optimization algorithms

### European Grid Standards
- **ENTSO-E Compliance**: Actual Continental Europe SO GL implementation
- **System Operation**: Real-time grid management and control
- **Disturbance Handling**: Realistic incident response procedures
- **Grid Integration**: Renewable energy and conventional generation balance
- **Cross-Border Operations**: European interconnected grid principles

### Software Engineering & High-Performance Computing
- **Command Pattern**: Professional undo/redo system implementation
- **Real-time Systems**: Background simulation threading
- **API Design**: RESTful web services for grid operations
- **Type Safety**: TypeScript interfaces and Python dataclasses
- **Modular Architecture**: Separation of concerns and clean code principles
- **Fortran Integration**: f2py for numerical acceleration in scientific computing
- **Performance Optimization**: Mixed-language programming for computational efficiency
- **Error Handling**: Graceful degradation and fallback strategies

Perfect for students in electrical engineering, power systems, renewable energy, grid operations, or anyone wanting to understand how European power grids actually work according to official ENTSO-E standards!

## 🚀 Development & Deployment

### Local Development
```bash
# Python Backend (European SO GL Mode)
cd py/
pip install -r requirements.txt

# Install Fortran compiler for high-performance calculations (optional)
sudo apt-get install gfortran  # Ubuntu/Debian
# or
brew install gcc  # macOS with Homebrew

# Run with Fortran acceleration
python web_app.py

# TypeScript Frontend (Classic Mode)  
npm install
npm run dev
```

### Fortran Setup (Optional Performance Boost)
```bash
# Install dependencies for f2py compilation
pip install numpy>=1.21.0

# Check if gfortran is available
gfortran --version

# The Fortran modules will compile automatically when first used
# If compilation fails, the system gracefully falls back to Python
```

**📖 For detailed Fortran setup instructions, see [FORTRAN_SETUP.md](FORTRAN_SETUP.md)**

### Docker Deployment
```bash
# Build container with European grid simulation
docker build -t european-grid-game .
docker run -p 5000:5000 european-grid-game
```

### Production Build
```bash
# Complete deployment package
chmod +x setup.sh
./setup.sh

# TypeScript build only
npm run build
```

## 📋 Version History

### Version 3.0 - European SO GL Integration 🌍
- ✅ **Continental Europe Standards**: Complete ENTSO-E SO GL implementation
- ✅ **Realistic Power Plants**: Nuclear (1,400MW), Coal (800MW), Gas (400MW), Hydro (300MW), Wind (200MW), Solar (100MW)
- ✅ **FCR/FRR Simulation**: Automatic frequency control with realistic response times
- ✅ **Grid Events Engine**: Nuclear trips, HVDC outages, wind drops, load surges
- ✅ **SO GL Compliance**: Real-time monitoring against European grid codes
- ✅ **System State Classification**: Normal/Alert/Emergency status determination
- ✅ **European Power Flow**: Continental voltage standards and realistic line parameters
- ✅ **Real-time Simulation**: Background threading with 1-second time steps
- ✅ **Flask Web API**: Comprehensive European grid endpoints
- ✅ **Dual-Mode Interface**: Toggle between Classic and European SO GL modes
- ✅ **Fortran Acceleration**: High-performance numerical calculations via f2py
- ✅ **Newton-Raphson Solver**: Optimized power flow with complex arithmetic
- ✅ **Economic Dispatch**: Merit order optimization with European carbon pricing
- ✅ **Performance Boost**: 5-10x speedup for mathematical operations

### Version 2.0 - Grid Node Infrastructure & Professional UX
- ✅ **Multi-Connection Grid Nodes**: Free-placement electrical nodes supporting multiple component connections
- ✅ **Professional Undo/Redo System**: Command pattern with 50-action history and keyboard shortcuts
- ✅ **Enhanced Deletion**: Right-click context menus with confirmation dialogs and full undo support
- ✅ **Visual Connection System**: Dotted lines showing component-to-node relationships
- ✅ **Connection Count Badges**: Visual indicators on nodes showing total connections
- ✅ **HVDC Transmission Lines**: High-voltage DC lines for long-distance power transfer
- ✅ **Detailed Info Panels**: Comprehensive component and node information display

### Version 1.0 - Core Power Grid Simulation
- ✅ Basic power grid components (Generator, Substation, Load)
- ✅ Transmission and distribution lines
- ✅ Radial and meshed network topologies
- ✅ European AC power flow simulation
- ✅ Economic constraints and budget management
- ✅ Real-time performance metrics
- ✅ Canvas-based grid visualization

## 🤝 Contributing

Contributions are welcome! Focus areas:
- Additional European grid scenarios and events
- Enhanced SO GL compliance monitoring
- Renewable energy integration modeling
- Cross-border grid operations
- Improved visualization and UX
- Fortran optimization and numerical algorithm improvements
- Performance benchmarking and profiling
- Extended f2py integration features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 References

- **ENTSO-E System Operation Guidelines**: Official Continental Europe grid codes
- **NC SO GL**: Network Code on System Operation Guideline implementation
- **European Grid Standards**: Real frequency, voltage, and reserve requirements
- **Power System Engineering**: Academic simulation methodologies
- **TypeScript Game Development**: Modern web-based interactive applications

---

**Start building realistic European power grids today and learn how Continental Europe's electrical system actually works! 🌍⚡**
