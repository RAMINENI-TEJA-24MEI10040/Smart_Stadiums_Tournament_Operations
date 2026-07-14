# AI Engine Specifications: GenAI Agent Copilot & RAG

This document outlines the design, specialized agents, RAG pipeline, safety guardrails, and metrics evaluation of the Smart Stadium AI layer.

---

## 1. GenAI Multi-Agent Architecture

Rather than a single chatbot, the stadium uses a **collaborative network of specialized agents**. These agents are coordinated by a central orchestrator which detects intent, gathers Model Context Protocol (MCP) data, retrieves safety regulations via RAG, and invokes the target agent.

### 1.1 Specialized Agent Roster
- **Crowd Intelligence Agent**: Evaluates gate ingress limits, flow rates, queue times, and forecasts congestions.
- **Emergency Response Agent**: Directs evacuations, checks security tickets, and suggests immediate dispatcher commands.
- **Volunteer Coordinator Agent**: Assesses volunteer tasks and optimizes staffing reallocations based on section congestions.
- **Sustainability Agent**: Recommends lighting/HVAC offsets to conserve power and reduce the carbon footprint.
- **Accessibility Agent**: Formulates voice-first UI directions and high-contrast routes for disabled fans.
- **Transportation Agent**: Evaluates traffic parking lot metrics and shuttle schedules.
- **Operations Copilot (General)**: Handles Q&A about match calendars, ticketing rules, and general stadium information.

---

## 2. The AI Pipeline & Execution Workflow

Every user query triggers a sequential multi-stage execution pipeline:

```
User Query ──► [Guardrails Scan] ──► [Intent Classifier] ──► [Context Compiler (MCP)]
                                                                      │
                                                                      ▼
[Response Validation] ◄── [LLM processing] ◄── [RAG Vector Search & Prompt Builder]
```

### Responsibility of Every Layer
1. **User Request Layer**: Receives the string query (or speech transcription) from the client drawer.
2. **Safety Guardrails Scan**: Lexically parses the query. Blocks prompt injections and filters out offensive toxicity. Masks PII parameters (emails, cards, phones).
3. **Intent Detection Layer**: Classifies the sanitized input into specific domain intents (e.g. Navigation request vs Incident report request).
4. **Context Manager (Model Context Protocol - MCP)**: Fetches live stadium database entities (e.g., turnstile flows, incidents status feeds, volunteer availability) to provide real-time context.
5. **RAG Vector Search**: Indexes matching safety codes or evacuation manuals using local TF-IDF vector math and ranks document chunks using Cosine Similarity.
6. **Prompt Constructor**: Merges the system guidelines, active MCP entity data, RAG chunks, and user query into a single structured prompt.
7. **LLM Processor**: Sends the prompt to the Gemini API (or the local mock provider if offline).
8. **Response Validator**: Validates the model's instructions against database truths (e.g. confirming that a gate the AI recommends opening is actually closed).
9. **Confidence Scorer**: Computes a confidence rating based on verification passes, token counts, and accuracy indexes.
10. **Client Dispatcher**: Returns the response object (JSON + voice text) back to the UI panel.

---

## 3. In-Memory RAG Vector Pipeline

To give the AI precise context on stadium layout and safety regulations, we implement an in-memory RAG pipeline:

1. **Knowledge base chunking**: Splits documents (`stadium_map.txt`, `emergency_procedures.txt`, `sustainability_guidelines.txt`) into context segments.
2. **Local Vector Embeddings**: Tokenizes texts and maps frequencies using an in-memory TF-IDF dictionary to construct text vectors.
3. **Hybrid Search Querying**:
   - Computes *Cosine Similarity* between query vectors and document chunks ($Score_{semantic} \cdot 0.7$).
   - Calculates term-match frequencies ($Score_{keyword} \cdot 0.3$).
   - Multiplies and ranks results.
4. **Re-ranking**: Drops results with scores below $0.05$. Context-compresses the remaining chunks into a dense prompt payload.

---

## 4. Semantic Cache & Performance Tuning

To decrease query latencies and save API costs:
- **Semantic Cache**: An in-memory cache stores past queries and their corresponding AI responses.
- **Similarity Checking**: Incoming prompts are vector-compared against cached queries. If the cosine similarity exceeds **0.96**, the system immediately serves the cached response, bypassing the LLM API call entirely.
- **Uptime Efficiency**: Reduces latency from ~1.5s down to **<10ms**.
