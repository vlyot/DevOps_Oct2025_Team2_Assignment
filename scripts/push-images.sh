#!/bin/bash
set -e

VERSION=${1:-latest}
REGISTRY=${REGISTRY:-}

if [ -z "$REGISTRY" ]; then
  echo "❌ Error: REGISTRY environment variable must be set"
  echo ""
  echo "Example usage:"
  echo "  REGISTRY=myregistry.azurecr.io/ ./scripts/push-images.sh v1.0.0"
  echo "  REGISTRY=docker.io/myusername/ ./scripts/push-images.sh latest"
  exit 1
fi

echo "🚀 Pushing Docker images to $REGISTRY (version: $VERSION)"
echo "================================================"

# Push auth service
echo ""
echo "📤 Pushing auth service..."
docker push ${REGISTRY}devsecops-auth:${VERSION}
echo "✅ Auth service pushed successfully"

# Push frontend
echo ""
echo "📤 Pushing frontend..."
docker push ${REGISTRY}devsecops-frontend:${VERSION}
echo "✅ Frontend pushed successfully"

echo ""
echo "✨ Successfully pushed all images to ${REGISTRY}!"
