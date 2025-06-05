# Power Grid Builder - Deployment Script (PowerShell)
# Comprehensive deployment script for Windows environments

param(
    [string]$DeploymentType = "full",
    [string]$OutputPath = "deployment-package",
    [switch]$SkipBuild = $false,
    [switch]$Quiet = $false
)

# Configuration
$ProjectName = "power-grid-builder"
$Version = "2.0.0"
$BuildDir = "dist"
$DockerImage = "$ProjectName`:$Version"
$ContainerRuntime = ""  # Will be set to 'docker' or 'podman'

# Function to write colored output
function Write-Status {
    param([string]$Message)
    if (-not $Quiet) {
        Write-Host "ℹ️  $Message" -ForegroundColor Blue
    }
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    if (-not $Quiet) {
        Write-Host "🚀 $Message" -ForegroundColor Magenta
    }
}

# Function to test if a command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to choose container runtime
function Select-ContainerRuntime {
    Write-Header "Container Runtime Selection"
    
    $dockerAvailable = Test-Command "docker"
    $podmanAvailable = Test-Command "podman"
    
    if ($dockerAvailable -and $podmanAvailable) {
        Write-Host "Both Docker and Podman are available. Which would you like to use?" -ForegroundColor Cyan
        Write-Host "1) Docker"
        Write-Host "2) Podman"
        $choice = Read-Host "Enter your choice (1-2)"
        
        switch ($choice) {
            "1" {
                $script:ContainerRuntime = "docker"
                Write-Success "Docker selected as container runtime"
            }
            "2" {
                $script:ContainerRuntime = "podman"
                Write-Success "Podman selected as container runtime"
            }
            default {
                Write-Warning "Invalid choice. Defaulting to Docker"
                $script:ContainerRuntime = "docker"
            }
        }
    }
    elseif ($dockerAvailable) {
        $script:ContainerRuntime = "docker"
        Write-Success "Docker will be used as container runtime"
    }
    elseif ($podmanAvailable) {
        $script:ContainerRuntime = "podman"
        Write-Success "Podman will be used as container runtime"
    }
    else {
        Write-Error "No container runtime found! Please install Docker or Podman first."
        Write-Status "Run .\install-docker.ps1 to install a container runtime"
        exit 1
    }
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Header "Checking deployment prerequisites..."
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is required but not installed!"
        Write-Status "Download from: https://nodejs.org/"
        exit 1
    }
    
    # Check npm
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is required but not installed!"
        exit 1
    }
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found! Make sure you're in the project directory."
        exit 1
    }
    
    Write-Success "Prerequisites check passed!"
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Status "Node.js version: $nodeVersion"
    Write-Status "npm version: $npmVersion"
}

# Function to install dependencies
function Install-Dependencies {
    Write-Header "Installing dependencies..."
    
    try {
        npm install
        Write-Success "Dependencies installed successfully!"
    }
    catch {
        Write-Error "Failed to install dependencies: $_"
        exit 1
    }
}

# Function to build the project
function Build-Project {
    if ($SkipBuild) {
        Write-Status "Skipping build (SkipBuild flag set)"
        return
    }
    
    Write-Header "Building the project..."
    
    # Clean previous build
    if (Test-Path $BuildDir) {
        Remove-Item -Path $BuildDir -Recurse -Force
    }
    
    # Build the project
    try {
        npm run build
        
        if (-not (Test-Path $BuildDir)) {
            Write-Error "Build failed! $BuildDir directory not created."
            exit 1
        }
        
        Write-Success "Project built successfully!"
        Write-Status "Build output available in: $BuildDir\"
    }
    catch {
        Write-Error "Build failed: $_"
        exit 1
    }
}

# Function to create deployment package
function New-DeploymentPackage {
    Write-Header "Creating deployment package..."
    
    # Create package directory
    if (Test-Path $OutputPath) {
        Remove-Item -Path $OutputPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    
    # Copy build files
    Copy-Item -Path "$BuildDir\*" -Destination $OutputPath -Recurse -Force
    
    # Copy deployment files
    $deploymentFiles = @(
        "Dockerfile",
        "docker-compose.yml", 
        "nginx.conf",
        "healthcheck.sh",
        "install-*.sh",
        "install-*.ps1",
        "build-*.sh",
        "build-*.ps1"
    )
    
    foreach ($pattern in $deploymentFiles) {
        $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            Copy-Item -Path $file.FullName -Destination $OutputPath -Force
        }
    }
    
    # Create deployment documentation
    New-DeploymentDocs
    
    Write-Success "Deployment package created in: $OutputPath\"
}

# Function to create deployment documentation
function New-DeploymentDocs {
    $deploymentMd = @"
# Power Grid Builder - Windows Deployment Guide

This package contains everything needed to deploy Power Grid Builder on Windows systems.

## Quick Start

### Option 1: PowerShell Installation Script
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install-docker.ps1
```

### Option 2: Manual Docker Deployment
```powershell
# Install Docker Desktop from https://docker.com/products/docker-desktop/
# Then run:
docker build -t power-grid-builder:latest .
docker run -d --name power-grid-builder -p 8080:80 --restart unless-stopped power-grid-builder:latest
```

### Option 3: IIS Deployment
1. Install IIS with ASP.NET support
2. Copy contents of this folder to C:\inetpub\wwwroot\power-grid-builder\
3. Configure IIS application/virtual directory
4. Access via http://localhost/power-grid-builder/

### Option 4: Static File Server
Use any of these simple HTTP servers:

```powershell
# Using Python (if installed)
python -m http.server 8080

# Using Node.js http-server
npm install -g http-server
http-server -p 8080

# Using PowerShell (Windows 10+)
# Install IIS or use built-in web server
```

## Cloud Deployment

### Azure Static Web Apps
1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. Login: `az login`
3. Deploy: `az staticwebapp create --name power-grid-builder --resource-group myResourceGroup --source .`

### AWS S3 + CloudFront
1. Install AWS CLI: https://aws.amazon.com/cli/
2. Configure: `aws configure`
3. Create S3 bucket and upload files
4. Enable static website hosting
5. Optional: Add CloudFront distribution

### Google Cloud Storage
1. Install Google Cloud SDK
2. Create storage bucket
3. Upload files: `gsutil -m cp -r . gs://your-bucket-name`
4. Enable public access

## Container Management (Docker)

```powershell
# View running containers
docker ps

# View logs
docker logs power-grid-builder

# Stop container
docker stop power-grid-builder

# Start container
docker start power-grid-builder

# Remove container
docker rm power-grid-builder

# Update application
docker pull power-grid-builder:latest
docker stop power-grid-builder
docker rm power-grid-builder
docker run -d --name power-grid-builder -p 8080:80 --restart unless-stopped power-grid-builder:latest
```

## Troubleshooting

### Common Windows Issues

1. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Docker Desktop not running**
   - Start Docker Desktop from Start Menu
   - Check Docker Desktop is running in system tray

3. **Port 8080 already in use**
   ```powershell
   # Check what's using the port
   netstat -ano | findstr :8080
   
   # Use different port
   docker run -d --name power-grid-builder -p 8081:80 power-grid-builder:latest
   ```

4. **Windows Firewall blocking access**
   - Add inbound rule for port 8080
   - Or temporarily disable Windows Firewall for testing

5. **Hyper-V not enabled (for Docker)**
   ```powershell
   # Run as Administrator
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   # Restart required
   ```

### Performance Tips

1. **Antivirus exclusions**: Add project folder to antivirus exclusions
2. **Windows Defender**: Exclude Docker and Node.js processes
3. **Resource allocation**: Increase Docker Desktop memory/CPU limits
4. **SSD storage**: Use SSD for better Docker performance

## File Structure

```
deployment-package/
├── index.html              # Main application entry point
├── assets/                 # Built JavaScript, CSS, and assets
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration  
├── nginx.conf             # Nginx server configuration
├── healthcheck.sh         # Container health check script
├── install-docker.ps1     # Windows PowerShell installation script
├── install-docker.sh      # Linux installation script (for WSL)
└── DEPLOYMENT.md          # This file
```

## WSL2 Support

If using Windows Subsystem for Linux:

```bash
# From WSL2 terminal
./install-docker.sh
```

This will set up Docker in WSL2 environment with full Linux compatibility.
"@

    $deploymentMd | Out-File -FilePath "$OutputPath\DEPLOYMENT.md" -Encoding UTF8
    
    # Create Windows-specific scripts
    New-PlatformScripts
}

# Function to create platform-specific scripts
function New-PlatformScripts {
    # Azure deployment script
    $azureScript = @"
# Deploy to Azure Static Web Apps
Write-Host "☁️ Deploying to Azure..." -ForegroundColor Cyan
Write-Host "1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
Write-Host "2. Login: az login"
Write-Host "3. Create resource group: az group create --name myResourceGroup --location eastus"
Write-Host "4. Deploy: az staticwebapp create --name power-grid-builder --resource-group myResourceGroup --source ."
"@
    $azureScript | Out-File -FilePath "$OutputPath\deploy-azure.ps1" -Encoding UTF8

    # AWS deployment script  
    $awsScript = @"
# Deploy to AWS S3
Write-Host "☁️ Deploying to AWS S3..." -ForegroundColor Cyan
Write-Host "1. Install AWS CLI: https://aws.amazon.com/cli/"
Write-Host "2. Configure: aws configure"
Write-Host "3. Create bucket: aws s3 mb s3://your-bucket-name"
Write-Host "4. Upload: aws s3 sync . s3://your-bucket-name --delete"
Write-Host "5. Enable hosting: aws s3 website s3://your-bucket-name --index-document index.html"
"@
    $awsScript | Out-File -FilePath "$OutputPath\deploy-aws.ps1" -Encoding UTF8

    # IIS deployment script
    $iisScript = @"
# Deploy to IIS
Write-Host "🌐 Setting up IIS deployment..." -ForegroundColor Cyan
Write-Host "1. Enable IIS: Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-NetFxExtensibility45, IIS-ASPNET45"
Write-Host "2. Copy files to: C:\inetpub\wwwroot\power-grid-builder\"
Write-Host "3. Create IIS application pointing to this directory"
Write-Host "4. Access via: http://localhost/power-grid-builder/"

# Check if IIS is available
if (Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole | Where-Object {`$_.State -eq "Enabled"}) {
    Write-Host "✅ IIS is already enabled" -ForegroundColor Green
} else {
    Write-Host "⚠️ IIS needs to be enabled" -ForegroundColor Yellow
    `$response = Read-Host "Enable IIS now? (y/n)"
    if (`$response -eq 'y' -or `$response -eq 'Y') {
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging -All
        Write-Host "✅ IIS enabled. Restart may be required." -ForegroundColor Green
    }
}
"@
    $iisScript | Out-File -FilePath "$OutputPath\deploy-iis.ps1" -Encoding UTF8
    
    Write-Success "Platform deployment scripts created!"
}

# Function to build container image
function Build-ContainerImage {
    if (-not $ContainerRuntime) {
        Select-ContainerRuntime
    }
    
    if (-not (Test-Command $ContainerRuntime)) {
        Write-Warning "$ContainerRuntime not found. Skipping container image build."
        if ($ContainerRuntime -eq "docker") {
            Write-Status "Install Docker Desktop from: https://docker.com/products/docker-desktop/"
        } else {
            Write-Status "Install Podman from: https://podman.io/getting-started/installation"
        }
        return
    }
    
    Write-Header "Building $ContainerRuntime image..."
    
    try {
        # Build the image
        & $ContainerRuntime build -t $DockerImage .
        & $ContainerRuntime tag $DockerImage "$ProjectName`:latest"
        
        Write-Success "$ContainerRuntime image built: $DockerImage"
        
        # Create container load script
        $scriptName = "load-$ContainerRuntime-image.ps1"
        $containerScript = @"
# Load $ContainerRuntime image from file
Write-Host "🐳 Loading $ContainerRuntime image..." -ForegroundColor Cyan
if (Test-Path "power-grid-builder-$Version.tar") {
    $ContainerRuntime load -i power-grid-builder-$Version.tar
    Write-Host "✅ $ContainerRuntime image loaded successfully!" -ForegroundColor Green
    Write-Host "🚀 Run with: $ContainerRuntime run -d --name power-grid-builder -p 8080:80 --restart unless-stopped $DockerImage" -ForegroundColor Blue
} else {
    Write-Host "❌ $ContainerRuntime image file not found!" -ForegroundColor Red
    Write-Host "💡 Build the image with: $ContainerRuntime build -t $DockerImage ." -ForegroundColor Yellow
}
"@
        $containerScript | Out-File -FilePath "$OutputPath\$scriptName" -Encoding UTF8
        
        # Also create a generic load script for backwards compatibility
        if ($ContainerRuntime -eq "docker") {
            $containerScript | Out-File -FilePath "$OutputPath\load-docker-image.ps1" -Encoding UTF8
        }
    }
    catch {
        Write-Error "$ContainerRuntime build failed: $_"
    }
}

# Function to create archive packages
function New-Archives {
    Write-Header "Creating deployment archives..."
    
    # Create zip archive
    try {
        $zipPath = "$ProjectName-$Version-deployment.zip"
        Compress-Archive -Path "$OutputPath\*" -DestinationPath $zipPath -Force
        
        $size = (Get-Item $zipPath).Length / 1MB
        Write-Success "Created: $zipPath ($([math]::Round($size, 2)) MB)"
    }
    catch {
        Write-Warning "Failed to create zip archive: $_"
    }
    
    # Create tar.gz if available (Windows 10+)
    if (Get-Command tar -ErrorAction SilentlyContinue) {
        try {
            $tarPath = "$ProjectName-$Version-deployment.tar.gz"
            tar -czf $tarPath -C $OutputPath .
            
            $size = (Get-Item $tarPath).Length / 1MB
            Write-Success "Created: $tarPath ($([math]::Round($size, 2)) MB)"
        }
        catch {
            Write-Warning "Failed to create tar.gz archive: $_"
        }
    }
}

# Function to save container image
function Save-ContainerImage {
    if (-not $ContainerRuntime) {
        Select-ContainerRuntime
    }
    
    if (-not (Test-Command $ContainerRuntime)) {
        Write-Warning "$ContainerRuntime not available. Skipping image save."
        return
    }
    
    try {
        & $ContainerRuntime image inspect $DockerImage | Out-Null
    }
    catch {
        Write-Warning "$ContainerRuntime image not available. Skipping image save."
        return
    }
    
    Write-Header "Saving $ContainerRuntime image..."
    
    try {
        # Save container image to file
        $imagePath = "power-grid-builder-$Version.tar"
        & $ContainerRuntime save -o $imagePath $DockerImage
        
        $size = (Get-Item $imagePath).Length / 1MB
        Write-Success "$ContainerRuntime image saved: $imagePath ($([math]::Round($size, 2)) MB)"
    }
    catch {
        Write-Error "Failed to save $ContainerRuntime image: $_"
    }
}

# Function to generate deployment summary
function Show-Summary {
    Write-Header "Deployment Package Summary"
    
    Write-Host "📦 Package Contents:" -ForegroundColor Cyan
    Write-Host "  📁 Deployment directory: " -NoNewline
    Write-Host $OutputPath -ForegroundColor Green
    
    $zipFile = "$ProjectName-$Version-deployment.zip"
    if (Test-Path $zipFile) {
        Write-Host "  📦 Zip package: " -NoNewline
        Write-Host $zipFile -ForegroundColor Green
    }
    
    $tarFile = "$ProjectName-$Version-deployment.tar.gz"
    if (Test-Path $tarFile) {
        Write-Host "  📦 Tar.gz package: " -NoNewline
        Write-Host $tarFile -ForegroundColor Green
    }
    
    $dockerFile = "power-grid-builder-$Version.tar"
    if (Test-Path $dockerFile) {
        Write-Host "  🐳 Docker image: " -NoNewline
        Write-Host $dockerFile -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🚀 Deployment Options:" -ForegroundColor Cyan
    Write-Host "  🐳 " -NoNewline -ForegroundColor Blue
    Write-Host "Docker: " -NoNewline -ForegroundColor Blue
    Write-Host "Use install-docker.ps1 or docker-compose.yml"
    Write-Host "  🌐 " -NoNewline -ForegroundColor Blue
    Write-Host "IIS: " -NoNewline -ForegroundColor Blue
    Write-Host "Use deploy-iis.ps1 script"
    Write-Host "  ☁️ " -NoNewline -ForegroundColor Blue
    Write-Host "Cloud: " -NoNewline -ForegroundColor Blue
    Write-Host "Use deploy-azure.ps1 or deploy-aws.ps1"
    
    Write-Host ""
    Write-Host "📖 Documentation:" -ForegroundColor Cyan
    Write-Host "  📄 Deployment guide: " -NoNewline
    Write-Host "$OutputPath\DEPLOYMENT.md" -ForegroundColor Green
    Write-Host "  🔧 Installation script: " -NoNewline
    Write-Host "$OutputPath\install-docker.ps1" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ Deployment package ready!" -ForegroundColor Green
    Write-Host "🌐 Quick start: " -NoNewline -ForegroundColor Blue
    Write-Host "cd $OutputPath && .\install-docker.ps1" -ForegroundColor Blue
}

# Function to show menu
function Show-Menu {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║              Power Grid Builder - Deployment                ║" -ForegroundColor Magenta
    Write-Host "║                Package Creator v2.0 (Windows)               ║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "Please select deployment options:"
    Write-Host ""
    Write-Host "1) 📦 Full deployment package (recommended)"
    Write-Host "2) 🐳 Container image only (Docker/Podman)"  
    Write-Host "3) 🌐 Static files only"
    Write-Host "4) ☁️ Cloud platform packages"
    Write-Host "5) 🔄 Everything (full package + container image)"
    Write-Host "6) ❌ Exit"
    Write-Host ""
}

# Main function
function Main {
    # Check if running in interactive mode
    if ($DeploymentType -eq "menu") {
        Show-Menu
        $choice = Read-Host "Enter your choice (1-6)"
    } else {
        switch ($DeploymentType.ToLower()) {
            "full" { $choice = "1" }
            "docker" { $choice = "2" }
            "static" { $choice = "3" }
            "cloud" { $choice = "4" }
            "all" { $choice = "5" }
            default { $choice = "5" }  # Default to everything
        }
    }
    
    switch ($choice) {
        "1" {
            Test-Prerequisites
            Install-Dependencies
            Build-Project
            New-DeploymentPackage
            New-Archives
            Show-Summary
        }
        "2" {
            Test-Prerequisites
            Install-Dependencies
            Build-Project
            Build-ContainerImage
            Save-ContainerImage
        }
        "3" {
            Test-Prerequisites
            Install-Dependencies
            Build-Project
            New-DeploymentPackage
        }
        "4" {
            Test-Prerequisites
            Install-Dependencies
            Build-Project
            New-DeploymentPackage
            Write-Success "Cloud platform scripts available in: $OutputPath\"
        }
        "5" {
            Test-Prerequisites
            Install-Dependencies
            Build-Project
            New-DeploymentPackage
            Build-ContainerImage
            New-Archives
            Save-ContainerImage
            Show-Summary
        }
        "6" {
            Write-Status "Deployment cancelled."
            exit 0
        }
        default {
            Write-Error "Invalid choice. Please run the script again."
            exit 1
        }
    }
}

# Check if script is run from project directory
if (-not (Test-Path "package.json") -or -not (Select-String -Path "package.json" -Pattern "power-grid-builder" -Quiet)) {
    Write-Error "This script must be run from the Power Grid Builder project directory!"
    exit 1
}

# Handle Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-Error "Deployment interrupted!"
}

# Run main function
Main
