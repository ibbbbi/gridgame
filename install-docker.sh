#!/bin/bash

# Power Grid Builder - Container Runtime Installation Script
# This script installs Docker or Podman (if needed) and sets up the Power Grid Builder application

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
CONTAINER_RUNTIME=""  # Will be set to 'docker' or 'podman'

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

# Function to check if user is in docker group
user_in_docker_group() {
    groups "$USER" | grep -q '\bdocker\b'
}

# Function to detect available container runtime
detect_container_runtime() {
    if command_exists docker; then
        CONTAINER_RUNTIME="docker"
        print_success "Docker detected and will be used as container runtime"
    elif command_exists podman; then
        CONTAINER_RUNTIME="podman"
        print_success "Podman detected and will be used as container runtime"
    else
        CONTAINER_RUNTIME=""
        print_warning "No container runtime detected"
    fi
}

# Function to choose container runtime
choose_container_runtime() {
    print_header "Container Runtime Selection"
    
    # Check what's available
    local docker_available=false
    local podman_available=false
    
    if command_exists docker; then
        docker_available=true
    fi
    
    if command_exists podman; then
        podman_available=true
    fi
    
    if [ "$docker_available" = true ] && [ "$podman_available" = true ]; then
        echo -e "${CYAN}Both Docker and Podman are available. Which would you like to use?${NC}"
        echo "1) Docker"
        echo "2) Podman"
        read -p "Enter your choice (1-2): " choice
        
        case $choice in
            1)
                CONTAINER_RUNTIME="docker"
                print_success "Docker selected as container runtime"
                ;;
            2)
                CONTAINER_RUNTIME="podman"
                print_success "Podman selected as container runtime"
                ;;
            *)
                print_warning "Invalid choice. Defaulting to Docker"
                CONTAINER_RUNTIME="docker"
                ;;
        esac
    elif [ "$docker_available" = true ]; then
        CONTAINER_RUNTIME="docker"
        print_success "Docker will be used as container runtime"
    elif [ "$podman_available" = true ]; then
        CONTAINER_RUNTIME="podman"
        print_success "Podman will be used as container runtime"
    else
        print_status "No container runtime found. Will install one based on your preference."
        echo -e "${CYAN}Which container runtime would you like to install?${NC}"
        echo "1) Docker"
        echo "2) Podman"
        read -p "Enter your choice (1-2): " choice
        
        case $choice in
            1)
                CONTAINER_RUNTIME="docker"
                print_success "Docker selected for installation"
                ;;
            2)
                CONTAINER_RUNTIME="podman"
                print_success "Podman selected for installation"
                ;;
            *)
                print_warning "Invalid choice. Defaulting to Docker"
                CONTAINER_RUNTIME="docker"
                ;;
        esac
    fi
}

# Function to install Docker on Ubuntu/Debian
install_docker_debian() {
    print_header "Installing Docker on Ubuntu/Debian..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    print_success "Docker installed successfully!"
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

# Function to install Docker on CentOS/RHEL/Fedora
install_docker_rhel() {
    print_header "Installing Docker on CentOS/RHEL/Fedora..."
    
    # Install required packages
    sudo yum install -y yum-utils
    
    # Add Docker repository
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    
    # Install Docker Engine
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    print_success "Docker installed successfully!"
}

# Function to install Podman on CentOS/RHEL/Fedora
install_podman_rhel() {
    print_header "Installing Podman on CentOS/RHEL/Fedora..."
    
    # Install Podman
    sudo yum install -y podman
    
    print_success "Podman installed successfully!"
}

# Function to install Docker on Arch Linux
install_docker_arch() {
    print_header "Installing Docker on Arch Linux..."
    
    # Update package database
    sudo pacman -Sy
    
    # Install Docker
    sudo pacman -S --noconfirm docker docker-compose
    
    print_success "Docker installed successfully!"
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

# Function to install container runtime based on distribution
install_container_runtime() {
    local distro=$(detect_distro)
    
    case $distro in
        ubuntu|debian)
            if [ "$CONTAINER_RUNTIME" = "docker" ]; then
                install_docker_debian
            else
                install_podman_debian
            fi
            ;;
        centos|rhel|fedora)
            if [ "$CONTAINER_RUNTIME" = "docker" ]; then
                install_docker_rhel
            else
                install_podman_rhel
            fi
            ;;
        arch|manjaro)
            if [ "$CONTAINER_RUNTIME" = "docker" ]; then
                install_docker_arch
            else
                install_podman_arch
            fi
            ;;
        *)
            print_error "Unsupported Linux distribution: $distro"
            if [ "$CONTAINER_RUNTIME" = "docker" ]; then
                print_status "Please install Docker manually from https://docs.docker.com/engine/install/"
            else
                print_status "Please install Podman manually from https://podman.io/getting-started/installation"
            fi
            exit 1
            ;;
    esac
}

# Function to setup container runtime service
setup_container_service() {
    print_header "Setting up $CONTAINER_RUNTIME service..."
    
    if [ "$CONTAINER_RUNTIME" = "docker" ]; then
        # Enable and start Docker service
        sudo systemctl enable docker
        sudo systemctl start docker
        
        # Add current user to docker group
        sudo usermod -aG docker "$USER"
        
        print_success "Docker service configured!"
        print_warning "Please log out and log back in for group changes to take effect."
        print_status "Or run: newgrp docker"
    else
        # Podman doesn't require a service for rootless operation
        # Enable systemd user service for rootless Podman (optional)
        if systemctl --user list-unit-files | grep -q podman.socket; then
            systemctl --user enable podman.socket
            print_success "Podman user service configured!"
        fi
        
        print_success "Podman is ready to use!"
        print_status "Podman runs rootless by default - no additional setup required"
    fi
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
    if $CONTAINER_RUNTIME ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Found existing container '$CONTAINER_NAME'"
        read -p "Do you want to remove it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Stopping and removing existing container..."
            $CONTAINER_RUNTIME stop $CONTAINER_NAME 2>/dev/null || true
            $CONTAINER_RUNTIME rm $CONTAINER_NAME 2>/dev/null || true
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
    
    # Build the container image
    print_status "Building $CONTAINER_RUNTIME image..."
    $CONTAINER_RUNTIME build -t $IMAGE_NAME .
    
    print_success "$CONTAINER_RUNTIME image built successfully!"
    
    # Run the container
    print_header "Starting Power Grid Builder container..."
    
    $CONTAINER_RUNTIME run -d \
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
    echo -e "🔧 Runtime:        ${GREEN}${CONTAINER_RUNTIME}${NC}"
    echo
    echo -e "${YELLOW}Useful $CONTAINER_RUNTIME Commands:${NC}"
    echo -e "  📊 View logs:        ${BLUE}$CONTAINER_RUNTIME logs ${CONTAINER_NAME}${NC}"
    echo -e "  ⏹️  Stop container:   ${BLUE}$CONTAINER_RUNTIME stop ${CONTAINER_NAME}${NC}"
    echo -e "  ▶️  Start container:  ${BLUE}$CONTAINER_RUNTIME start ${CONTAINER_NAME}${NC}"
    echo -e "  🗑️  Remove container: ${BLUE}$CONTAINER_RUNTIME rm ${CONTAINER_NAME}${NC}"
    echo -e "  🔄 Restart container: ${BLUE}$CONTAINER_RUNTIME restart ${CONTAINER_NAME}${NC}"
    echo
    if [ "$CONTAINER_RUNTIME" = "docker" ]; then
        echo -e "${YELLOW}Or use npm scripts:${NC}"
        echo -e "  📊 View logs:        ${BLUE}npm run docker:logs${NC}"
        echo -e "  ⏹️  Stop & remove:    ${BLUE}npm run docker:stop${NC}"
        echo -e "  🐳 Using compose:    ${BLUE}npm run docker:compose${NC}"
        echo
    fi
}

# Main installation function
main() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║            Power Grid Builder - Container Installer           ║"
    echo "║           A Realistic Power Grid Simulation Game              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Choose container runtime
    choose_container_runtime
    
    # Check if the chosen container runtime is installed
    if ! command_exists "$CONTAINER_RUNTIME"; then
        print_warning "$CONTAINER_RUNTIME is not installed on this system."
        read -p "Do you want to install $CONTAINER_RUNTIME? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_container_runtime
            setup_container_service
            
            if [ "$CONTAINER_RUNTIME" = "docker" ] && ! user_in_docker_group; then
                print_warning "You need to log out and log back in for Docker group changes to take effect."
                read -p "Do you want to continue with sudo? (y/n): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_status "Please log out and log back in, then run this script again."
                    exit 0
                fi
            fi
        else
            print_error "$CONTAINER_RUNTIME is required to run this application!"
            exit 1
        fi
    else
        print_success "$CONTAINER_RUNTIME is already installed!"
    fi
    
    # Check if Docker service is running
    if ! docker info >/dev/null 2>&1; then
        print_warning "Docker service is not running."
        print_status "Starting Docker service..."
        sudo systemctl start docker
    fi
    
    # Check if user can run Docker commands
    if ! docker info >/dev/null 2>&1; then
        print_error "Cannot run Docker commands. You may need to:"
        print_status "1. Add yourself to the docker group: sudo usermod -aG docker \$USER"
        print_status "2. Log out and log back in"
        print_status "3. Or run this script with sudo"
        exit 1
    fi
    
    print_success "Docker is ready!"
    
    # Check port availability
    check_port
    
    # Clean up existing containers
    cleanup_existing
    
    # Build and run the application
    build_and_run
    
    # Show application information
    show_info
    
    # Wait for container to be ready
    print_status "Waiting for application to start..."
    sleep 5
    
    # Try to open browser (if possible)
    if command_exists xdg-open; then
        print_status "Opening browser..."
        xdg-open "http://localhost:${HOST_PORT}" >/dev/null 2>&1 &
    elif command_exists open; then
        print_status "Opening browser..."
        open "http://localhost:${HOST_PORT}" >/dev/null 2>&1 &
    fi
    
    print_success "Installation completed successfully! 🎉"
}

# Handle script interruption
trap 'print_error "Installation interrupted!"; exit 1' INT TERM

# Check if script is run from project directory
if [ ! -f "package.json" ] || ! grep -q "power-grid-builder" package.json; then
    print_error "This script must be run from the Power Grid Builder project directory!"
    print_status "Please navigate to the project directory and run: ./install-docker.sh"
    exit 1
fi

# Run main function
main "$@"
