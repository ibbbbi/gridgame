#!/bin/bash

# Grid Game Setup Script
# This script handles initial setup and game startup for the Grid Game project

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

# Function to setup Python environment
setup_python() {
    print_status "Setting up Python environment..."
    
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
    pip install -r requirements.txt
    deactivate
    cd ..
    print_success "Python dependencies installed"
}

# Function to start the Python web server
start_python_server() {
    print_status "Starting Python web server..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_success "Starting Python Grid Game server..."
        print_status "The game will be available at http://localhost:5000"
        print_status "Press Ctrl+C to stop the server"
        python3 web_app.py
        deactivate
    else
        print_warning "Virtual environment not found, running without it"
        python3 web_app.py
    fi
    cd ..
}

# Function to run interactive game
run_interactive_game() {
    print_status "Starting interactive Grid Game..."
    
    cd py
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_success "Starting Grid Game CLI..."
        python3 game_init.py interactive
        deactivate
    else
        print_warning "Virtual environment not found, running without it"
        python3 game_init.py interactive
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
    echo "Grid Game Setup Script"
    echo "Usage: ./setup.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     - Complete initial setup (install Python dependencies)"
    echo "  start     - Start Python web server"
    echo "  simulate  - Run grid simulation"
    echo "  game      - Run interactive game"
    echo "  check     - Check system requirements"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup.sh setup      # First time setup"
    echo "  ./setup.sh start      # Start Python web server"
    echo "  ./setup.sh game       # Run interactive CLI game"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    local python_ok=0
    
    check_python_version && python_ok=1
    
    if [ $python_ok -eq 1 ]; then
        print_success "All system requirements met!"
        return 0
    else
        print_error "Python requirements not met. Please install Python 3.8 or higher."
        return 1
    fi
}

# Function to perform complete setup
complete_setup() {
    print_status "Starting complete Grid Game setup..."
    
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
    
    print_success "Setup completed successfully!"
    print_status "You can now run:"
    print_status "  ./setup.sh start     - Start Python web server"
    print_status "  ./setup.sh game      - Run interactive CLI game"
    print_status "  ./setup.sh simulate  - Run grid simulation"
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
