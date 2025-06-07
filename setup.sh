#!/bin/bash

# European Power Grid Builder v2.0 Enhanced Setup Script
# Advanced power system simulation with U/Q Control and Blackstart Capability
# This script handles installation, setup, and application startup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Python version
check_python_version() {
    if command_exists python3; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        local major_version=$(echo $python_version | cut -d'.' -f1)
        local minor_version=$(echo $python_version | cut -d'.' -f2)
        if [ "$major_version" -eq 3 ] && [ "$minor_version" -ge 8 ]; then
            print_success "Python version $python_version is compatible"
            return 0
        else
            print_warning "Python version $python_version detected. Recommended: 3.8 or higher"
            return 1
        fi
    else
        print_error "Python3 not found"
        return 1
    fi
}

# Function to check Fortran compiler
check_fortran_compiler() {
    if command_exists gfortran; then
        print_success "Fortran compiler (gfortran) found"
        return 0
    else
        print_warning "Fortran compiler not found - advanced numerical features disabled"
        print_status "To enable U/Q Control and Blackstart features, install gfortran:"
        print_status "  Ubuntu/Debian: sudo apt-get install gfortran"
        print_status "  macOS: brew install gcc"
        print_status "  RHEL/CentOS: sudo yum install gcc-gfortran"
        return 1
    fi
}

# Function to compile Fortran modules
compile_fortran() {
    print_status "Compiling Fortran acceleration modules..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    if python3 compile_fortran.py; then
        print_success "Fortran modules compiled successfully"
        print_status "U/Q Control and Blackstart features enabled"
    else
        print_warning "Fortran compilation failed - falling back to Python implementation"
    fi
    
    if [ -d "venv" ]; then
        deactivate
    fi
    cd ..
}

# Function to setup Python environment
setup_python() {
    print_status "Setting up Python environment for European Power Grid Builder..."
    
    if [ ! -f "py/requirements.txt" ]; then
        print_error "py/requirements.txt not found"
        return 1
    fi
    
    # Check if virtual environment exists
    if [ ! -d "py/venv" ]; then
        print_status "Creating Python virtual environment..."
        cd py
        python3 -m venv venv
        cd ..
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment and install dependencies
    print_status "Installing Python dependencies..."
    cd py
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Install additional dependencies for enhanced features
    print_status "Installing additional dependencies for U/Q Control and Blackstart..."
    pip install scipy matplotlib seaborn
    
    deactivate
    cd ..
    print_success "Python dependencies installed"
    
    # Compile Fortran modules if compiler is available
    if check_fortran_compiler; then
        compile_fortran
    fi
}

# Function to start the Python web server
start_python_server() {
    print_status "Starting European Power Grid Builder web server..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_success "Starting Enhanced Power Grid Builder server..."
        print_status "✨ Features enabled:"
        print_status "  🔧 European SO GL compliance mode"
        print_status "  🎨 Interactive whiteboard with multi-device support"
        print_status "  🔋 U/Q Control (Voltage/Reactive Power)"
        print_status "  ⚫ Blackstart Capability & System Restoration"
        print_status ""
        print_status "🌐 Access the application at: http://localhost:5000"
        print_status "📱 Mobile-optimized interface available"
        print_status "🔧 API Documentation: http://localhost:5000/api/docs"
        print_status ""
        print_status "Press Ctrl+C to stop the server"
        python3 enhanced_web_app.py
        deactivate
    else
        print_warning "Virtual environment not found, running without it"
        python3 enhanced_web_app.py
    fi
    cd ..
}

# Function to run interactive game
run_interactive_game() {
    print_status "Starting interactive European Power Grid Builder..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_success "Starting Enhanced Grid Game CLI..."
        python3 european_grid_game.py
        deactivate
    else
        print_warning "Virtual environment not found, running without it"
        python3 european_grid_game.py
    fi
    cd ..
}

# Function to run U/Q control tests
test_uq_control() {
    print_status "Testing U/Q Control (Voltage/Reactive Power) features..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_status "Running U/Q Control validation tests..."
        python3 -c "
from fortran_interface import test_uq_control
from european_power_flow_simulator import EuropeanPowerFlowSimulator
import numpy as np

print('Testing U/Q Control Features:')
print('1. AVR System Response')
print('2. Voltage Sensitivity Analysis')
print('3. European Voltage Standards Compliance')
print('4. Reactive Power Optimization')

simulator = EuropeanPowerFlowSimulator()
result = simulator.test_uq_functionality()
print(f'U/Q Control Test Result: {result}')
"
        deactivate
    else
        print_warning "Virtual environment not found"
        return 1
    fi
    cd ..
}

# Function to run blackstart capability tests
test_blackstart() {
    print_status "Testing Blackstart Capability & System Restoration features..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_status "Running Blackstart validation tests..."
        python3 -c "
from fortran_interface import test_blackstart_capability
from european_grid_standards import EuropeanGridStandards

print('Testing Blackstart Features:')
print('1. European Standard Compliance (≥10% LFC area)')
print('2. Restoration Sequence Optimization')
print('3. Generator Priority System')
print('4. Load Pickup Scheduling')

standards = EuropeanGridStandards()
result = standards.test_blackstart_compliance()
print(f'Blackstart Test Result: {result}')
"
        deactivate
    else
        print_warning "Virtual environment not found"
        return 1
    fi
    cd ..
}

# Function to run grid simulation
run_simulation() {
    print_status "Running grid simulation..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
        python3 grid_simulation.py
        deactivate
    else
        python3 grid_simulation.py
    fi
    cd ..
}

# Function to show help
show_help() {
    echo "European Power Grid Builder v2.0 Enhanced Setup Script"
    echo "Advanced power system simulation with U/Q Control and Blackstart features"
    echo ""
    echo "Usage: ./setup.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup        - Complete initial setup (install dependencies, compile Fortran)"
    echo "  start        - Start enhanced web server with all features"
    echo "  simulate     - Run European grid simulation"
    echo "  game         - Run interactive European grid game"
    echo "  test-uq      - Test U/Q Control (Voltage/Reactive Power) features"
    echo "  test-blackstart - Test Blackstart Capability features"
    echo "  compile      - Compile Fortran acceleration modules"
    echo "  check        - Check system requirements and feature availability"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup.sh setup           # First time setup with all features"
    echo "  ./setup.sh start           # Start enhanced web application"
    echo "  ./setup.sh test-uq         # Validate U/Q Control functionality"
    echo "  ./setup.sh test-blackstart # Validate Blackstart features"
    echo "  ./setup.sh compile         # Recompile Fortran modules"
    echo ""
    echo "Features:"
    echo "  🔧 European SO GL compliance mode"
    echo "  🎨 Interactive whiteboard (multi-device)"
    echo "  🔋 U/Q Control (Voltage/Reactive Power)"
    echo "  ⚫ Blackstart Capability & System Restoration"
    echo "  ⚡ Fortran-accelerated numerical calculations"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements for European Power Grid Builder..."
    
    local python_ok=0
    local fortran_ok=0
    
    check_python_version && python_ok=1
    check_fortran_compiler && fortran_ok=1
    
    print_status ""
    print_status "Feature Availability:"
    if [ $python_ok -eq 1 ]; then
        print_success "✅ Core Features: European SO GL mode, Interactive Whiteboard"
    else
        print_error "❌ Core Features: Python 3.8+ required"
    fi
    
    if [ $fortran_ok -eq 1 ]; then
        print_success "✅ Advanced Features: U/Q Control, Blackstart, Fortran acceleration"
    else
        print_warning "⚠️  Advanced Features: Fortran compiler needed for optimal performance"
    fi
    
    if [ $python_ok -eq 1 ]; then
        print_success "System ready for European Power Grid Builder!"
        return 0
    else
        print_error "Please install Python 3.8 or higher to continue."
        return 1
    fi
}

# Function to perform complete setup
complete_setup() {
    print_status "Starting complete European Power Grid Builder v2.0 setup..."
    
    # Check requirements first
    if ! check_requirements; then
        print_error "System requirements not met. Please install Python 3.8 or higher."
        exit 1
    fi
    
    # Setup Python
    if ! setup_python; then
        print_error "Python setup failed"
        exit 1
    fi
    
    print_success "🎉 European Power Grid Builder v2.0 Enhanced setup completed!"
    print_status ""
    print_status "Available commands:"
    print_status "  ./setup.sh start           - Start enhanced web application"
    print_status "  ./setup.sh game             - Run interactive European grid game"
    print_status "  ./setup.sh test-uq          - Test U/Q Control features"
    print_status "  ./setup.sh test-blackstart  - Test Blackstart capabilities"
    print_status ""
    print_status "🌐 Web Interface: http://localhost:5000"
    print_status "📖 Documentation: See README.md and included guides"
}

# Main script logic
case "${1:-setup}" in
    "setup")
        complete_setup
        ;;
    "start")
        start_python_server
        ;;
    "game")
        run_interactive_game
        ;;
    "simulate")
        run_simulation
        ;;
    "test-uq")
        test_uq_control
        ;;
    "test-blackstart")
        test_blackstart
        ;;
    "compile")
        if check_fortran_compiler; then
            compile_fortran
        else
            print_error "Fortran compiler not available"
            exit 1
        fi
        ;;
    "check")
        check_requirements
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
