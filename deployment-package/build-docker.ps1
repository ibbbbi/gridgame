# Power Grid Builder - Docker Build Script (Windows)
# This script builds and runs the Power Grid Builder application in Docker

Write-Host "🔧 Building Power Grid Builder Docker container..." -ForegroundColor Blue

try {
    # Build the Docker image
    docker build -t power-grid-builder:latest .
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green

    # Check if container is already running
    $existingContainer = docker ps -q -f name=power-grid-builder
    if ($existingContainer) {
        Write-Host "🔄 Stopping existing container..." -ForegroundColor Yellow
        docker stop power-grid-builder
        docker rm power-grid-builder
    }

    Write-Host "🚀 Starting Power Grid Builder container..." -ForegroundColor Blue

    # Run the container
    docker run -d `
        --name power-grid-builder `
        -p 8080:80 `
        --restart unless-stopped `
        power-grid-builder:latest

    Write-Host "🎉 Power Grid Builder is now running!" -ForegroundColor Green
    Write-Host "📱 Open your browser and visit: http://localhost:8080" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  View logs:    docker logs power-grid-builder" -ForegroundColor Gray
    Write-Host "  Stop:         docker stop power-grid-builder" -ForegroundColor Gray
    Write-Host "  Remove:       docker rm power-grid-builder" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
