# Robot Framework BDD Tests

This directory contains Behavior-Driven Development (BDD) tests using Robot Framework for the DevSecOps application.

## Prerequisites

Robot Framework requires Python. Install the required dependencies:

```bash
# Create a virtual environment (recommended)
python -m venv robot-env

# Activate virtual environment
# Windows:
robot-env\Scripts\activate
# Linux/Mac:
source robot-env/bin/activate

# Install Robot Framework and libraries
pip install robotframework
pip install robotframework-requests
pip install robotframework-jsonlibrary
```

## Directory Structure

```
tests/robot/
├── auth/               # Authentication BDD tests
│   ├── login.robot
│   ├── logout.robot
│   └── authorization.robot
├── admin/              # Admin functionality BDD tests
│   └── user_management.robot
├── resources/          # Shared keywords and utilities
│   ├── common.robot
│   ├── auth_keywords.robot
│   └── api_keywords.robot
├── variables/          # Configuration variables
│   └── config.robot
└── results/            # Test execution results (generated)
```

## Running Tests

### Run All Tests
```bash
cd tests/robot
robot --outputdir results .
```

### Run Specific Test Suite
```bash
# Run only authentication tests
robot --outputdir results auth/

# Run only admin tests
robot --outputdir results admin/

# Run specific test file
robot --outputdir results auth/login.robot
```

### Run with Different Log Levels
```bash
# Detailed logging
robot --outputdir results --loglevel DEBUG .

# Minimal logging
robot --outputdir results --loglevel WARN .
```

## Viewing Test Results

After running tests, open the generated reports:

1. **report.html** - High-level test execution summary
2. **log.html** - Detailed test execution log
3. **output.xml** - Machine-readable test results

```bash
# Open report in browser (Windows)
start results/report.html

# Open report in browser (Linux/Mac)
open results/report.html
```

## Environment Configuration

Update the variables in `variables/config.robot` to match your environment:

```robot
*** Variables ***
${BASE_URL}          http://localhost:3000
${ADMIN_EMAIL}       admin@example.com
${ADMIN_PASSWORD}    adminpass123
${TEST_USER_EMAIL}   test@example.com
${TEST_USER_PASSWORD}    testpass123
```

## Prerequisites for Running Tests

1. Start the auth service:
   ```bash
   cd services/auth
   npm start
   ```

2. Start the frontend (if testing UI):
   ```bash
   cd services/frontend
   npm run dev
   ```

3. Ensure test users exist in the database

## Writing New Tests

Follow the existing test structure:

```robot
*** Settings ***
Documentation     Test description here
Library           RequestsLibrary
Resource          ../resources/auth_keywords.robot

*** Test Cases ***
Test Case Name
    [Documentation]    What this test does
    Given precondition keyword
    When action keyword
    Then assertion keyword
```

## CI/CD Integration

These tests are integrated into the GitHub Actions pipeline and run automatically on each push.

See `.github/workflows/pipeline.yaml` for configuration.

## Troubleshooting

### Tests fail to connect to API
- Ensure auth service is running on port 3000
- Check BASE_URL in config.robot matches your environment

### Import errors
- Verify Robot Framework libraries are installed
- Check that you're in the virtual environment

### Authentication failures
- Verify test user credentials exist in database
- Check JWT_SECRET environment variable is set correctly

## Best Practices

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **Keep tests independent** - Each test should set up and tear down its own data
3. **Use keywords** - Create reusable keywords in resources/ for common operations
4. **Add documentation** - Use [Documentation] tag to explain test purpose
5. **Handle cleanup** - Always clean up test data in teardown
