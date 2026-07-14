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
- **Controllers**: Thin controllers that extract HTTP requests parameters, validate them using Zod, delegate processing to the application service, and map outputs to DTOs.
- **Routes**: Standard Express routes with security headers (Helmet) and IP rate-limiting applied.
- **Middleware**: Interceptors managing JWT verification, CORS control, error sanitization, and structured audit logs.

### 1.2 Application Layer
- **Services**: Orchestrates domain logic rules. Coordinates database transactions, schedules tournament matches (performing venue double booking checks), updates gate telemetry, and initiates emergency dispatches.
- **Interfaces**: Abstract contracts for repositories and external services (e.g. AI Provider), decoupling application logic from concrete database clients.

### 1.3 Domain Layer
- **Entities**: Business core models (`User`, `Match`, `Gate`, `Incident`, `Volunteer`, `Telemetry`) initialized with constructors and static validation logic. Contains no framework dependencies.

### 1.4 Infrastructure Layer
- **Database Adapters**: Switched factory loading Postgres, SQLite, or local atomic JSON file repository configurations.
- **AI Core (MCP)**: System combining Specialized Agents, Vector search (local BM25 + cosine similarity RAG), Prompts template engines, and safety Guardrails.
- **Caching**: TTL-limited semantic response caching mapping prompt vectors.
- **Telemetry**: OpenTelemetry wrapper recording request latency distributions, system CPU/RAM, and model token costs.

---

## 2. Model Context Protocol (MCP) Agent Flow

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
