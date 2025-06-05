#!/bin/sh

# Health check script for Power Grid Builder
# This script verifies that the application is running correctly

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if the application responds to HTTP requests
if ! wget --quiet --tries=1 --spider http://localhost/; then
    echo "ERROR: Application is not responding to HTTP requests"
    exit 1
fi

# Check if main files exist
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "ERROR: index.html not found"
    exit 1
fi

echo "Health check passed: Application is running correctly"
exit 0
