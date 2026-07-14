# Testing Guidelines: Automated Verification & Coverage

This document outlines the testing strategy, frameworks, execution scripts, and mock engines for the Smart Stadiums platform.

---

## 1. Test Architecture & Coverage Targets

To ensure enterprise-grade stability, the application contains testing layers aiming for **>90% code coverage**:

```
┌─────────────────────────────────────────────────────────┐
│                    API Contract Tests                   │
│   (Supertest HTTP calls verifying schemas and responses)│
├─────────────────────────────────────────────────────────┤
│                    Integration Tests                    │
│   (Database Repositories with SQLite / file structures) │
├─────────────────────────────────────────────────────────┤
│                       Unit Tests                        │
│   (Domain Models, Value Objects, Guardrails, Prompts)   │
└─────────────────────────────────────────────────────────┘
```

### 1.1 Mocking Strategy
- **Generative AI Mocks**: When no API key is specified, the system resolves queries using `MockAIProvider` which runs deterministic regex templates matching the request types (crowd, energy, evacuation).
- **SQLite Database Mocking**: Tests run using an in-memory or localized test database (`stadium_dev.db`), ensuring database updates do not alter production records.

---

## 2. Test Commands

Run the test scripts from the root directory:

### 2.1 Install Dependencies
```bash
npm run setup
```

### 2.2 Run Backend Test Suite
Executes Jest unit, integration, and API tests, mapping coverage reports:
```bash
npm run test:backend
```

### 2.3 Run Linter & Typechecks
Validates code style consistency and strict TypeScript types:
```bash
npm run lint
```

### 2.4 Verify Production Compile
Builds both the React client and Express server to check for build errors:
```bash
npm run build
```
