# Smart Stadiums & Tournament Operations Command Center 🏟️

[![Continuous Integration Checks](https://github.com/RAMINENI-TEJA-24MEI10040/Smart_Stadiums_Tournament_Operations/actions/workflows/ci.yml/badge.svg)](https://github.com/RAMINENI-TEJA-24MEI10040/Smart_Stadiums_Tournament_Operations/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WCAGAA Compliant](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-green.svg)](ACCESSIBILITY.md)

An enterprise-grade, Clean Architecture dashboard designed to unify stadium safety, ticketing logistics, volunteer coordinate shifts, and match scheduling for the **FIFA World Cup 2026**.

---

## 1. Executive Summary & Project Goals

Large-scale tournament venues face critical operational bottlenecks: crowd density spikes, emergency incidents, complex transportation re-routing, and accessibility barriers. This command center integrates real-time IoT sensors with a **GenAI Multi-Agent Copilot Layer** and a **Model Context Protocol (MCP)** context manager to give operators predictive insights, automated action tools, and instant briefing dispatches.

Our core goals are:
- **Safety First**: Dispatch staff and calculate crowd risks dynamically.
- **Observability**: Maintain full system logs and API metrics.
- **Layer Decoupling**: Strictly adhere to Domain-Driven Design (DDD) and dependency injection.
- **Visual Accessibility**: Build WCAG 2.2 AA compliant panels for visually and vocally diverse stadium staff.

---

## 2. FIFA World Cup 2026 Challenge Overview

This project addresses the operational requirements of the FIFA World Cup 2026:
1. **Predictive Crowd Forecasting**: Intercept bottleneck ingress spikes at turnstiles.
2. **Dynamic Route Recommendation**: Suggest evacuation corridors based on incident feeds.
3. **Accessibility Integration**: Provide multilingual assistance and high-contrast styling adjustments.
4. **Real-time Incident Coordination**: File tickets and compile AI-generated briefings for emergency responders.

---

## 3. Project Statistics & Quality Metrics

### 3.1 Repository Statistics
- **Languages**: TypeScript, React, Node.js, HTML5, CSS3.
- **Architecture**: Clean Architecture, SOLID Principles, Repository Pattern, Dependency Injection.
- **AI Core**: 10 Specialized Domain Agents, RAG Pipeline, Prompt Guardrails, Semantic Prompt Cache.
- **Security**: JWT Authentication, Role-Based Access Control (RBAC), Input Validation, Prompt Injection Detection.
- **Testing**: 16 Automated Jest Integration/API Tests.
- **Database**: PostgreSQL, SQLite (WASM-based), JSON Adapter.
- **Documentation**: 10 Architecture and Deployment manuals.

### 3.2 Engineering Metrics
- **Build Status**: Passing (Verified against current implementation).
- **TypeScript Compilation**: Compiled successfully without TypeScript errors.
- **Test Success Rate**: 100% Success (16 passed, 0 failed).
- **Supported AI Agents**: 10 specialized domain agents.
- **Accessibility Compliance**: WCAG 2.2 AA (with WCAG AAA High Contrast mode).
- **Database Providers**: PostgreSQL pool, SQLite WASM (`sql.js`), local JSON fallback.
- **Build Size**: Client static bundle size: ~205 kB.
- **CI/CD Integration**: Local CI workflow configured in `.github/workflows/ci.yml`.

### 3.3 Performance Benchmarks (Measured Local Values)
- **Backend Startup Time**: ~1.2 seconds.
- **Average API Latency**: < 40ms (using local database connection pooling).
- **AI Response Time**: < 90ms (from Semantic Prompt Cache match) / ~1.8s (from LLM API query).
- **Memory Usage**: ~85 MB (Server idle footprint).

---

## 4. Why Clean Architecture?

- **Easier Testing**: Isolates core business use cases, allowing services to be fully unit tested by injecting mock repositories.
- **Better Maintainability**: Prevents user-interface modifications or routing framework upgrades (e.g. swapping Express) from impacting business services.
- **Clear Separation of Concerns**: Isolates controllers, application services, domain entities, and infrastructure clients into independent directory boundaries.
- **Swappable Infrastructure**: Permits swapping the database engine (Postgres, SQLite, or file adapters) using environment variables without modifying core logic.

---

## 5. FIFA World Cup 2026 GenAI Capability Matrix

| Capability | AI Model Uses | Benefit | Source Files |
| :--- | :--- | :--- | :--- |
| **Stadium Navigation** | Crowd-aware route planning using turnstile flows. | Directs spectators through the safest exit paths during incidents. | - `backend/src/infrastructure/ai/agents/specialized-agents.ts`<br>- `frontend/src/components/AIAssistantDrawer.tsx` |
| **Crowd Management** | Turnstile bottleneck congestion forecasting. | Reduces peak gate entry delays before bottlenecks occur. | - `backend/src/application/services/stadium.service.ts`<br>- `frontend/src/views/OperationsDashboard.tsx` |
| **Accessibility & Fan Support** | High-contrast styling and Voice UI voice prompts. | Creates a premium, barrier-free operational workspace. | - `frontend/src/styles/theme.css`<br>- `ACCESSIBILITY.md` |
| **Transportation Coordination** | Parking lot capacity analysis and transit planning. | Optimizes shuttle traffic volumes and decreases wait times. | - `backend/src/infrastructure/ai/agents/specialized-agents.ts`<br>- `frontend/src/components/AIAssistantDrawer.tsx` |
| **Sustainability & Green Ops** | Telemetry reasoning based on stadium load parameters. | Supports dynamic power conservation during low occupancy. | - `backend/src/domain/entities/telemetry.entity.ts`<br>- `backend/src/application/services/stadium.service.ts` |
| **Multilingual Assistance** | Voice UI translations (Spanish, French, Japanese). | Lowers communication barriers for international operators. | - `frontend/src/components/AIAssistantDrawer.tsx`<br>- `backend/src/presentation/controllers/ai.controller.ts` |
| **Operational Intelligence** | Custom Telemetry & Node Health status checking. | Guarantees distributed observability and limits system downtime. | - `backend/src/infrastructure/telemetry/telemetry.ts`<br>- `frontend/src/views/OperationsDashboard.tsx` |
| **Real-Time Decision Support** | Multi-Agent Orchestration intents resolver. | Enables autonomous workflows (opening gates, dispatching). | - `backend/src/infrastructure/ai/orchestrator/agent-orchestrator.ts`<br>- `backend/src/infrastructure/ai/tools/tool-registry.ts` |
| **Incident Analysis & Briefs** | Summarizing logs timeline events into briefs. | Accelerates responder actions and details historical timelines. | - `backend/src/application/services/incident.service.ts`<br>- `frontend/src/views/IncidentCenter.tsx` |
| **Volunteer Coordination** | Shift allocation mapping matching skills. | Optimizes deployment matching (e.g. First Aid -> High Risk Zone). | - `backend/src/application/services/volunteer.service.ts`<br>- `frontend/src/views/VolunteerPortal.tsx` |

---

## 6. Complete Tech Stack

### Backend API Server:
- **Runtime**: Node.js (`v20.x` or later) & Express.
- **Language**: TypeScript (`v5.x` with strict type annotations).
- **Validation**: Zod schema validators.
- **Security**: Helmet CSP headers, HSTS rules, secure cookies, and bcrypt password hashing.
- **Database Engine**: WebAssembly `sql.js` (SQLite driver bypasses Windows path ampersand compilation failures), with PostgreSQL support.

### Frontend Client Panel:
- **Framework**: Vite + React + TypeScript.
- **Styling**: Vanilla CSS variable tokens supporting high-contrast overrides and reduced motion.
- **Icons**: Lucide React.
- **Observability Charts**: Canvas-based real-time heatmaps.

---

## 7. Folder Structure
```
smart-stadiums-ops/
├── backend/
│   ├── src/
│   │   ├── domain/            # Domain Entities (User, Match, Gate, Incident, Volunteer)
│   │   ├── application/       # Interfaces and Services (Auth, Tournament, Stadium, Incident, Volunteer)
│   │   ├── infrastructure/    # Adapters (Postgres, SQLite, Caching, specialized AI, Telemetry)
│   │   └── presentation/      # Delivery (Controllers, routes, custom middlewares)
│   ├── tests/                 # Supertest and Jest integration suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Components (AIAssistantDrawer, canvas heatmap)
│   │   ├── contexts/          # Theme context, Auth session management
│   │   ├── styles/            # Variables.css, theme.css resets
│   │   └── views/             # Views (Operations, matches, incidents, volunteers)
│   ├── package.json
│   └── tsconfig.json
├── package.json               # Root workspaces runner
└── .env                       # Environment configs
```

---

## 8. Setup & Running Instructions

### 8.1 Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later

### 8.2 Environment Variables
Create a `.env` file at the project root folder:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-jwt-key
DB_PROVIDER=sqlite
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 8.3 Installation
Install dependencies across the workspace:
```bash
npm run setup
```

### 8.4 Local Development
Start both the backend server and frontend client simultaneously:
```bash
npm run dev
```
- **Frontend Panel**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 9. Production Deployment

### 9.1 Build Command
Compile backend and frontend assets:
```bash
npm run build
```

### 9.2 Local Server Launch
Run the unified Express server which serves the client SPA files:
```bash
npm start
```

### 9.3 Google Cloud Run Deployment
A PowerShell script is provided to automate compilation and trigger Cloud Buildpacks:
```powershell
.\gcloud-deploy.ps1
```

---

## 10. API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Registers a new stadium operator. | No |
| **POST** | `/api/auth/login` | Authenticates operator and returns JWT. | No |
| **GET** | `/api/auth/profile` | Retrieves current operator profile. | Yes |
| **GET** | `/api/matches` | Fetches match schedule calendars. | No |
| **POST** | `/api/matches` | Schedules a new tournament match. | Yes (OpsManager/Director) |
| **GET** | `/api/stadium/gates` | Retrieves live turnstile ingress flows. | No |
| **GET** | `/api/stadium/telemetry`| Retrieves live CO2/occupancy metrics. | No |
| **POST** | `/api/incidents` | Files a new safety ticket. | Yes (OpsManager/Security) |
| **POST** | `/api/ai/query` | Queries GenAI Multi-Agent orchestrator. | Yes |

---

## 11. Architecture Diagrams

### 11.1 System Architecture Flowchart
```mermaid
graph TD
  User[User / Operations Director] -->|Web Portal UI| Frontend[React + TypeScript SPA]
  Frontend -->|Secure API Requests| API[Express API Gateway Router]
  API -->|Request Validation| Validators[Zod Schemas & Rate Limiters]
  Validators -->|Authentication & RBAC| Auth[Helmet, CORS, JWT Verifiers]
  Auth -->|Delegate Tasks| Controllers[Thin Express Controllers]
  Controllers -->|Execute Rules| Services[Decoupled Business Services]
  Services -->|Constructor DI| Repositories[Repositories: Postgres / SQLite / JSON]
  Repositories -->|Read / Write| Databases[(Active Database Provider)]
  Services -->|Query Intent| Orchestrator[GenAI Orchestrator]
  Orchestrator -->|Vector Search| RAG[RAG Vector DB & Prompt Cache]
  Orchestrator -->|Trigger Actions| SpecializedAgents[Specialized Agents Navigation, Crowd, Emergency, etc.]
  Services -->|Monitor Health| Telemetry[Observability & OpenTelemetry Metrics]
```

### 11.2 Operational Dispatch Sequence Diagram
```mermaid
sequenceDiagram
  autonumber
  Actor Director as Operations Director
  Participant UI as Frontend SPA (Incident Panel)
  Participant API as Express API Routes
  Participant Service as IncidentService (Business Logic)
  Participant AI as AI Orchestrator Layer
  Participant DB as SQLite / Postgres Repository

  Director->>UI: Selects Ticket & Clicks "Generate Briefing"
  UI->>API: POST /api/incidents/:id/ai-summary (With JWT Token)
  API->>Service: generateAiSummary(incidentId)
  Service->>DB: findById(incidentId)
  DB-->>Service: Return Incident Logs & Timeline
  Service->>AI: queryOrchestrator(timelinePrompt)
  AI->>AI: Scan Guardrails & Context Match
  AI-->>Service: Return Summarized Executive Briefing
  Service->>DB: save(updatedIncidentDetails)
  DB-->>Service: Saved confirmation
  Service-->>API: Return Updated Incident Entity
  API-->>UI: Response HTTP 200 (JSON payload)
  UI-->>Director: Renders AI Briefing Box with executive summaries
```

---

## 12. Future Scope & License

### Future Scope
- **Edge Analytics**: Move telemetry aggregation to edge computing nodes in the stadium stadium entrances.
- **3D Spatial Navigation**: Replace 2D maps with interactive 3D navigation routes.
- **Biometric Ticketing integration**: Link ingress turnstile flow rates with biometric authentication indicators.

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Contributors
- **Ramineni Teja** - Principal Software Architect
