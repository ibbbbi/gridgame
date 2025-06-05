# Power Grid Builder - Docker Installation Script (Windows PowerShell)
# This script installs Docker Desktop (if needed) and sets up the Power Grid Builder application

param(
    [switch]$SkipDockerInstall,
    [int]$Port = 8080
)

# Configuration
$CONTAINER_NAME = "power-grid-builder"
$IMAGE_NAME = "power-grid-builder:latest"
$HOST_PORT = $Port
$CONTAINER_PORT = 80

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Header {
    param($Message)
    Write-Host "🔧 $Message" -ForegroundColor Magenta
}

# Function to check if command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to check if port is available
function Test-Port {
    param($Port)
    $listener = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
    return $listener | Where-Object { $_.Port -eq $Port }
}

# Function to download and install Docker Desktop
function Install-DockerDesktop {
    Write-Header "Installing Docker Desktop for Windows..."
    
    $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"
    
    try {
        Write-Status "Downloading Docker Desktop installer..."
        Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller -UseBasicParsing
        
        Write-Status "Running Docker Desktop installer..."
        Write-Warning "Please follow the installation wizard and restart your computer when prompted."
        Start-Process -FilePath $dockerInstaller -Wait
        
        Write-Success "Docker Desktop installation completed!"
        Write-Warning "Please restart your computer and run this script again."
        
        # Clean up installer
        Remove-Item $dockerInstaller -Force -ErrorAction SilentlyContinue
        
        Read-Host "Press Enter to exit"
        exit 0
    }
    catch {
        Write-Error "Failed to download or install Docker Desktop: $($_.Exception.Message)"
        Write-Status "Please download and install Docker Desktop manually from: https://www.docker.com/products/docker-desktop"
        exit 1
    }
}

# Function to wait for Docker to be ready
function Wait-ForDocker {
    Write-Status "Waiting for Docker to be ready..."
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        try {
            docker info | Out-Null
            Write-Success "Docker is ready!"
            return $true
        }
        catch {
            if ($attempt -eq $maxAttempts) {
                Write-Error "Docker is not responding after $maxAttempts attempts."
                Write-Status "Please ensure Docker Desktop is running and try again."
                return $false
            }
            Write-Status "Docker not ready yet... (attempt $attempt/$maxAttempts)"
            Start-Sleep -Seconds 2
        }
    } while ($attempt -lt $maxAttempts)
    
    return $false
}

# Function to cleanup existing containers
function Remove-ExistingContainer {
    try {
        $existingContainer = docker ps -a --format "table {{.Names}}" | Select-String "^$CONTAINER_NAME$"
        if ($existingContainer) {
            Write-Status "Found existing container '$CONTAINER_NAME'"
            $response = Read-Host "Do you want to remove it? (y/n)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Write-Status "Stopping and removing existing container..."
                docker stop $CONTAINER_NAME 2>$null
                docker rm $CONTAINER_NAME 2>$null
                Write-Success "Existing container removed"
            }
            else {
                Write-Error "Cannot proceed with existing container!"
                exit 1
            }
        }
    }
    catch {
        # Container doesn't exist, continue
    }
}

# Function to build and run the application
function Build-AndRun {
    Write-Header "Building Power Grid Builder application..."
    
    # Check if Dockerfile exists
    if (-not (Test-Path "Dockerfile")) {
        Write-Error "Dockerfile not found! Make sure you're in the project directory."
        exit 1
    }
    
    # Build the Docker image
    Write-Status "Building Docker image..."
    try {
        docker build -t $IMAGE_NAME .
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        Write-Success "Docker image built successfully!"
    }
    catch {
        Write-Error "Failed to build Docker image: $($_.Exception.Message)"
        exit 1
    }
    
    # Run the container
    Write-Header "Starting Power Grid Builder container..."
    
    try {
        docker run -d --name $CONTAINER_NAME -p "${HOST_PORT}:${CONTAINER_PORT}" --restart unless-stopped $IMAGE_NAME
        if ($LASTEXITCODE -ne 0) {
            throw "Docker run failed"
        }
        Write-Success "Container started successfully!"
    }
    catch {
        Write-Error "Failed to start container: $($_.Exception.Message)"
        exit 1
    }
}

# Function to show application info
function Show-Info {
    Write-Host ""
    Write-Host "🎉 Power Grid Builder Installation Complete!" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "🌐 Application URL: " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:$HOST_PORT" -ForegroundColor Green
    Write-Host "🐳 Container Name:  " -NoNewline -ForegroundColor White
    Write-Host "$CONTAINER_NAME" -ForegroundColor Green
    Write-Host "🖼️  Image Name:     " -NoNewline -ForegroundColor White
    Write-Host "$IMAGE_NAME" -ForegroundColor Green
    Write-Host ""
    Write-Host "Useful Docker Commands:" -ForegroundColor Yellow
    Write-Host "  📊 View logs:        " -NoNewline -ForegroundColor White
    Write-Host "docker logs $CONTAINER_NAME" -ForegroundColor Blue
    Write-Host "  ⏹️  Stop container:   " -NoNewline -ForegroundColor White
    Write-Host "docker stop $CONTAINER_NAME" -ForegroundColor Blue
    Write-Host "  ▶️  Start container:  " -NoNewline -ForegroundColor White
    Write-Host "docker start $CONTAINER_NAME" -ForegroundColor Blue
    Write-Host "  🗑️  Remove container: " -NoNewline -ForegroundColor White
    Write-Host "docker rm $CONTAINER_NAME" -ForegroundColor Blue
    Write-Host "  🔄 Restart container: " -NoNewline -ForegroundColor White
    Write-Host "docker restart $CONTAINER_NAME" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Or use npm scripts:" -ForegroundColor Yellow
    Write-Host "  📊 View logs:        " -NoNewline -ForegroundColor White
    Write-Host "npm run docker:logs" -ForegroundColor Blue
    Write-Host "  ⏹️  Stop & remove:    " -NoNewline -ForegroundColor White
    Write-Host "npm run docker:stop" -ForegroundColor Blue
    Write-Host "  🐳 Using compose:    " -NoNewline -ForegroundColor White
    Write-Host "npm run docker:compose" -ForegroundColor Blue
    Write-Host ""
}

# Main installation function
function Main {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                Power Grid Builder - Docker Installer          ║" -ForegroundColor Magenta
    Write-Host "║           A Realistic Power Grid Simulation Game              ║" -ForegroundColor Magenta
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    
    # Check if running in correct directory
    if (-not (Test-Path "package.json") -or -not (Select-String "power-grid-builder" "package.json" -Quiet)) {
        Write-Error "This script must be run from the Power Grid Builder project directory!"
        Write-Status "Please navigate to the project directory and run: .\install-docker.ps1"
        exit 1
    }
    
    # Check if Docker is installed
    if (-not (Test-Command "docker") -and -not $SkipDockerInstall) {
        Write-Warning "Docker is not installed on this system."
        $response = Read-Host "Do you want to install Docker Desktop? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Install-DockerDesktop
        }
        else {
            Write-Error "Docker is required to run this application!"
            Write-Status "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
            exit 1
        }
    }
    elseif (Test-Command "docker") {
        Write-Success "Docker is already installed!"
    }
    
    # Wait for Docker to be ready
    if (-not (Wait-ForDocker)) {
        exit 1
    }
    
    # Check port availability
    if (Test-Port $HOST_PORT) {
        Write-Warning "Port $HOST_PORT is already in use!"
        $newPort = Read-Host "Enter a different port number (or press Enter to exit)"
        if ($newPort -and $newPort -match '^\d+$' -and [int]$newPort -ge 1024 -and [int]$newPort -le 65535) {
            $HOST_PORT = [int]$newPort
            Write-Success "Using port $HOST_PORT"
        }
        else {
            Write-Error "Cannot proceed with port $HOST_PORT in use!"
            exit 1
        }
    }
    
    # Clean up existing containers
    Remove-ExistingContainer
    
    # Build and run the application
    Build-AndRun
    
    # Show application information
    Show-Info
    
    # Wait for container to be ready
    Write-Status "Waiting for application to start..."
    Start-Sleep -Seconds 5
    
    # Try to open browser
    try {
        Write-Status "Opening browser..."
        Start-Process "http://localhost:$HOST_PORT"
    }
    catch {
        Write-Status "Could not open browser automatically. Please visit: http://localhost:$HOST_PORT"
    }
    
    Write-Success "Installation completed successfully! 🎉"
}

# Handle script interruption
trap {
    Write-Error "Installation interrupted!"
    exit 1
}

# Run main function
try {
    Main
}
catch {
    Write-Error "An error occurred during installation: $($_.Exception.Message)"
    Write-Status "Please check the error message above and try again."
    exit 1
}
