#!/bin/bash

# Power Grid Builder - RHEL/CentOS/Rocky Linux Installation Script
# Comprehensive installation script for Red Hat Enterprise Linux and derivatives
# Supports RHEL 7, 8, 9 and compatible distributions (CentOS, Rocky Linux, AlmaLinux)

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
RHEL_VERSION=""
PACKAGE_MANAGER=""

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

# Function to detect RHEL version and package manager
detect_rhel_version() {
    if [ -f /etc/redhat-release ]; then
        RHEL_VERSION=$(grep -oE '[0-9]+' /etc/redhat-release | head -1)
        print_status "Detected RHEL/CentOS version: $RHEL_VERSION"
        
        if [ "$RHEL_VERSION" -ge 8 ]; then
            if command_exists dnf; then
                PACKAGE_MANAGER="dnf"
            else
                PACKAGE_MANAGER="yum"
            fi
        else
            PACKAGE_MANAGER="yum"
        fi
        
        print_status "Using package manager: $PACKAGE_MANAGER"
    else
        print_error "This script is designed for RHEL/CentOS systems!"
        exit 1
    fi
}

# Function to check system requirements
check_system_requirements() {
    print_header "Checking system requirements..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. It's recommended to run as a regular user with sudo privileges."
    fi
    
    # Check available disk space (need at least 2GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=2097152  # 2GB in KB
    
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        print_error "Insufficient disk space. Need at least 2GB free space."
        exit 1
    fi
    
    # Check memory (need at least 1GB)
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    if [ "$AVAILABLE_MEMORY" -lt 1024 ]; then
        print_warning "Low available memory (${AVAILABLE_MEMORY}MB). Docker may run slowly."
    fi
    
    print_success "System requirements check passed!"
}

# Function to update system
update_system() {
    print_header "Updating system packages..."
    
    if [ "$PACKAGE_MANAGER" = "dnf" ]; then
        sudo dnf update -y
        sudo dnf install -y curl wget git which lsof
    else
        sudo yum update -y
        sudo yum install -y curl wget git which lsof
    fi
    
    print_success "System updated successfully!"
}

# Function to install Docker on RHEL/CentOS
install_docker_rhel() {
    print_header "Installing Docker on RHEL/CentOS..."
    
    # Remove old Docker installations
    print_status "Removing old Docker installations..."
    if [ "$PACKAGE_MANAGER" = "dnf" ]; then
        sudo dnf remove -y docker \
            docker-client \
            docker-client-latest \
            docker-common \
            docker-latest \
            docker-latest-logrotate \
            docker-logrotate \
            docker-engine \
            podman \
            runc 2>/dev/null || true
    else
        sudo yum remove -y docker \
            docker-client \
            docker-client-latest \
            docker-common \
            docker-latest \
            docker-latest-logrotate \
            docker-logrotate \
            docker-engine 2>/dev/null || true
    fi
    
    # Install required packages
    print_status "Installing required packages..."
    if [ "$PACKAGE_MANAGER" = "dnf" ]; then
        sudo dnf install -y dnf-utils device-mapper-persistent-data lvm2
        
        # Add Docker repository
        sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        
        # Install Docker Engine
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    else
        sudo yum install -y yum-utils device-mapper-persistent-data lvm2
        
        # Add Docker repository
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        
        # Install Docker Engine
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
    
    print_success "Docker installed successfully!"
}

# Function to configure SELinux for Docker
configure_selinux() {
    print_header "Configuring SELinux for Docker..."
    
    # Check if SELinux is enabled
    if command_exists getenforce && [ "$(getenforce)" != "Disabled" ]; then
        print_status "SELinux is enabled. Configuring Docker policies..."
        
        # Install SELinux policy packages
        if [ "$PACKAGE_MANAGER" = "dnf" ]; then
            sudo dnf install -y container-selinux selinux-policy-base
        else
            sudo yum install -y container-selinux selinux-policy-base
        fi
        
        # Set SELinux boolean for Docker
        sudo setsebool -P container_manage_cgroup on 2>/dev/null || true
        
        print_success "SELinux configured for Docker!"
    else
        print_status "SELinux is disabled or not available."
    fi
}

# Function to configure firewall
configure_firewall() {
    print_header "Configuring firewall..."
    
    if command_exists firewall-cmd && systemctl is-active firewalld >/dev/null 2>&1; then
        print_status "Configuring firewalld..."
        
        # Open the application port
        sudo firewall-cmd --permanent --add-port=${HOST_PORT}/tcp
        
        # Add Docker to trusted zone (optional but recommended)
        sudo firewall-cmd --permanent --zone=trusted --add-interface=docker0 2>/dev/null || true
        
        # Reload firewall
        sudo firewall-cmd --reload
        
        print_success "Firewall configured successfully!"
        print_status "Port ${HOST_PORT}/tcp has been opened"
    else
        print_status "Firewalld is not active or not installed."
    fi
}

# Function to setup Docker service
setup_docker_service() {
    print_header "Setting up Docker service..."
    
    # Create docker group if it doesn't exist
    if ! getent group docker > /dev/null 2>&1; then
        sudo groupadd docker
    fi
    
    # Add current user to docker group
    sudo usermod -aG docker "$USER"
    
    # Enable and start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Wait for Docker to start
    print_status "Waiting for Docker service to start..."
    local count=0
    while ! docker info >/dev/null 2>&1 && [ $count -lt 30 ]; do
        sleep 2
        count=$((count + 1))
    done
    
    if docker info >/dev/null 2>&1; then
        print_success "Docker service is running!"
    else
        print_error "Docker service failed to start properly."
        print_status "Checking Docker service status..."
        sudo systemctl status docker --no-pager -l
        exit 1
    fi
    
    print_success "Docker service configured!"
    print_warning "Please log out and log back in for group changes to take effect."
    print_status "Or run: newgrp docker"
}

# Function to install Node.js and npm (for development)
install_nodejs() {
    print_header "Installing Node.js and npm..."
    
    if ! command_exists node; then
        print_status "Installing Node.js..."
        
        # Install NodeSource repository
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        
        if [ "$PACKAGE_MANAGER" = "dnf" ]; then
            sudo dnf install -y nodejs
        else
            sudo yum install -y nodejs
        fi
        
        print_success "Node.js $(node --version) installed!"
        print_success "npm $(npm --version) installed!"
    else
        print_success "Node.js is already installed: $(node --version)"
    fi
}

# Function to check if user is in docker group
user_in_docker_group() {
    groups "$USER" | grep -q '\bdocker\b'
}

# Function to check if port is available
check_port() {
    if lsof -Pi :$HOST_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $HOST_PORT is already in use!"
        
        # Show what's using the port
        local process=$(lsof -Pi :$HOST_PORT -sTCP:LISTEN -t | xargs ps -p 2>/dev/null | tail -n +2)
        if [ -n "$process" ]; then
            print_status "Process using port $HOST_PORT:"
            echo "$process"
        fi
        
        read -p "Do you want to use a different port? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter new port number (1024-65535): " NEW_PORT
            if [[ $NEW_PORT =~ ^[0-9]+$ ]] && [ $NEW_PORT -ge 1024 ] && [ $NEW_PORT -le 65535 ]; then
                HOST_PORT=$NEW_PORT
                print_success "Using port $HOST_PORT"
                
                # Reconfigure firewall for new port
                if command_exists firewall-cmd && systemctl is-active firewalld >/dev/null 2>&1; then
                    sudo firewall-cmd --permanent --add-port=${HOST_PORT}/tcp
                    sudo firewall-cmd --reload
                    print_success "Firewall updated for port $HOST_PORT"
                fi
            else
                print_error "Invalid port number! Must be between 1024 and 65535."
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
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Found existing container '$CONTAINER_NAME'"
        
        # Show container status
        docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        read -p "Do you want to remove it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Stopping and removing existing container..."
            docker stop $CONTAINER_NAME 2>/dev/null || true
            docker rm $CONTAINER_NAME 2>/dev/null || true
            print_success "Existing container removed"
        else
            print_error "Cannot proceed with existing container!"
            exit 1
        fi
    fi
    
    # Clean up orphaned images if requested
    if docker images -f "dangling=true" -q | grep -q .; then
        read -p "Remove unused Docker images? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker image prune -f
            print_success "Unused images removed"
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
    
    # Build the Docker image
    print_status "Building Docker image (this may take a few minutes)..."
    docker build -t $IMAGE_NAME . --progress=plain
    
    print_success "Docker image built successfully!"
    
    # Run the container
    print_header "Starting Power Grid Builder container..."
    
    docker run -d \
        --name $CONTAINER_NAME \
        -p ${HOST_PORT}:${CONTAINER_PORT} \
        --restart unless-stopped \
        --memory="512m" \
        --cpus="1.0" \
        $IMAGE_NAME
    
    print_success "Container started successfully!"
    
    # Wait for container to be ready and check health
    print_status "Waiting for application to start..."
    local count=0
    while [ $count -lt 30 ]; do
        if curl -s "http://localhost:${HOST_PORT}" >/dev/null 2>&1; then
            break
        fi
        sleep 2
        count=$((count + 1))
    done
    
    if curl -s "http://localhost:${HOST_PORT}" >/dev/null 2>&1; then
        print_success "Application is ready!"
    else
        print_warning "Application may still be starting. Check logs with: docker logs ${CONTAINER_NAME}"
    fi
}

# Function to show application info
show_info() {
    echo
    echo -e "${CYAN}🎉 Power Grid Builder Installation Complete!${NC}"
    echo -e "${CYAN}================================================${NC}"
    echo -e "🌐 Application URL: ${GREEN}http://localhost:${HOST_PORT}${NC}"
    echo -e "🌐 External URL:    ${GREEN}http://$(hostname -I | awk '{print $1}'):${HOST_PORT}${NC}"
    echo -e "🐳 Container Name:  ${GREEN}${CONTAINER_NAME}${NC}"
    echo -e "🖼️  Image Name:     ${GREEN}${IMAGE_NAME}${NC}"
    echo -e "💾 RHEL Version:   ${GREEN}$(cat /etc/redhat-release)${NC}"
    echo -e "🐳 Docker Version: ${GREEN}$(docker --version)${NC}"
    echo
    echo -e "${YELLOW}Container Management:${NC}"
    echo -e "  📊 View logs:        ${BLUE}docker logs ${CONTAINER_NAME}${NC}"
    echo -e "  📊 Follow logs:      ${BLUE}docker logs -f ${CONTAINER_NAME}${NC}"
    echo -e "  ⏹️  Stop container:   ${BLUE}docker stop ${CONTAINER_NAME}${NC}"
    echo -e "  ▶️  Start container:  ${BLUE}docker start ${CONTAINER_NAME}${NC}"
    echo -e "  🗑️  Remove container: ${BLUE}docker rm ${CONTAINER_NAME}${NC}"
    echo -e "  🔄 Restart container: ${BLUE}docker restart ${CONTAINER_NAME}${NC}"
    echo -e "  📈 Container stats:  ${BLUE}docker stats ${CONTAINER_NAME}${NC}"
    echo
    echo -e "${YELLOW}System Information:${NC}"
    echo -e "  🔥 Firewall status:  ${BLUE}sudo firewall-cmd --list-ports${NC}"
    echo -e "  🛡️  SELinux status:   ${BLUE}getenforce${NC}"
    echo -e "  🐳 Docker info:      ${BLUE}docker info${NC}"
    echo -e "  💻 System resources: ${BLUE}htop${NC} or ${BLUE}top${NC}"
    echo
    echo -e "${YELLOW}NPM Scripts (if package.json available):${NC}"
    echo -e "  📊 View logs:        ${BLUE}npm run docker:logs${NC}"
    echo -e "  ⏹️  Stop & remove:    ${BLUE}npm run docker:stop${NC}"
    echo -e "  🐳 Using compose:    ${BLUE}npm run docker:compose${NC}"
    echo
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  🔧 Check Docker:     ${BLUE}systemctl status docker${NC}"
    echo -e "  🔧 Docker logs:      ${BLUE}journalctl -u docker.service${NC}"
    echo -e "  🔧 Restart Docker:   ${BLUE}sudo systemctl restart docker${NC}"
    echo
}

# Function to perform post-installation checks
post_install_checks() {
    print_header "Performing post-installation checks..."
    
    # Check Docker service
    if systemctl is-active docker >/dev/null 2>&1; then
        print_success "Docker service is active"
    else
        print_error "Docker service is not active"
    fi
    
    # Check container status
    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_success "Container is running"
    else
        print_warning "Container is not running"
    fi
    
    # Check application response
    if curl -s "http://localhost:${HOST_PORT}" >/dev/null 2>&1; then
        print_success "Application is responding"
    else
        print_warning "Application is not responding yet"
    fi
    
    # Check firewall
    if command_exists firewall-cmd && systemctl is-active firewalld >/dev/null 2>&1; then
        if firewall-cmd --list-ports | grep -q "${HOST_PORT}/tcp"; then
            print_success "Firewall port is open"
        else
            print_warning "Firewall port may not be open"
        fi
    fi
    
    print_success "Post-installation checks completed!"
}

# Main installation function
main() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           Power Grid Builder - RHEL Installation              ║"
    echo "║         Red Hat Enterprise Linux & Compatible Systems         ║"
    echo "║           A Realistic Power Grid Simulation Game              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Detect RHEL version and package manager
    detect_rhel_version
    
    # Check system requirements
    check_system_requirements
    
    # Update system
    read -p "Do you want to update system packages? (recommended) (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        update_system
    fi
    
    # Install Node.js (optional)
    read -p "Do you want to install Node.js for development? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_nodejs
    fi
    
    # Check if Docker is installed
    if ! command_exists docker; then
        print_warning "Docker is not installed on this system."
        read -p "Do you want to install Docker? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker_rhel
            configure_selinux
            setup_docker_service
            configure_firewall
            
            if ! user_in_docker_group; then
                print_warning "You need to log out and log back in for Docker group changes to take effect."
                read -p "Do you want to continue with sudo? (y/n): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_status "Please log out and log back in, then run this script again."
                    exit 0
                fi
            fi
        else
            print_error "Docker is required to run this application!"
            exit 1
        fi
    else
        print_success "Docker is already installed!"
        print_status "Docker version: $(docker --version)"
    fi
    
    # Check if Docker service is running
    if ! systemctl is-active docker >/dev/null 2>&1; then
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
        
        # Try to run with newgrp
        print_status "Attempting to refresh group membership..."
        if command_exists newgrp; then
            exec newgrp docker << EOF
$0 "$@"
EOF
        fi
        exit 1
    fi
    
    print_success "Docker is ready!"
    
    # Check port availability
    check_port
    
    # Clean up existing containers
    cleanup_existing
    
    # Build and run the application
    build_and_run
    
    # Perform post-installation checks
    post_install_checks
    
    # Show application information
    show_info
    
    # Try to open browser (if in desktop environment)
    if [ -n "$DISPLAY" ] && command_exists firefox; then
        print_status "Opening Firefox browser..."
        firefox "http://localhost:${HOST_PORT}" >/dev/null 2>&1 &
    elif [ -n "$DISPLAY" ] && command_exists chromium; then
        print_status "Opening Chromium browser..."
        chromium "http://localhost:${HOST_PORT}" >/dev/null 2>&1 &
    elif [ -n "$DISPLAY" ] && command_exists google-chrome; then
        print_status "Opening Chrome browser..."
        google-chrome "http://localhost:${HOST_PORT}" >/dev/null 2>&1 &
    fi
    
    print_success "Installation completed successfully! 🎉"
    print_status "Access your application at: http://localhost:${HOST_PORT}"
}

# Handle script interruption
trap 'print_error "Installation interrupted!"; exit 1' INT TERM

# Check if script is run from project directory
if [ ! -f "package.json" ] || ! grep -q "power-grid-builder" package.json; then
    print_error "This script must be run from the Power Grid Builder project directory!"
    print_status "Please navigate to the project directory and run: ./install-rhel.sh"
    exit 1
fi

# Run main function
main "$@"
