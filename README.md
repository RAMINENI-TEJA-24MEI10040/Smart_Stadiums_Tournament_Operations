# Smart Stadiums & Tournament Operations Command Center 🏟️

Smart Stadiums & Tournament Operations is an enterprise-grade, Clean Architecture dashboard designed to unify stadium safety, ticketing logistics, volunteer coordinate shifts, and match scheduling. 

Powered by a **GenAI Multi-Agent Copilot Layer** and a **Model Context Protocol (MCP)** context manager, the system utilizes specialized agents to predict gate bottlenecks, suggest staffing adjustments, write safety briefing reports, and execute operational instructions in real-time.

---

## 1. Core Architecture

The project strictly follows **Clean Architecture** and **Domain-Driven Design (DDD)** guidelines.

```
                      [ User / Client Client ]
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Presentation Layer   │ (Express REST routes, CORS)
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Application Layer    │ (Services: Auth, Tournament, Stadium)
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Domain Layer      │ (Entities: Match, Gate, Incident)
                    └────────────────────────┘
                                ▲
                                │
                    ┌───────────┴────────────┐
                    │  Infrastructure Layer  │ (DB Factory, specialized AI, Cache)
                    └────────────────────────┘
```

---

## 2. Generative AI Orchestrator Workflow

Queries are processed through an agentic workspace integrating Model Context Protocol and local RAG:

```
               [ User Command / Verb Query ]
                             │
                             ▼
                 [ Security Guardrails ]
           (PII mask & Prompt injection scanner)
                             │
                             ▼
                 [ Planner / Classifier ]
         (Detects intent and selects target Agent)
                             │
                             ▼
                    [ Gather Context ]
         (MCP DB queries + Hybrid RAG matching)
                             │
                             ▼
                 [ Specialized AI Agent ]
         (Generates recommendations & action tools)
                             │
                             ▼
                   [ Output Validator ]
            (Hallucination checks & DB verification)
                             │
                             ▼
                [ Sanitized Response + Tools ]
```

---

## 3. Directory Layout

```
smart-stadiums-ops/
├── backend/
│   ├── src/
│   │   ├── domain/            # Core business models (User, Match, Gate, Incident, Volunteer)
│   │   ├── application/       # Use cases (Auth, Tournament, Stadium, Incident, Volunteer Services)
│   │   ├── infrastructure/    # Concrete clients (Postgres, SQLite, Caching, specialized AI, Telemetry)
│   │   └── presentation/      # Delivery methods (Controllers, routes, custom middlewares)
│   ├── tests/                 # Supertest and Jest integration suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # UI components (AIAssistantDrawer, canvas heatmap)
│   │   ├── contexts/          # Theme context, Auth session management
│   │   ├── styles/            # Variables.css, theme.css resets
│   │   └── views/             # Views (Operations, matches, incidents, volunteers)
│   ├── package.json
│   └── tsconfig.json
├── package.json               # Root workspaces runner
└── .env                       # Environment configs
```

---

## 4. Setup & Running Instructions

### 4.1 Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later

### 4.2 Installation
1. Clone the repository and navigate into the folder.
2. Initialize environment configurations:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies across the workspace:
   ```bash
   npm run setup
   ```

### 4.3 Running Locally
Start both the backend Express server and frontend React client simultaneously:
```bash
npm run dev
```
- **Frontend Panel**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 5. Verification & Testing

Verify system stability using the multi-tiered test suite:

### 5.1 Run Tests
```bash
npm run test:backend
```

### 5.2 Code Auditing (Lint & Compile Checks)
```bash
npm run lint
```
```bash
npm run build
```
---

## 6. WCAG 2.2 AA Accessibility Mappings

- **Keyboard navigation**: Full Tab navigation across tabs, forms, and drawer overlays with visible outline focus indicators.
- **Skip Link**: Bypasses header navigation directly to content.
- **Screen Reader Support**: Complete ARIA landmarks, roles, and live regions.
- **Contrast**: Contrast ratios exceed 4.5:1, with a high contrast button supplying a 7:1 ratio.
- **Voice UI**: Speech-to-text dictation and speech feedback (TTS) integrated directly into the Copilot drawer.
