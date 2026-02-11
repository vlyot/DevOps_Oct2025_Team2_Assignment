# Testing Guide

## Overview
This project uses:
- **Auth Service:** Jest + Supertest
- **Frontend:** Vitest + React Testing Library

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
- 9 test cases covering all auth scenarios

### Frontend
- Login component: **75%** coverage
- 8 test cases covering UI and integration

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
├── AdminPage.test.tsx  (future)
└── UserDashboard.test.tsx  (future)
```

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
