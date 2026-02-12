# Docker Deployment Guide

This document provides comprehensive instructions for building, running, and deploying the DevSecOps application using Docker.

## Prerequisites

- **Docker**: Version 24.0 or higher
- **Docker Compose**: Version 2.20 or higher
- **Git**: For cloning the repository

### Installation

- **Docker Desktop** (Windows/Mac): https://www.docker.com/products/docker-desktop
- **Docker Engine** (Linux): https://docs.docker.com/engine/install/

Verify installation:
```bash
docker --version
docker-compose --version
```

## Project Structure

```
.
├── services/
│   ├── auth/
│   │   ├── Dockerfile              # Production build
│   │   ├── Dockerfile.dev          # Development build
│   │   └── .dockerignore
│   └── frontend/
│       ├── Dockerfile              # Production build with nginx
│       ├── Dockerfile.dev          # Development build
│       ├── nginx.conf              # Nginx configuration
│       └── .dockerignore
├── docker-compose.yml              # Production orchestration
├── docker-compose.dev.yml          # Development orchestration
└── scripts/
    ├── build-images.sh             # Build Docker images
    └── push-images.sh              # Push to registry
```

## Quick Start

### Development Environment

Start all services in development mode with hot-reloading:

```bash
# 1. Create environment file for auth service
cp services/auth/.env.example services/auth/.env
# Edit .env and add your Supabase credentials

# 2. Start services
docker-compose -f docker-compose.dev.yml up -d

# 3. View logs
docker-compose -f docker-compose.dev.yml logs -f

# 4. Access services
# - Auth API: http://localhost:3000
# - Swagger Docs: http://localhost:3000/api-docs
# - Frontend: http://localhost:5173
```

Stop services:
```bash
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

Build and run optimized production containers:

```bash
# 1. Create environment file
cp services/auth/.env.example services/auth/.env
# Edit .env with production credentials

# 2. Build and start
docker-compose up -d

# 3. Access services
# - Auth API: http://localhost:3000
# - Swagger Docs: http://localhost:3000/api-docs
# - Frontend: http://localhost (port 80)
```

Stop services:
```bash
docker-compose down
```

## Environment Configuration

### Auth Service (.env)

Create `services/auth/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-minimum-32-characters-here
PORT=3000
NODE_ENV=production
```

### Frontend Service

For production builds, set the API URL:

```bash
# Build with custom API URL
VITE_API_URL=https://api.yourdomain.com docker-compose build frontend
```

For development, the API URL is set in `docker-compose.dev.yml`.

## Development Workflow

### Hot Reloading

Development containers support hot-reloading:

- **Auth Service**: Edit files in `services/auth/src/` - changes reload automatically
- **Frontend**: Edit files in `services/frontend/src/` - Vite HMR updates browser

### Accessing Containers

```bash
# Execute command in auth container
docker exec -it devsecops-auth-dev sh

# Execute command in frontend container
docker exec -it devsecops-frontend-dev sh

# View logs
docker-compose -f docker-compose.dev.yml logs auth
docker-compose -f docker-compose.dev.yml logs frontend
```

### Debugging

```bash
# Check container status
docker ps

# Check health status
docker inspect devsecops-auth-dev | grep -A 10 Health

# View real-time logs
docker-compose -f docker-compose.dev.yml logs -f --tail=100

# Restart specific service
docker-compose -f docker-compose.dev.yml restart auth
```

## Building Images

### Using Build Script

```bash
# Build with default 'latest' tag
./scripts/build-images.sh

# Build with version tag
./scripts/build-images.sh v1.0.0

# Build with registry prefix
REGISTRY=myregistry.azurecr.io/ ./scripts/build-images.sh v1.0.0
```

### Manual Build

```bash
# Build auth service
docker build -t devsecops-auth:latest -f services/auth/Dockerfile services/auth

# Build frontend with custom API URL
docker build -t devsecops-frontend:latest \
  --build-arg VITE_API_URL=http://localhost:3000 \
  -f services/frontend/Dockerfile \
  services/frontend
```

### Image Sizes

Expected image sizes:

- **Auth Service**: ~150-200MB (multi-stage Alpine build)
- **Frontend**: ~40-50MB (nginx Alpine + static files)

## Pushing to Registry

### Using Push Script

```bash
# Set registry URL
export REGISTRY=myregistry.azurecr.io/

# Push latest version
./scripts/push-images.sh latest

# Push specific version
./scripts/push-images.sh v1.0.0
```

### Container Registries

#### Azure Container Registry (ACR)

```bash
# Login
az acr login --name myregistry

# Build and push
REGISTRY=myregistry.azurecr.io/ ./scripts/build-images.sh v1.0.0
REGISTRY=myregistry.azurecr.io/ ./scripts/push-images.sh v1.0.0
```

#### Docker Hub

```bash
# Login
docker login

# Build and push
REGISTRY=docker.io/myusername/ ./scripts/build-images.sh v1.0.0
REGISTRY=docker.io/myusername/ ./scripts/push-images.sh v1.0.0
```

#### GitHub Container Registry (GHCR)

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and push
REGISTRY=ghcr.io/username/ ./scripts/build-images.sh v1.0.0
REGISTRY=ghcr.io/username/ ./scripts/push-images.sh v1.0.0
```

## Health Checks

Both services include health checks:

### Auth Service
- **Endpoint**: `http://localhost:3000/health`
- **Interval**: 30s
- **Timeout**: 3s
- **Retries**: 3
- **Start Period**: 5s

### Frontend
- **Endpoint**: `http://localhost/health`
- **Interval**: 30s
- **Timeout**: 3s
- **Retries**: 3
- **Start Period**: 10s

Check health status:
```bash
docker ps
# Look for "(healthy)" in STATUS column
```

## Networking

Services communicate via a Docker bridge network `devsecops-network`:

- **Auth Service**: `auth:3000` (internal DNS)
- **Frontend**: `frontend:80` (internal DNS)

From host machine:
- Auth: `localhost:3000`
- Frontend: `localhost:5173` (dev) or `localhost:80` (prod)

## Volumes

### Development

Named volumes prevent node_modules conflicts:

- `devsecops-auth-node-modules`: Auth service dependencies
- `devsecops-frontend-node-modules`: Frontend dependencies

Source code is mounted read-only for hot-reloading.

### Production

No volumes - all code is baked into the image.

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs auth
docker-compose logs frontend

# Check if ports are in use
netstat -an | grep 3000
netstat -an | grep 80
```

### Health Check Failing

```bash
# Test health endpoint manually
docker exec -it devsecops-auth sh -c "wget -O- http://localhost:3000/health"

# Check environment variables
docker exec -it devsecops-auth env
```

### Permission Denied

Containers run as non-root user `nodejs` (UID 1001). If you see permission errors:

```bash
# Check file ownership in container
docker exec -it devsecops-auth ls -la /app
```

### Frontend Can't Connect to Auth

1. Check auth service is healthy: `docker ps`
2. Check network: `docker network inspect devsecops-network`
3. Verify VITE_API_URL is correct
4. Check CORS settings in auth service

### Database Connection Issues

Ensure Supabase credentials in `.env` are correct:

```bash
# Test from within container
docker exec -it devsecops-auth sh
# Then try to connect manually
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    tags:
      - 'v*'

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: myregistry.azurecr.io
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and Push
        run: |
          export REGISTRY=myregistry.azurecr.io/
          ./scripts/build-images.sh ${GITHUB_REF#refs/tags/}
          ./scripts/push-images.sh ${GITHUB_REF#refs/tags/}
```

## Security Best Practices

✅ **Implemented:**
- Multi-stage builds (minimal attack surface)
- Non-root user (UID 1001)
- Alpine Linux base (small, secure)
- Health checks enabled
- Secrets via environment variables
- No secrets in images

⚠️ **Additional Recommendations:**
- Scan images regularly: `docker scan devsecops-auth:latest`
- Use specific version tags in production (not `latest`)
- Rotate secrets regularly
- Enable Docker Content Trust
- Use private registries for production images

## Performance Optimization

### Build Cache

Docker caches layers - optimize Dockerfile order:

1. Copy package files
2. Install dependencies (cached if package.json unchanged)
3. Copy source code
4. Build application

### Resource Limits

Add resource limits in production:

```yaml
services:
  auth:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Cleanup

Remove all containers, networks, and volumes:

```bash
# Stop and remove development environment
docker-compose -f docker-compose.dev.yml down -v

# Stop and remove production environment
docker-compose down -v

# Remove images
docker rmi devsecops-auth:latest devsecops-frontend:latest

# Clean up unused resources
docker system prune -a --volumes
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

For issues related to:
- **Docker setup**: Check this document first
- **Application errors**: See main README.md
- **API documentation**: Visit http://localhost:3000/api-docs
