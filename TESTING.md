# Testing Guide

## Overview
This project uses multiple testing approaches:
- **Unit Tests:** Jest (Auth Service) + Vitest (Frontend)
- **BDD Tests:** Robot Framework for acceptance testing
- **Integration Tests:** Supertest for API testing

## Running Tests

### Auth Service Tests
```bash
cd services/auth
npm test                 # Run tests with coverage
npm run test:watch       # Watch mode
npm run test:ci          # CI mode (used by pipeline)
```

### Frontend Tests
```bash
cd services/frontend
npm test                 # Run tests with coverage
npm run test:watch       # Watch mode
npm run test:ui          # Visual UI
npm run test:ci          # CI mode
```

## Test Coverage

Current coverage targets: **60%** minimum

### Auth Service
- Authorization middleware: **90%** coverage
- API routes: **Comprehensive coverage** (login, admin endpoints, dashboard)
- Supabase client: **Full initialization tests**
- Total: 30+ test cases

### Frontend
- Login component: **75%** coverage
- AdminPage component: **Full coverage** (20+ test cases)
- UserDashboard component: **Full coverage** (15+ test cases)
- Total: 40+ test cases

### BDD Tests (Robot Framework)
- Authentication workflows: 10+ scenarios
- Authorization tests: 4+ scenarios
- Total: 15+ BDD acceptance tests

## Adding New Tests

### Auth Service
Create files in `src/__tests__/`:
```
services/auth/src/__tests__/
├── authMiddleware.test.ts
└── routes.test.ts  (future)
```

### Frontend
Create files in `src/pages/__tests__/`:
```
services/frontend/src/pages/__tests__/
├── Login.test.tsx
├── AdminPage.test.tsx
└── UserDashboard.test.tsx
```

## BDD Testing with Robot Framework

### Setup
```bash
cd tests/robot
python -m venv robot-env
robot-env\Scripts\activate  # Windows
# or: source robot-env/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Running BDD Tests
```bash
cd tests/robot
robot --outputdir results .          # Run all tests
robot --outputdir results auth/      # Run authentication tests
robot --outputdir results --loglevel DEBUG .  # Detailed logging
```

### Viewing BDD Reports
After running tests, open:
- `results/report.html` - Summary
- `results/log.html` - Detailed log

### BDD Test Structure
```
tests/robot/
├── auth/                  # Authentication BDD tests
│   ├── login.robot
│   ├── logout.robot
│   └── authorization.robot
├── admin/                 # Admin functionality tests
│   └── user_management.robot
├── resources/             # Shared keywords
│   ├── auth_keywords.robot
│   └── api_keywords.robot
└── variables/             # Configuration
    └── config.robot
```

### Prerequisites for BDD Tests
1. Start auth service: `cd services/auth && npm start`
2. Ensure test users exist in database
3. Configure `tests/robot/variables/config.robot` with correct URLs and credentials

## CI/CD Integration

Tests run automatically in GitHub Actions:
1. Install dependencies
2. Run `npm test -- --coverage`
3. Generate HTML reports
4. Upload as artifacts (30-day retention)

View coverage reports:
1. Go to GitHub Actions
2. Select workflow run
3. Download `test-coverage-{service}` artifact
4. Open `index.html` in browser
