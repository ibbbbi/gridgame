# European Power Grid Builder v2.0 - Setup Guide

Welcome to the **European Power Grid Builder v2.0**! This enhanced version features advanced real-time monitoring, professional European SO GL compliance, and comprehensive grid analysis tools.

## 🚀 Quick Start

### 1. Automatic Setup
```bash
# Complete setup with dependencies
./setup.sh setup

# Start the enhanced web application
./setup.sh start

# Access at: http://localhost:5000
```

### 2. Manual Setup (Advanced Users)
```bash
# Install Python dependencies
cd py && pip3 install -r requirements.txt

# Optional: Setup Fortran acceleration
# See FORTRAN_SETUP.md for details

# Start web server
python3 web_app.py
```

## 📋 System Requirements

### Minimum Requirements
- **Python**: 3.8+ (only requirement for basic functionality)
- **Memory**: 2 GB RAM for standard operation
- **Storage**: 100 MB for application files
- **Browser**: Modern browser with JavaScript enabled

### Recommended for Enhanced Features
- **Python**: 3.9+ with NumPy, SciPy for advanced calculations
- **Memory**: 4 GB RAM for large grid simulations
- **CPU**: Multi-core processor for parallel N-1 analysis
- **Optional**: Fortran compiler for high-performance calculations

### Optional High-Performance Features
```bash
# Install scientific computing libraries
pip3 install numpy scipy matplotlib

# Enable Fortran acceleration (optional)
# See FORTRAN_SETUP.md for detailed instructions
```

## 🎮 Game Modes & Features

### 1. Enhanced Web Application (Recommended)
**New v2.0 Features:**
- **Real-time Monitoring**: Live frequency, voltage, and compliance tracking
- **European SO GL Mode**: Professional grid standards implementation
- **Interactive Analytics**: N-1 analysis, frequency charts, compliance reports
- **Advanced UI**: Modern interface with real-time dashboards
- **Data Export**: Comprehensive simulation data download

**Start Command:**
```bash
./setup.sh start
```

**Access:** http://localhost:5000

**Key Features:**
- Toggle between Classic and European SO GL modes
- Real-time frequency monitoring with ±0.001 Hz precision
- Live system state classification (Normal/Alert/Emergency)
- Interactive N-1 contingency analysis
- Professional compliance scoring and reporting
- Auto-save functionality with game state preservation

### 2. Command Line Interface
**Enhanced Python CLI Version:**
```bash
./setup.sh game
# or
cd py && python3 game_init.py
```

**Features:**
- Interactive grid building via command line
- European component library with realistic specifications
- Budget management with €500,000 starting budget
- Enhanced simulation with European standards
- Performance metrics and compliance scoring

### 3. Advanced Grid Simulation
**High-Performance Simulation Engine:**
```bash
./setup.sh simulate
# or
cd py && python3 grid_simulation.py
```

**Features:**
- Pure simulation mode for grid analysis
- Unified grid engine with Fortran acceleration
- Large-scale grid support (1000+ buses)
- Parallel N-1 contingency analysis
- European standards compliance testing

## 🛠️ Setup Commands Reference

| Command | Description | Features |
|---------|-------------|----------|
| `./setup.sh setup` | Complete initial setup | Installs dependencies, configures environment |
| `./setup.sh start` | **Start enhanced web server** | **v2.0 features, real-time monitoring** |
| `./setup.sh game` | Start interactive CLI game | Enhanced European components |
| `./setup.sh simulate` | Run advanced grid simulation | High-performance analysis |
| `./setup.sh check` | Check system and requirements | Verify installation |
| `./setup.sh help` | Show detailed help | All available options |

## 🌍 European SO GL Mode (New in v2.0)

### Enhanced Features
- **Real-time Operation**: Continuous monitoring with 100ms updates
- **ENTSO-E Compliance**: Full System Operation Guidelines implementation
- **Professional Analytics**: Industry-standard analysis tools
- **Interactive Visualization**: Live charts and dashboards
- **Advanced Reporting**: Comprehensive compliance and performance reports

### European Component Library
| Component | Capacity | FCR Reserve | FRR Reserve | Cost | Voltage |
|-----------|----------|-------------|-------------|------|---------|
| **Nuclear Plant** | 1,400 MW | 50 MW | 200 MW | €80,000 | 400 kV |
| **Coal Plant** | 800 MW | 40 MW | 150 MW | €40,000 | 400 kV |
| **Gas Plant** | 400 MW | 30 MW | 100 MW | €25,000 | 220 kV |
| **Hydro Plant** | 300 MW | 25 MW | 80 MW | €30,000 | 220 kV |
| **Wind Farm** | 200 MW | 0 MW | 20 MW | €20,000 | 110 kV |
| **Solar Farm** | 100 MW | 0 MW | 10 MW | €15,000 | 110 kV |

### Grid Standards Implementation
- **Frequency Control**: 50.000 Hz ± 50 mHz normal operation
- **System States**: Automatic Normal/Alert/Emergency classification
- **Reserve Management**: FCR activation within 30 seconds
- **N-1 Security**: Continental Europe 3,000 MW reference incident
- **Voltage Standards**: European voltage level compliance (400kV, 220kV, 110kV)

## 🎯 Learning Objectives & Game Goals

### v2.0 Enhanced Objectives

#### Classic Mode Goals
- **Budget Management**: Efficiently use $100,000 starting budget
- **Grid Design**: Create reliable radial and meshed networks
- **Load Balance**: Match generation capacity with demand
- **Economic Optimization**: Maximize efficiency score
- **Reliability**: Achieve high system reliability metrics

#### European SO GL Mode Goals
- **Compliance**: Maintain >95% SO GL compliance score
- **Frequency Control**: Keep frequency within ±50 mHz range
- **N-1 Security**: Pass all contingency analysis tests
- **Reserve Management**: Maintain adequate FCR/FRR reserves
- **System Operation**: Handle realistic grid events professionally
- **Budget**: Optimize €500,000 European grid investment

### Professional Skills Development
- **Real-time Monitoring**: Grid operation and control room skills
- **Standards Compliance**: European grid code implementation
- **Contingency Analysis**: Security assessment and planning
- **Performance Optimization**: Efficiency and reliability improvement
- **Event Management**: Grid disturbance response and recovery

## 🔧 Advanced Configuration

### Performance Optimization
```bash
# Enable high-performance features
export GRID_FORTRAN_ACCELERATION=1
export GRID_PARALLEL_PROCESSING=1
export GRID_LARGE_GRID_SUPPORT=1

# Start with enhanced performance
./setup.sh start
```

### European Standards Configuration
The game includes configurable European standards in `py/european_grid_standards.py`:

```python
# Frequency control parameters
FREQUENCY_NOMINAL = 50.0  # Hz
FREQUENCY_DEADBAND = 0.05  # Hz (±50 mHz)
FCR_FULL_ACTIVATION = 0.2  # Hz (±200 mHz)
FRR_ACTIVATION_TIME = 900  # seconds (15 minutes)

# Voltage standards per ENTSO-E
VOLTAGE_LEVELS = {
    400: {"min": 0.90, "max": 1.05},  # 400 kV systems
    220: {"min": 0.90, "max": 1.10},  # 220 kV systems  
    110: {"min": 0.90, "max": 1.10}   # 110 kV systems
}
```

### Real-time Monitoring Settings
- **Update Frequency**: 100ms for real-time data, 1s for status updates
- **Data Retention**: 300 points (5 minutes) of frequency history
- **Auto-save Interval**: 30 seconds for game state preservation
- **Compliance Monitoring**: Continuous SO GL compliance evaluation

## 🚨 Troubleshooting

### Common Issues & Solutions

#### Web Server Won't Start
```bash
# Check Python installation
python3 --version

# Verify dependencies
cd py && pip3 install -r requirements.txt

# Check port availability (default: 5000)
netstat -an | grep 5000

# Try alternative port
python3 web_app.py --port 8080
```

#### Performance Issues
```bash
# Check system resources
free -h  # Memory usage
top      # CPU usage

# Enable performance optimizations
./setup.sh setup --performance

# Use CLI mode for resource-constrained systems
./setup.sh game
```

#### European Mode Not Loading
```bash
# Verify European game files
ls py/european_*.py

# Check for missing dependencies
python3 -c "import numpy, scipy"

# Reset to classic mode if needed
rm -f ~/.gridgame_european_state
```

### Performance Optimization Tips
1. **Close unnecessary browser tabs** when using web mode
2. **Use CLI mode** on systems with limited memory
3. **Enable Fortran acceleration** for large grids (see FORTRAN_SETUP.md)
4. **Adjust real-time update frequency** in browser settings
5. **Export data regularly** to avoid memory buildup

## 📊 Monitoring & Debugging

### System Status Checks
```bash
# Check game engine status
curl http://localhost:5000/api/game/status

# European mode status
curl http://localhost:5000/api/european/realtime

# Performance monitoring
curl http://localhost:5000/api/european/compliance-report
```

### Debug Mode
```bash
# Start with verbose logging
export FLASK_ENV=development
export GRID_DEBUG=1
./setup.sh start
```

### Log Analysis
- **Web server logs**: Check console output for Flask messages
- **Game logs**: Monitor system log panel in European mode
- **Performance logs**: Browser developer tools for frontend issues
- **Compliance logs**: Built-in SO GL compliance tracking

## 🎓 Educational Usage

### Classroom Setup
1. **Instructor Setup**: Install on central server or individual machines
2. **Student Access**: Provide web interface URL (http://server:5000)
3. **Learning Progression**: Start with Classic mode, advance to European SO GL
4. **Performance Tracking**: Use compliance scores and efficiency metrics
5. **Data Analysis**: Export simulation data for additional analysis

### Learning Sequence
1. **Basic Concepts**: Classic mode grid building and power flow
2. **European Standards**: Introduction to ENTSO-E requirements
3. **Real-time Operation**: European SO GL mode monitoring
4. **Advanced Analysis**: N-1 contingency assessment
5. **Professional Skills**: Compliance reporting and optimization

---

**European Power Grid Builder v2.0** - Professional Power System Education with Enhanced Real-time European Standards

For additional support, see the comprehensive [README.md](README.md) and [European Standards Guide](NC_SO_GL.md).

```bash
# Interactive mode commands
add generator 1        # Add first generator
add substation 2       # Add second substation
add load 1            # Add first load center
line 2 15             # Add transmission line (15 km)
budget                # Check remaining budget
simulate              # Run simulation
quit                  # Exit game
```

## 🎯 Scoring System (Python)

- **Capacity Score:** 10 points per MW
- **Efficiency Bonus:** 50 points per MW/$1000 spent
- **Diversity Bonus:** 100 points per component type
- **Budget Bonus:** 500 points × (remaining budget %)

## 🏆 Performance Ratings

- **5000+ points:** 🏆 Outstanding Power Engineer
- **3000+ points:** 🥈 Excellent Grid Builder
- **1500+ points:** 🥉 Good System Operator
- **500+ points:** 📚 Apprentice Engineer
- **<500 points:** 🔧 Trainee Operator

## 🔧 Troubleshooting

### Setup Issues
```bash
# Check requirements
./setup.sh check

# Clean install
rm -rf node_modules py/venv
./setup.sh setup
```

### Python Issues
```bash
# Manually create virtual environment
cd py
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force
npm install
```

## 📁 Project Structure

```
gridgame/
├── setup.sh                 # Main setup script
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
├── py/                      # Python game version
│   ├── game_init.py         # Game initializer
│   ├── grid_simulation.py   # Core simulation
│   ├── requirements.txt     # Python dependencies
│   └── ...
└── src/                     # TypeScript game version
    ├── main.ts
    ├── game/
    └── ...
```

## 🤝 Support

If you encounter any issues:

1. Run `./setup.sh check` to verify requirements
2. Check the terminal output for error messages
3. Ensure all dependencies are installed
4. Try running setup again: `./setup.sh setup`

## 🎉 Enjoy the Game!

Start building your power grid and become the ultimate Grid Game champion! 🏆

---

*Last updated: June 2025*
