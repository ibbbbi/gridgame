#!/bin/bash

# Power Grid Builder - Docker Build Script
# This script builds and runs the Power Grid Builder application in Docker

set -e

echo "🔧 Building Power Grid Builder Docker container..."

# Build the Docker image
docker build -t power-grid-builder:latest .

echo "✅ Docker image built successfully!"

# Check if container is already running
if [ "$(docker ps -q -f name=power-grid-builder)" ]; then
    echo "🔄 Stopping existing container..."
    docker stop power-grid-builder
    docker rm power-grid-builder
fi

echo "🚀 Starting Power Grid Builder container..."

# Run the container
docker run -d \
    --name power-grid-builder \
    -p 8080:80 \
    --restart unless-stopped \
    power-grid-builder:latest

echo "🎉 Power Grid Builder is now running!"
echo "📱 Open your browser and visit: http://localhost:8080"
echo ""
echo "Commands:"
echo "  View logs:    docker logs power-grid-builder"
echo "  Stop:         docker stop power-grid-builder"
echo "  Remove:       docker rm power-grid-builder"
