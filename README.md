# DevOps_Oct2025_Team2_Assignment

## CI/CD Pipeline

### Workflow

1. Push to `develop` → CI Quality Gate runs (tests, lint, coverage)
2. Create PR to `main` → Manual review
3. Merge to `main` → Auto-deploy to staging + Discord notification

### Deployment

Images automatically pushed to Docker Hub on merge to main:
- `{DOCKER_USERNAME}/devops-frontend:latest`
- `{DOCKER_USERNAME}/devops-auth:latest`
- `{DOCKER_USERNAME}/devops-discord-notifier:latest`

Discord notifications sent to:
- QA channel (all deployments)
- Developer channel (failures only)
- Stakeholder channel (successes only)