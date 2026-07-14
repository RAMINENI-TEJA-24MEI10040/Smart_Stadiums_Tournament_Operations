# AI Engine Specifications: GenAI Agent Copilot & RAG

This document outlines the design, specialized agents, RAG pipeline, safety guardrails, and evaluation metrics of the Smart Stadium AI layer.

---

## 1. GenAI Multi-Agent Architecture

Rather than a single general-purpose chatbot, the platform uses a **collaborative network of specialized domain agents** coordinated by a central orchestrator. Each agent is purpose-built to answer a specific operational domain and is given a precisely scoped system instruction, preventing out-of-scope hallucinations.

### 1.1 Specialized Agent Roster

| Agent | Domain Responsibility |
| :--- | :--- |
| **Crowd Intelligence Agent** | Evaluates gate ingress limits, flow rates, and queue times — forecasts congestion hotspots. |
| **Emergency Response Agent** | Directs evacuations, checks open safety tickets, and suggests immediate dispatcher commands. |
| **Volunteer Coordinator Agent** | Assesses volunteer tasks and optimizes staffing reallocations based on section risk ratings. |
| **Sustainability Agent** | Recommends lighting/HVAC offsets to conserve power and reduce the carbon footprint. |
| **Accessibility Agent** | Formulates voice-first directions and high-contrast routes for disabled fans and staff. |
| **Transportation Agent** | Evaluates parking lot metrics and optimizes shuttle schedules. |
| **Operations Copilot** | Handles Q&A about match calendars, ticketing rules, and general stadium FAQs. |
| **Incident Analysis Agent** | Reads incident logs and compiles executive briefing summaries. |
| **Telemetry Insights Agent** | Reads CO2, power, water, and occupancy metrics and delivers sustainability insights. |
| **Safety Compliance Agent** | Cross-references actions against operational safety regulations. |

---

## 2. The AI Execution Pipeline

Every user query passes through a sequential multi-stage pipeline before reaching the LLM. Each layer has a clear, single responsibility:

```
┌────────────────────────┐
│     User Request       │  ← Operator types or dictates a command
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  Security Guardrails   │  ← Blocks injections, masks PII
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│   Intent Detection     │  ← Classifies domain, selects target agent
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  Agent Selection       │  ← Routes to one of 10 specialized agents
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│   MCP Context Fetch    │  ← Pulls live DB state (gates, incidents, volunteers)
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│   RAG Vector Search    │  ← Retrieves matching safety handbook chunks
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  Prompt Assembly       │  ← Merges system role + MCP data + RAG + user query
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│   LLM Processing       │  ← Sends assembled prompt to Gemini API
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│ Response Validation    │  ← Verifies claims against DB; checks confidence
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  Tool Call Extraction  │  ← Parses actionable commands (e.g., open gate)
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│   Final Response       │  ← Sanitized text + voice returned to drawer
└────────────────────────┘
```

### Layer Responsibilities

1. **User Request** — The operator inputs a query via text (keyboard) or speech (microphone button using Web Speech API).

2. **Security Guardrails** — The `AiGuardrails` class scans the raw query for:
   - **Prompt Injection**: Lexical matching against bypass phrases (e.g. *"ignore all previous instructions"*). Blocked inputs return an immediate rejection.
   - **PII Redaction**: Regex patterns replace phone numbers, credit card numbers, and emails with `[PHONE_MASKED]`, `[CARD_MASKED]`, `[EMAIL_MASKED]`.
   - **Toxicity Filter**: High-risk aggressive keywords trigger a warning log and block the query.

3. **Intent Detection** — The `AgentOrchestrator` classifies the sanitized query text into one of the domain categories (Crowd, Emergency, Navigation, Volunteer, etc.) using keyword pattern matching and context weighting.

4. **Agent Selection** — The orchestrator selects the matching specialized agent by its intent key and uses its dedicated system instruction prompt. Each agent has a scoped persona (e.g., *"You are the Crowd Intelligence Agent..."*) that reduces off-topic generation.

5. **MCP Context Fetch** — The orchestrator queries live operational data from the database (Model Context Protocol layer): current gate statuses, open incident tickets, volunteer availability, and telemetry metrics. This ensures recommendations are grounded in current state rather than historical training data.

6. **RAG Vector Search** — The local in-memory RAG engine:
   - Tokenizes the query using a TF-IDF vectorizer.
   - Computes **Cosine Similarity** against pre-indexed document chunks from safety handbooks (`emergency_procedures.txt`, `stadium_map.txt`, `sustainability_guidelines.txt`).
   - Retrieves the top-ranked chunks scoring above a `0.05` threshold.
   - Uses a hybrid score: `(cosine_similarity × 0.7) + (keyword_frequency × 0.3)`.

7. **Prompt Assembly** — A structured prompt is built from four segments:
   - System role instruction for the selected agent.
   - MCP live context (JSON-serialized database state).
   - RAG-retrieved document excerpts (safety regulations).
   - The cleaned user query.

8. **LLM Processing** — The assembled prompt is sent to the Gemini API (`gemini-1.5-flash` by default). If no API key is configured, the `MockAIProvider` generates deterministic structured responses matching the intent type.

9. **Response Validation** — The output is validated before delivery:
   - Gate references are cross-checked against the database (e.g., if the AI recommends opening Gate 4, the system verifies Gate 4 exists and its current state).
   - Structured JSON parsing is attempted and tested for schema compliance.
   - A **confidence score** is computed from: verification pass rate, response length, and schema validity.

10. **Tool Call Extraction** — The validator scans the response for embedded tool directives (e.g., `updateGateStatus`, `dispatchVolunteer`). Any recognised commands are returned alongside the text response as `suggestedTools` for the operator to approve.

11. **Final Response** — The sanitized text and tool suggestions are sent back to the frontend drawer. If voice mode is enabled, `window.speechSynthesis` reads the response aloud via Text-to-Speech.

---

## 3. Semantic Cache & Performance Tuning

To decrease query latencies and save API costs:

- **Cache Store**: An in-memory `Map<string, CacheEntry>` holds past query vectors and their responses.
- **Similarity Gate**: Incoming prompts are vectorized and compared against cached queries. If the **Cosine Similarity score > 0.96**, the cached response is returned immediately — bypassing the LLM API call.
- **TTL Expiry**: Cache entries expire after a configurable TTL (default: 5 minutes) to prevent stale operational data.
- **Measured Benefit**: Cache hits reduce response latency from ~1.8 seconds down to under 10 ms.

---

## 4. In-Memory RAG Vector Pipeline

```
Knowledge Base Documents
       ↓
  Text Chunking (500-token segments)
       ↓
  TF-IDF Vectorization (local, no external embeddings API)
       ↓
  Cosine Similarity Ranking
       ↓
  Threshold Filtering (score > 0.05)
       ↓
  Context Compression → Prompt Assembly
```

Knowledge base sources currently indexed:
- `stadium_map.txt` — Gate coordinates and corridor layouts.
- `emergency_procedures.txt` — FIFA crowd safety and evacuation protocols.
- `sustainability_guidelines.txt` — Power and water conservation targets.

---

## 5. Safety Guardrails Summary

| Protection Layer | Threat Mitigated | Implementation |
| :--- | :--- | :--- |
| Prompt Injection Filter | Jailbreak / instruction override | Lexical keyword blocklist |
| PII Redactor | Personal data leakage | Regex replace patterns |
| Toxicity Scanner | Offensive or threatening content | Keyword severity scoring |
| Output Validator | Hallucinated gate/resource references | Cross-check against DB |
| Confidence Scorer | Low-quality / incomplete responses | Multi-metric scoring |

---

## 6. AI Evaluation Metrics

AI execution metrics are logged by `AiEvaluator` on every request:

| Metric | Description |
| :--- | :--- |
| **Latency (ms)** | Total time from query receipt to response dispatch. |
| **Token Cost (USD)** | Computed at `$0.000075/1K input tokens` and `$0.000300/1K output tokens`. |
| **Confidence Score** | Float `0–1` combining verification pass, schema validity, and response structure. |
| **Cache Hit Rate** | Percentage of requests served from semantic cache vs live LLM calls. |
| **Hallucination Flag Count** | Count of responses where DB cross-check found invalid references. |
