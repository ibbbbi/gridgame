#!/bin/bash

# Power Grid Builder - Podman Installation Script
# This script installs Podman and sets up the Power Grid Builder application

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
CONTAINER_NAME="power-grid-builder"
IMAGE_NAME="power-grid-builder:latest"
HOST_PORT="8080"
CONTAINER_PORT="80"

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
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Podman on Ubuntu/Debian
install_podman_debian() {
    print_header "Installing Podman on Ubuntu/Debian..."
    
    # Update package index
    sudo apt-get update
    
    # Install Podman
    sudo apt-get install -y podman
    
    print_success "Podman installed successfully!"
}

# Function to install Podman on CentOS/RHEL/Fedora
install_podman_rhel() {
    print_header "Installing Podman on CentOS/RHEL/Fedora..."
    
    # Install Podman
    sudo yum install -y podman
    
    print_success "Podman installed successfully!"
}

# Function to install Podman on Arch Linux
install_podman_arch() {
    print_header "Installing Podman on Arch Linux..."
    
    # Update package database
    sudo pacman -Sy
    
    # Install Podman
    sudo pacman -S --noconfirm podman
    
    print_success "Podman installed successfully!"
}

# Function to detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo $ID
    elif [ -f /etc/redhat-release ]; then
        echo "rhel"
    elif [ -f /etc/arch-release ]; then
        echo "arch"
    else
        echo "unknown"
    fi
}

# Function to install Podman based on distribution
install_podman() {
    local distro=$(detect_distro)
    
    case $distro in
        ubuntu|debian)
            install_podman_debian
            ;;
        centos|rhel|fedora)
            install_podman_rhel
            ;;
        arch|manjaro)
            install_podman_arch
            ;;
        *)
            print_error "Unsupported Linux distribution: $distro"
            print_status "Please install Podman manually from https://podman.io/getting-started/installation"
            exit 1
            ;;
    esac
}

# Function to setup Podman service
setup_podman_service() {
    print_header "Setting up Podman service..."
    
    # Podman doesn't require a service for rootless operation
    # Enable systemd user service for rootless Podman (optional)
    if systemctl --user list-unit-files | grep -q podman.socket; then
        systemctl --user enable podman.socket
        print_success "Podman user service configured!"
    fi
    
    print_success "Podman is ready to use!"
    print_status "Podman runs rootless by default - no additional setup required"
}

# Function to check if port is available
check_port() {
    if lsof -Pi :$HOST_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $HOST_PORT is already in use!"
        read -p "Do you want to use a different port? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter new port number: " NEW_PORT
            if [[ $NEW_PORT =~ ^[0-9]+$ ]] && [ $NEW_PORT -ge 1024 ] && [ $NEW_PORT -le 65535 ]; then
                HOST_PORT=$NEW_PORT
                print_success "Using port $HOST_PORT"
            else
                print_error "Invalid port number!"
                exit 1
            fi
        else
            print_error "Cannot proceed with port $HOST_PORT in use!"
            exit 1
        fi
    fi
}

# Function to clean up existing containers
cleanup_existing() {
    if podman ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Found existing container '$CONTAINER_NAME'"
        read -p "Do you want to remove it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Stopping and removing existing container..."
            podman stop $CONTAINER_NAME 2>/dev/null || true
            podman rm $CONTAINER_NAME 2>/dev/null || true
            print_success "Existing container removed"
        else
            print_error "Cannot proceed with existing container!"
            exit 1
        fi
    fi
}

# Function to build and run the application
build_and_run() {
    print_header "Building Power Grid Builder application..."
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile not found! Make sure you're in the project directory."
        exit 1
    fi
    
    # Build the Podman image
    print_status "Building Podman image..."
    podman build -t $IMAGE_NAME .
    
    print_success "Podman image built successfully!"
    
    # Run the container
    print_header "Starting Power Grid Builder container..."
    
    podman run -d \
        --name $CONTAINER_NAME \
        -p ${HOST_PORT}:${CONTAINER_PORT} \
        --restart unless-stopped \
        $IMAGE_NAME
    
    print_success "Container started successfully!"
}

# Function to show application info
show_info() {
    echo
    echo -e "${CYAN}🎉 Power Grid Builder Installation Complete!${NC}"
    echo -e "${CYAN}================================================${NC}"
    echo -e "🌐 Application URL: ${GREEN}http://localhost:${HOST_PORT}${NC}"
    echo -e "🐳 Container Name:  ${GREEN}${CONTAINER_NAME}${NC}"
    echo -e "🖼️  Image Name:     ${GREEN}${IMAGE_NAME}${NC}"
    echo -e "🔧 Runtime:        ${GREEN}Podman (rootless)${NC}"
    echo
    echo -e "${YELLOW}Useful Podman Commands:${NC}"
    echo -e "  📊 View logs:        ${BLUE}podman logs ${CONTAINER_NAME}${NC}"
    echo -e "  ⏹️  Stop container:   ${BLUE}podman stop ${CONTAINER_NAME}${NC}"
    echo -e "  ▶️  Start container:  ${BLUE}podman start ${CONTAINER_NAME}${NC}"
    echo -e "  🗑️  Remove container: ${BLUE}podman rm ${CONTAINER_NAME}${NC}"
    echo -e "  🔄 Restart container: ${BLUE}podman restart ${CONTAINER_NAME}${NC}"
    echo
    echo -e "${YELLOW}Podman Benefits:${NC}"
    echo -e "  🔒 Rootless operation (enhanced security)"
    echo -e "  🚫 No daemon required"
    echo -e "  🐳 Docker-compatible commands"
    echo -e "  📊 Systemd integration"
    echo
}

# Main installation function
main() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║            Power Grid Builder - Podman Installer             ║"
    echo "║           A Realistic Power Grid Simulation Game              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check if Podman is installed
    if ! command_exists podman; then
        print_warning "Podman is not installed on this system."
        read -p "Do you want to install Podman? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_podman
            setup_podman_service
        else
            print_error "Podman is required to run this application!"
            exit 1
        fi
    else
        print_success "Podman is already installed!"
    fi
    
    # Check if project files exist
    if [ ! -f "package.json" ] || ! grep -q "power-grid-builder" package.json; then
        print_error "This script must be run from the Power Grid Builder project directory!"
        exit 1
    fi
    
    # Check port availability
    check_port
    
    # Clean up existing containers
    cleanup_existing
    
    # Build and run the application
    build_and_run
    
    # Show application information
    show_info
}

# Handle script interruption
trap 'print_error "Installation interrupted!"; exit 1' INT TERM

# Run main function
main "$@"
