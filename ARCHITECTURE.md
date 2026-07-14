# Systems Architecture: Smart Stadiums & Tournament Operations

This document outlines the software architecture, design patterns, and data flow of the Smart Stadiums platform. The project is built following **Clean Architecture** principles and **Domain-Driven Design (DDD)**.

---

## 1. Architectural Layers

The codebase is strictly separated into four layers to ensure independence of frameworks, testability, and clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│   (Express Controllers, Routes, Validation Middleware)  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                    │
│   (Business Use Cases, Service Interfaces, DTOs)        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                      Domain Layer                       │
│   (Entities, Value Objects, Domain Events)              │
└─────────────────────────────────────────────────────────┘
                             ▲
                             │
┌────────────────────────────┴────────────────────────────┐
│                  Infrastructure Layer                   │
│   (DB Adapters, Caching, specialized AI, Telemetry)     │
└─────────────────────────────────────────────────────────┘
```

### 1.1 Presentation Layer
- **Responsibility**: Interface with the external client. It translates HTTP requests to application commands and translates service results back into JSON.
- **Controllers**: Thin controllers that extract request data, validate it using Zod schemas, and delegate use cases to services.
- **Routes**: Direct incoming URLs to specific controller handlers with appropriate safety guardrails ( Helmet, Rate Limiters).
- **Middlewares**: Enforces security parameters (JWT auth, RBAC authorization, audit logging, and global error handling).
- **Why this improves maintainability**: Decoupling the routing engine (Express) ensures that if the server framework is swapped, the business services remain completely unaffected.

### 1.2 Application Layer
- **Responsibility**: Orchestrates the application use cases, defining the flow of data to and from the domain entities.
- **Services**: Classes like `TournamentService` and `StadiumService` coordinating workflows (scheduling matches, recording sensor telemetry, managing incidents).
- **Service Contracts**: Interfaces (e.g. `ITournamentService` inside `services.interface.ts`) define what operations can be performed, decoupling the controllers from service implementations.
- **Why this improves maintainability**: Centralizes the flow of business transactions. Use case logic can be unit-tested in isolation by mocking the database repositories.

### 1.3 Domain Layer
- **Responsibility**: Holds the enterprise business rules, entities, and value objects. This is the core of the system and contains zero dependencies on external libraries, frameworks, or databases.
- **Entities**: Rich models (e.g., `Match`, `Gate`, `Incident`, `Volunteer`, `User`) implementing validation and state mutation logic.
- **Why this improves maintainability**: The core business logic is isolated and protected from external framework updates, database migrations, or UI changes.

### 1.4 Infrastructure Layer
- **Responsibility**: Implements repository abstractions, integrates database connections, handles caching, logs observability, and interfaces with the LLM API.
- **Database Repositories**: Implement database interface contracts (e.g., `IMatchRepository`) for PostgreSQL, SQLite WASM, and JSON flat files.
- **AI Orchestration**: Houses the vector database, TF-IDF indexer, specialize agents, prompt caching, and input safety guardrails.
- **Why this improves maintainability**: Allows the data storage engine to be swapped dynamically via environment variables without altering a single line of business logic.

---

## 2. Dependency Flow & Dependency Injection (DI)

To comply with the **Dependency Inversion Principle (DIP)**:
1. High-level modules (Services) do not depend on low-level modules (Database Adapters). Instead, both depend on abstractions (Interfaces).
2. Abstractions are defined in the Application/Domain layer, while implementations are housed in the Infrastructure layer.

### Constructor Injection Pattern
Services are structured to receive repository contracts through their constructor:
```typescript
export class TournamentService implements ITournamentService {
  constructor(private readonly matchRepository: IMatchRepository) {}
}
```
During runtime, the database factory builds the concrete repository matching the `DB_PROVIDER` environment variable and injects it into the service. In tests, mock repository instances are passed instead, achieving complete testing isolation.

---

## 3. The Repository Pattern

The repository pattern isolates the data access operations behind a clean, domain-centric collection interface. It provides:
- **Encapsulation**: Services query database engines without knowing whether the backend is powered by SQL queries or local file operations.
- **Swappable Providers**: 
  - `PostgresUserRepository`: Active in production using client pooling.
  - `SqliteUserRepository`: Active in local development using a WebAssembly database (`sql.js`).
  - `JsonUserRepository`: Used as an offline demonstration fallback.

---

## 4. Model Context Protocol (MCP) Agent Flow

The Generative AI core acts as the smart orchestration brain, querying and modifying stadium operations via a Tool Registry:

```
  User Query ──► [Guardrails Filter] ──► [Intent Planner] 
                                                │
                                                ▼
  [Sanitized Response] ◄── [Output Checks] ◄── [Specialized Agent]
           ▲                                     │
           │                                     ▼
     (Tool Triggers) ◄──────────────────── [Tool Registry] (Database Mutator)
```

1. **Guardrails Scan**: Prevents prompt injections, masks PII, and filters toxicity.
2. **Intent Classification**: Planner maps query context to a specialized agent (e.g., Crowd congestion, emergency evacuations, sustainability load savings).
3. **Context Compilation (MCP)**: Gathers live stadium telemetry, gates occupancy, incident list, and volunteer roster from database.
4. **RAG Vector Search**: Queries local knowledge base (safety manuals, exit corridors) using TF-IDF and Cosine similarity.
5. **Specialized Agent Execution**: Invokes Gemini with compiled context and system instruction.
6. **Tool Extraction**: Scans AI response for actions (e.g. "Open Gate 3"). Attaches callable configurations to the payload.
7. **Hallucination Verification**: Verifies recommendations against database truth before releasing sanitized response to user.
