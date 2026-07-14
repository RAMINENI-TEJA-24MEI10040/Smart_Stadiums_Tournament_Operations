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

## 2. In-Memory RAG Vector Pipeline

To give the AI precise context on stadium layout and safety regulations, we implement an in-memory RAG pipeline:

1. **Knowledge base chunking**: Splits documents (`stadium_map.txt`, `emergency_procedures.txt`, `sustainability_guidelines.txt`) into context segments.
2. **Local Vector Embeddings**: Tokenizes texts and maps frequencies using an in-memory TF-IDF dictionary to construct text vectors.
3. **Hybrid Search Querying**:
   - Computes *Cosine Similarity* between query vectors and document chunks ($Score_{semantic} \cdot 0.7$).
   - Calculates term-match frequencies ($Score_{keyword} \cdot 0.3$).
   - Multiplies and ranks results.
4. **Re-ranking**: Drops results with scores below $0.05$. Context-compresses the remaining chunks into a dense prompt payload.

---

## 3. AI Safety & Guardrails

The safety middleware ensures operations stay safe and PII remains secure:

- **Prompt Injection Filter**: Blocks prompts containing bypass keywords (e.g. "ignore previous instructions").
- **Toxicity Scanner**: Flags extreme command requests or threat words.
- **PII Masking Redactor**: Automatically redacts emails, credit card formats, and telephone sequences.
- **Hallucination Output Validator**: Cross-references AI recommendations with database facts. If the AI suggests opening an already-opened gate, the validator flags a warning and lowers the confidence score.
- **Confidence Scoring**: Evaluates output length, structured parsing success, and verification tests.

---

## 4. Evaluators & Metrics Dashboard

AI execution metrics are logged in `AiEvaluator`:

- **Token Cost Computations**:
  - Input tokens: \$0.000075 per 1K tokens.
  - Output tokens: \$0.000300 per 1K tokens.
- **Average Latency**: Tracks model execution durations.
- **Accuracy / Success Rate**: Computes success/failure ratios of API requests.
- **Hallucinations Log**: Stores historical counts of flagged validator events.
