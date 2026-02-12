#!/bin/bash
set -e

VERSION=${1:-latest}
REGISTRY=${REGISTRY:-}

echo "🔨 Building Docker images (version: $VERSION)"
echo "================================================"

# Build auth service
echo ""
echo "📦 Building auth service..."
docker build -t ${REGISTRY}devsecops-auth:${VERSION} \
  -f services/auth/Dockerfile \
  services/auth

echo "✅ Auth service built successfully"

# Build frontend
echo ""
echo "📦 Building frontend..."
docker build -t ${REGISTRY}devsecops-frontend:${VERSION} \
  --build-arg VITE_API_URL=${VITE_API_URL:-http://localhost:3000} \
  -f services/frontend/Dockerfile \
  services/frontend

echo "✅ Frontend built successfully"

# Display images
echo ""
echo "📋 Built images:"
echo "================================================"
docker images | grep devsecops || echo "No images found"

echo ""
echo "✨ Successfully built all images!"
