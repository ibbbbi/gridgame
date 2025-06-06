# Grid Game Setup Guide

Welcome to the **Power Grid Builder** game! This guide will help you set up and start playing the grid simulation game.

## 🚀 Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh setup
   ```

2. **Start the game:**
   ```bash
   # For Python web version
   ./setup.sh start
   
   # For interactive CLI game
   ./setup.sh game
   
   # For grid simulation only
   ./setup.sh simulate
   ```

## 📋 Requirements

- **Python** 3.8+ (only requirement)

## 🎮 Game Modes

### 1. Python Web Version
- Web-based interface served by Flask
- Interactive grid building
- Budget management system
- Real-time simulation

**Start:** `./setup.sh start`
**URL:** http://localhost:5000

### 2. Python CLI Version
- Command-line interface
- Interactive grid building
- Budget management
- Component simulation

**Start:** `./setup.sh game` or `cd py && python3 game_init.py`

### 3. Grid Simulation
- Pure simulation mode
- Test grid configurations
- Performance analysis

**Start:** `./setup.sh simulate` or `cd py && python3 grid_simulation.py`

## 🛠️ Setup Commands

| Command | Description |
|---------|-------------|
| `./setup.sh setup` | Complete initial setup |
| `./setup.sh start` | Start Python web server |
| `./setup.sh game` | Start interactive CLI game |
| `./setup.sh simulate` | Run grid simulation |
| `./setup.sh check` | Check system requirements |
| `./setup.sh help` | Show help |

## 🎯 Game Objectives

### Python Web Version
- Build an efficient power grid through web interface
- Manage your $100,000 budget
- Balance generation, transmission, and load
- Maximize your efficiency score

### Python CLI Version
- Build an efficient power grid via command line
- Manage your $100,000 budget
- Balance generation, transmission, and load
- Maximize your efficiency score

## 🏗️ Python Game Components

### Generators
- **Coal Plant:** 500 MW, $50,000 (85% reliable)
- **Gas Plant:** 300 MW, $30,000 (90% reliable)
- **Nuclear Plant:** 1000 MW, $100,000 (95% reliable)
- **Solar Farm:** 100 MW, $15,000 (70% reliable)
- **Wind Farm:** 150 MW, $20,000 (75% reliable)
- **Hydro Plant:** 200 MW, $25,000 (92% reliable)

### Substations
- **Small:** 200 MW, $5,000
- **Medium:** 500 MW, $12,000
- **Large:** 1000 MW, $25,000

### Transmission Lines
- **Distribution:** 50 MW, $1,000/km
- **Transmission:** 300 MW, $2,000/km
- **High Voltage:** 800 MW, $5,000/km
- **Underground:** 200 MW, $8,000/km

## 🎮 Python Game Commands

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
