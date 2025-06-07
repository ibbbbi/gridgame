# European Power Grid Builder v2.0 Enhanced

A comprehensive, realistic power grid building and simulation game featuring **enhanced European System Operation Guideline (SO GL) compliance mode** with revolutionary **Interactive Whiteboard** technology. This updated version includes advanced real-time monitoring, N-1 contingency analysis, professional-grade European grid standards implementation, and industry-first multi-device whiteboard capabilities for collaborative grid design.

## ✨ Key Features

### 🎨 Interactive Whiteboard System
- **Multi-Device Support**: Seamless operation across desktop, tablet, and smartphone
- **Professional Drawing Tools**: Complete toolkit with pen, shapes, text, and components
- **Touch-Optimized**: Native gesture support with pinch-to-zoom and pan controls
- **Grid Integration**: Real-time conversion between whiteboard designs and simulations
- **Collaboration Ready**: Foundation for future team-based grid planning

### ⚡ European SO GL Compliance
- **Real-Time Monitoring**: Professional-grade frequency and voltage tracking
- **N-1 Security Analysis**: Automated contingency assessment with parallel processing
- **ENTSO-E Standards**: Full Continental Europe grid code implementation
- **Advanced Analytics**: Live compliance scoring and performance metrics
- **Professional Components**: Realistic European power plant specifications

### 🔧 Technical Excellence
- **Dual Architecture**: Python backend with TypeScript frontend
- **WebSocket Integration**: Real-time bidirectional communication
- **Fortran Acceleration**: High-performance numerical calculations
- **Responsive Design**: Modern glassmorphism UI with mobile optimization
- **Data Export**: Comprehensive simulation data and design file management

## 🚀 What's New in v2.0 Enhanced

### 🎨 Interactive Whiteboard - Revolutionary Grid Design
- **Multi-Device Support**: Works seamlessly on desktop, tablet, and smartphone
- **Touch-Optimized Interface**: Native gesture support with pinch-to-zoom and pan
- **Professional Drawing Tools**: Pen, line, rectangle, circle, arrow, and text tools
- **Component Palette**: Drag-and-drop grid components with visual icons
- **Real-time Collaboration Ready**: Foundation for future team design features
- **Import/Export Functionality**: Seamless integration between whiteboard and grid simulation
- **Mobile-First Design**: Responsive interface optimized for touch interactions
- **Advanced Gesture Controls**: Two-finger zoom, pan, and rotation support

### Enhanced European SO GL Mode
- **Real-time Monitoring**: High-frequency data updates (100ms) with professional-grade precision
- **Advanced Compliance Tracking**: Live SO GL compliance scoring with detailed metrics
- **Interactive Frequency Charts**: Real-time frequency deviation visualization with Chart.js
- **N-1 Contingency Analysis**: Automated security assessment with parallel processing
- **System Event Logging**: Real-time event tracking and disturbance analysis
- **Enhanced UI/UX**: Modern glassmorphism design with responsive controls
- **Data Export**: Comprehensive simulation data export for analysis
- **Auto-save Functionality**: Automatic game state preservation
- **WebSocket Integration**: Real-time bidirectional communication for live updates

### Professional Grid Standards
- **Unified Grid Engine**: High-performance calculation engine with Fortran acceleration
- **Continental Europe Standards**: Full ENTSO-E System Operation Guidelines implementation
- **Advanced Power Flow**: Newton-Raphson solver with sparse matrix optimization
- **Reserve Management**: FCR/FRR activation tracking with European specifications
- **Grid Event Simulation**: Realistic disturbance scenarios based on actual incidents

## 📊 European SO GL Standards Implementation

### Real-Time Grid Monitoring
Professional-grade monitoring with Continental Europe standards:

#### Frequency Control
- **Nominal Frequency**: 50.000 Hz (±0.001 Hz precision tracking)
- **Standard Range**: ± 50 mHz operational window
- **FCR Activation**: Automatic response within 30 seconds at ±200 mHz
- **FRR Deployment**: Frequency restoration within 15 minutes
- **Compliance Scoring**: Real-time performance against ENTSO-E requirements

#### System States
- **Normal Operation**: All parameters within standard limits
- **Alert State**: Approaching operational boundaries  
- **Emergency State**: Immediate intervention required
- **Automatic Classification**: Real-time state assessment and alerts

#### Reserve Management
- **FCR Capacity**: Frequency Containment Reserve for primary response
- **FRR Capacity**: Frequency Restoration Reserve for secondary control
- **Reference Incident**: 3,000 MW loss capability (largest credible contingency)
- **N-1 Security**: Continuous assessment of system reliability

### European Component Specifications

| Component Type | Capacity | FCR Capability | FRR Capability | Investment Cost | Voltage Level |
|----------------|----------|----------------|----------------|-----------------|---------------|
| **Nuclear Plant** | 1,400 MW | 50 MW | 200 MW | €150,000 | 400 kV |
| **Coal Plant** | 800 MW | 40 MW | 150 MW | €80,000 | 400 kV |
| **Gas Plant** | 400 MW | 30 MW | 100 MW | €40,000 | 220 kV |
| **Hydro Plant** | 300 MW | 25 MW | 80 MW | €60,000 | 220 kV |
| **Wind Farm** | 200 MW | 0 MW | 20 MW | €30,000 | 110 kV |
| **Solar Farm** | 100 MW | 0 MW | 10 MW | €15,000 | 110 kV |

### Transmission Infrastructure
European-standard grid components:

- **400 kV Lines**: 3,000 MW capacity, €8,000/km construction cost
- **220 kV Lines**: 1,000 MW capacity, €4,000/km construction cost
- **HVDC Lines**: 1,000 MW capacity, €12,000/km (cross-border interconnections)
- **400 kV Substations**: 3,000 MW capacity, €50,000 investment
- **220 kV Substations**: 1,000 MW capacity, €25,000 investment

### Grid Event Scenarios
Realistic disturbances based on Continental Europe incidents:

| Event Type | Magnitude | Annual Probability | Impact Description |
|------------|-----------|-------------------|-------------------|
| **Nuclear Unit Trip** | 1,400 MW | 0.1%/year | Largest single generation loss |
| **Coal Plant Outage** | 800 MW | 0.2%/year | Major thermal unit failure |
| **HVDC Disconnect** | 1,000 MW | 0.5%/year | International interconnector loss |
| **AC Line Trip** | 2,000 MW | 1.0%/year | 400 kV transmission failure |
| **Renewable Drop** | 600 MW | 10%/year | Weather-related output reduction |
| **Load Jump** | 500 MW | 20%/year | Sudden demand increase |

## 🎮 Game Modes

## 🎮 Game Modes

### 1. Classic Mode
Perfect for learning power system fundamentals:
- **Educational Focus**: Introduction to grid concepts and basic operations
- **Traditional Components**: Generators, substations, and load centers
- **Budget Management**: $100,000 starting budget for cost optimization
- **Basic Analytics**: Power flow analysis and reliability assessment
- **Simplified Interface**: Clean, intuitive controls for beginners

### 2. European SO GL Mode (Professional)
Industry-grade grid operation simulation:
- **Professional Standards**: Full ENTSO-E compliance requirements
- **Realistic Components**: European power plant specifications with FCR/FRR
- **Real-Time Operations**: Continuous monitoring and automatic control systems
- **Advanced Analytics**: N-1 security analysis, frequency response evaluation
- **Regulatory Compliance**: Live scoring against Continental Europe grid codes
- **Professional Budget**: €500,000 for realistic European grid investments

## 🚀 Quick Start

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/your-repo/european-power-grid-builder.git
cd european-power-grid-builder

# Run setup script
./setup.sh setup

# Start the web application
./setup.sh start
```

### Access the Game
- **Web Interface**: http://localhost:5000
- **Game Mode**: Toggle between Classic and European SO GL modes
- **Documentation**: Built-in help and tutorials

## 🏗️ System Architecture

### Core Components

#### Backend (Python)
- **`enhanced_web_app.py`**: Main Flask application with WebSocket support
- **`european_grid_standards.py`**: Complete ENTSO-E SO GL implementation  
- **`european_power_flow_simulator.py`**: AC power flow with Newton-Raphson solver
- **`unified_grid_engine.py`**: High-performance calculation engine
- **`websocket_handler.py`**: Real-time communication layer

#### Frontend (JavaScript/TypeScript)
- **`app.js`**: Main application controller with dual-mode support
- **`interactive-whiteboard.js`**: Complete whiteboard implementation (800+ lines)
- **`advanced-renderer.js`**: High-performance graphics engine
- **`websocket-client.js`**: Real-time data synchronization
- **`mobile-touch-handler.js`**: Touch optimization for mobile devices

#### High-Performance Computing
- **`fortran/`**: Fortran acceleration modules for numerical calculations
  - `power_flow.f90`: Optimized Newton-Raphson solver
  - `frequency_control.f90`: European FCR/FRR algorithms
  - `grid_optimization.f90`: Economic dispatch and optimization

### Data Flow
1. **User Interaction**: Web interface or whiteboard input
2. **Real-Time Processing**: WebSocket communication for live updates
3. **Simulation Engine**: Python backend with optional Fortran acceleration
4. **Results Display**: Dynamic charts and professional dashboards
5. **Data Export**: JSON/CSV formats for analysis and sharing

## 📊 Features Overview

### Real-time Monitoring
- **Frequency Tracking**: ±0.001 Hz precision with mHz deviation display
- **System State**: Continuous Normal/Alert/Emergency classification
- **Reserve Status**: Live FCR/FRR activation monitoring
- **Compliance Score**: Real-time SO GL compliance percentage
- **Event Logging**: Comprehensive system event tracking

### Advanced Analytics
- **N-1 Analysis**: Automated contingency security assessment
- **Frequency Charts**: Real-time frequency deviation visualization
- **Voltage Monitoring**: Continental Europe voltage standard compliance
- **Thermal Analysis**: Transmission line and transformer loading
- **Performance Metrics**: Reliability, efficiency, and compliance scoring

### User Interface
- **Mode Toggle**: Seamless switching between Classic and European modes
- **Component Library**: Drag-and-drop European power system components
- **Interactive Canvas**: Zoom, pan, and select grid components
- **Professional Displays**: Real-time dashboards and system status
- **Data Export**: Comprehensive simulation data download

### Educational Value
- **Grid Fundamentals**: Power flow, stability, and reliability concepts
- **European Standards**: Real-world ENTSO-E grid code implementation
- **Professional Tools**: Industry-standard analysis and monitoring
- **Realistic Scenarios**: Based on actual Continental Europe grid events
- **Progressive Learning**: From basic concepts to advanced grid operation

## 🎯 Learning Objectives

### Power System Fundamentals
- AC power flow analysis and load flow calculations
- Grid stability and N-1 security criteria
- Frequency control and reserve management
- Voltage regulation and reactive power control
- Economic dispatch and system optimization

### European Grid Standards
- ENTSO-E System Operation Guidelines compliance
- Continental Europe frequency and voltage standards
- FCR/FRR reserve requirements and activation
- Grid code compliance and performance metrics
- Real-world grid operation procedures

### Professional Skills
- Grid planning and system design
- Real-time monitoring and control
- Contingency analysis and security assessment
- Performance evaluation and optimization
- Regulatory compliance and reporting

### Interactive Design Skills
- **Digital Grid Design**: Modern whiteboard-based planning methodologies
- **Multi-Device Collaboration**: Cross-platform design and review workflows
- **Visual Communication**: Technical drawing and annotation techniques
- **Rapid Prototyping**: Quick concept development and iteration
- **Mobile-First Thinking**: Touch-optimized interface design principles

## 🔧 Configuration & Advanced Settings

### Application Configuration
Key settings for customizing the European Power Grid Builder:

```json
{
  "european_standards": {
    "frequency_nominal": 50.0,
    "frequency_deadband": 0.01,
    "fcr_full_activation": 0.2,
    "frr_activation_time": 900,
    "voltage_levels": [400, 220, 110],
    "n1_reference_incident": 3000
  },
  "whiteboard": {
    "default_tools": ["pen", "line", "rectangle", "circle", "arrow", "text"],
    "grid_settings": {
      "show_grid": true,
      "grid_size": 20,
      "snap_to_grid": true
    },
    "mobile_optimization": {
      "touch_threshold": 44,
      "gesture_sensitivity": 1.0,
      "zoom_limits": {"min": 0.1, "max": 5.0}
    }
  },
  "performance": {
    "enable_fortran": true,
    "parallel_processing": true,
    "websocket_update_rate": 100,
    "autosave_interval": 300
  }
}
```

### API Endpoints
RESTful API for integration and automation:

#### Core Endpoints
- **`GET /api/status`**: Application health and system status
- **`POST /api/simulation/start`**: Initialize grid simulation
- **`GET /api/simulation/results`**: Retrieve simulation data
- **`POST /api/simulation/stop`**: Terminate running simulation

#### European SO GL Endpoints  
- **`GET /api/european/status`**: Real-time grid compliance status
- **`GET /api/european/standards`**: ENTSO-E standards reference
- **`POST /api/european/compliance`**: Trigger compliance assessment
- **`GET /api/european/components`**: Available component library

#### Interactive Whiteboard Endpoints
- **`POST /api/whiteboard/save`**: Save whiteboard design as JSON
- **`GET /api/whiteboard/load/{id}`**: Load saved whiteboard design
- **`POST /api/whiteboard/export`**: Export design to simulation format
- **`POST /api/whiteboard/import`**: Import grid data to whiteboard

#### WebSocket Connections
- **`/ws/realtime`**: Live simulation data streaming
- **`/ws/whiteboard`**: Collaborative whiteboard updates
- **`/ws/compliance`**: European grid compliance monitoring

### Performance Optimization Options
- **Fortran Acceleration**: Enable high-speed numerical calculations
- **Parallel Processing**: Multi-threaded N-1 contingency analysis  
- **WebSocket Frequency**: Adjustable update rates (10-1000ms)
- **Memory Management**: Automatic cleanup and optimization
- **Browser Caching**: Efficient static asset management

## 📚 Documentation & Resources

### Comprehensive Guides
- **[Setup Guide](SETUP_GUIDE.md)**: Complete installation and configuration instructions
- **[API Reference](API_REFERENCE.md)**: Detailed endpoint documentation and examples
- **[European Standards](NC_SO_GL.md)**: ENTSO-E System Operation Guidelines reference
- **[Fortran Setup](FORTRAN_SETUP.md)**: High-performance computing configuration

### Educational Resources
- **Interactive Tutorials**: Built-in step-by-step learning modules
- **Video Demonstrations**: Multi-device whiteboard usage examples
- **Technical Papers**: European grid operation and SO GL compliance
- **Best Practices**: Professional grid design methodologies

### Developer Resources
- **Source Code**: Well-documented TypeScript and Python modules
- **API Examples**: Complete integration examples and use cases  
- **Testing Suite**: Comprehensive unit and integration tests
- **Deployment Guide**: Docker containerization and production setup

## 🤝 Contributing

We welcome contributions to enhance the European Power Grid Builder:

### Development Areas
- **European Standards**: Additional ENTSO-E grid code implementations
- **Visualization**: Enhanced charts, graphs, and interactive displays
- **Mobile Optimization**: Further touch interface improvements
- **Collaboration**: Real-time multi-user whiteboard features
- **Performance**: Optimization and scalability enhancements

### Contribution Process
1. **Fork** the repository on GitHub
2. **Create** a feature branch: `git checkout -b feature/enhancement`
3. **Develop** and test your changes thoroughly
4. **Document** new features and API changes
5. **Submit** a pull request with detailed description

### Code Standards
- **TypeScript**: Strict typing with comprehensive interfaces
- **Python**: PEP 8 compliance with type hints
- **Testing**: Unit tests for all new functionality
- **Documentation**: JSDoc and Sphinx documentation standards

## 📄 License & Legal

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### Educational Use Statement
This software is designed for educational and research purposes, providing:
- Realistic power system modeling and professional-grade simulation tools
- Compliance with actual European grid standards and regulations
- Progressive learning from fundamental concepts to advanced operations
- Practical experience with Continental Europe grid operation procedures

**Important**: While based on realistic standards and scenarios, this is a simulation tool for educational purposes and should not be used for actual grid operations, planning, or regulatory compliance assessment.

## 🔗 External Resources

### European Grid Standards
- **[ENTSO-E System Operation Guidelines](https://www.entsoe.eu/network_codes/sys-ops/)**: Official European grid codes
- **[Continental Europe Grid Standards](https://www.entsoe.eu/data/balancing/frequency/)**: Frequency and balancing data
- **[European Electricity Market](https://www.entsoe.eu/about/inside-entsoe/members/)**: Market structure and participants

### Technical References
- **[Power System Analysis](https://en.wikipedia.org/wiki/Power_flow_study)**: Fundamental concepts and methods
- **[AC Power Flow](https://ieeexplore.ieee.org/document/4112900)**: Newton-Raphson solver techniques
- **[Grid Stability](https://www.cigre.org/)**: International technical committee resources

---

**European Power Grid Builder v2.0** - Professional Power System Education with Revolutionary Interactive Design

*Transforming power grid education through realistic European standards, advanced simulation capabilities, and innovative multi-device whiteboard technology.*

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+** with Flask and NumPy
- **Node.js 16+** (optional, for TypeScript frontend)
- **Modern Web Browser** with HTML5 Canvas support

### Quick Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/european-power-grid-builder.git
cd european-power-grid-builder

# Setup and start (automatic configuration)
./setup.sh setup
./setup.sh start

# Alternative: Manual Python setup
cd py/
pip install -r requirements.txt
python enhanced_web_app.py
```

### Access the Application
- **Web Interface**: http://localhost:5000
- **Interactive Whiteboard**: Click "Whiteboard Mode" in the header
- **European SO GL Mode**: Toggle switch in the main interface

### First Steps
1. **Choose Your Mode**: Classic (educational) or European SO GL (professional)
2. **Try the Whiteboard**: Multi-device grid design with touch support
3. **Build Your Grid**: Add generators, substations, and transmission lines
4. **Monitor Performance**: Real-time frequency and compliance tracking
5. **Export Results**: Save designs and simulation data

## 🎯 How to Play

### European SO GL Mode (Recommended)
1. **Switch to Professional Mode**: Toggle European SO GL mode in the interface
2. **Design with Whiteboard**: Use multi-device touch interface for initial concepts
3. **Build Realistic Grid**: Deploy nuclear, coal, gas, hydro, wind, and solar plants
4. **Monitor Compliance**: Track frequency deviation, FCR/FRR availability, system state
5. **Handle Grid Events**: Respond to realistic Continental Europe disturbances
6. **Maintain Standards**: Keep within ±50 mHz frequency range, ensure N-1 security
7. **Optimize Performance**: Balance reliability, regulatory compliance, and economics

### Classic Mode (Educational)
1. **Select Components**: Choose from generators, substations, and load centers
2. **Place on Grid**: Click on the 8x8 grid to place selected components
3. **Connect with Lines**: Select transmission lines and connect components
4. **Run Simulation**: Analyze power flow and grid performance metrics
5. **Optimize Design**: Iterate based on reliability and cost analysis

### Interactive Whiteboard Workflow
1. **Enter Whiteboard Mode**: Click the whiteboard button in the main toolbar
2. **Multi-Device Design**: Use desktop, tablet, or mobile for grid planning
3. **Professional Tools**: Utilize pen, shapes, text, and component placement
4. **Touch Gestures**: Pinch-to-zoom, pan, and tap for intuitive interaction
5. **Export to Simulation**: Convert whiteboard designs to functional grid models
6. **Iterate and Refine**: Edit designs based on simulation performance results

## 🎮 Game Economics & Mechanics

### European SO GL Mode Economics
Professional-grade regional grid investment simulation:
- **Starting Budget**: €500,000 (realistic regional grid budget)
- **Investment Strategy**: Balance cost, reliability, and regulatory compliance
- **Performance Metrics**: ENTSO-E compliance scoring and grid stability assessment

### Classic Mode Economics
Educational budget management:
- **Starting Budget**: $100,000 for learning fundamentals
- **Component Costs**: Generator ($10k), Substation ($5k), Load (Free)
- **Line Costs**: Transmission ($2k/km), Distribution ($1k/km), HVDC ($3k/km)

### Physics Simulation
- **European Standards**: Real FCR activation with 10 mHz deadband
- **Voltage Regulation**: Continental Europe statutory voltage ranges
- **Grid Events**: Realistic ENTSO-E disturbance scenarios with automatic response
- **System Classification**: Real-time Normal/Alert/Emergency state assessment


