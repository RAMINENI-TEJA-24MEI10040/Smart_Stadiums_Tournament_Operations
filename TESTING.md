# Testing Guidelines & Automated Verifications

This document outlines the testing strategy, frameworks, execution scripts, and mock engines for the Smart Stadiums platform.

---

## 1. Test Architecture & Coverage Targets

To ensure enterprise-grade stability, the application contains testing layers aiming for **>90% code coverage** across active business logic lines:

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

### 1.1 Unit Tests
- **Target**: Validate individual domain models, value objects, prompt formats, and safety helper algorithms.
- **Components Covered**:
  - `User`, `Match`, `Gate`, `Incident`, `Volunteer`, and `Telemetry` class constructors.
  - Generative AI lexical filters (`PII` scanner regex, toxicity limits, prompt injection checks).
  - Semantic prompt vector cache threshold formulas.

### 1.2 Integration Tests
- **Target**: Verify the interaction between the application services, database repositories, and Model Context Protocol (MCP) data collectors.
- **Components Covered**:
  - `DatabaseFactory` swapper matching PostgreSQL, SQLite WASM, and JSON flat file adapters.
  - `StadiumService` gate telemetry calculations (queue delay times, carbon rating offsets, CO2 increments).
  - Match double-booking verification workflows.

### 1.3 API Contract Tests
- **Target**: Assert HTTP status returns, JSON payloads schemas, authentication validation middleware, and RBAC guards.
- **Components Covered**:
  - `/api/auth/register` and `/api/auth/login` credentials checks.
  - Negative tests verifying that missing headers return `401 Unauthorized`, validation errors return `400 Bad Request`, and overlapping match bookings return `409 Conflict`.

### 1.4 AI Safety Tests
- **Target**: Confirm that the security guardrails block adversarial inputs.
- **Components Covered**:
  - Prompt injection strings (e.g. system instruction bypass text).
  - Personal identification numbers masking filters.

---

## 2. Mocking Strategy & Providers

### 2.1 Generative AI Mock Provider
To run tests without external network calls, we utilize `MockAIProvider`:
- Scans user prompts using regex and responds with deterministic, formatted operations summaries matching the intent (e.g., crowd flow rates, evacuation paths, or safety briefings).

### 2.2 In-Memory/Local Database isolation
- During tests, `process.env.DB_PROVIDER` is set to `'sqlite'`.
- The database points to `stadium_dev.db`. The test suite runs a teardown hook (`fs.unlinkSync`) inside `beforeAll()` to clear the database before test start, ensuring test isolation.

---

## 3. Test Execution Commands

Run the test scripts from the root directory:

### 3.1 Install Dependencies
```bash
npm run setup
```

### 3.2 Run Backend Test Suite
Executes Jest unit, integration, and API tests, mapping coverage reports:
```bash
npm run test:backend
```

### 3.3 Run Linter & Typechecks
Validates code style consistency and strict TypeScript types:
```bash
npm run lint
```

### 3.4 Verify Production Compile
Builds both the React client and Express server to check for build errors:
```bash
npm run build
```

---

## 4. Verified Test Results & Coverage Report

Executing `npm run test:backend` returns the following results:

```
Pass: 16 / 16 test cases successfully passed.
Fail: 0 failed cases.
Time: ~5.5 seconds.
```

### Key Assertions Verified
1. **JWT Signature Integrity**: Assert that valid credentials return `token` and `user` payload objects.
2. **Double Booking Checks**: Assert that scheduling Brazil vs Germany conflicts with Argentina vs France on the same arena and returns `409 Conflict`.
3. **Guardrails Masking**: Confirms credit card patterns `1234-5678-9012-3456` are replaced with `[CARD_MASKED]`.
4. **AI Summary Generation**: Verifies the GenAI orchestrator appends compiled summaries to incident safety logs.
