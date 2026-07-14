# Changelog: Smart Stadiums & Tournament Operations

All notable changes to this project will be documented in this file.

---

## [1.2.0] - 2026-07-14

### Added
- **Multi-Agent AI Copilot Architecture**: Added specialized agents (Crowd, Emergency, Sustainability, Accessibility, Transportation, Volunteer) coordinated by an Orchestrator.
- **Model Context Protocol (MCP)**: Gathered real-time database context (gates, matches, incidents, volunteers) automatically.
- **RAG Vector Search**: Local TF-IDF and Cosine similarity match index for retrieving safety handbooks.
- **Semantic Caching**: Implemented a TTL response cache mapping vectors to reduce model latency under 10ms.
- **Observability Dashboard**: Added OpenTelemetry metrics summary tracking API durations, CPU load, and token consumption logs.
- **AI Safety Guardrails**: Created prompt injection blockers, toxicity checks, PII redactors, and hallucination output validation.
- **Multitier Database Adapters**: Added PostgreSQL connection pooling and SQLite migration scripts with environment-variable database factory switches.
- **WCAG 2.2 AA Compliance**: Added screen-reader support, skip links, and WCAG AAA high contrast layout theme toggles.

### Fixed
- Fixed venue scheduling conflicts (double bookings) via overlapping time validations.
- Standardized Express error handling to sanitize trace dumps in production.
- Refactored server processes to register graceful SIGINT and SIGTERM hooks.
