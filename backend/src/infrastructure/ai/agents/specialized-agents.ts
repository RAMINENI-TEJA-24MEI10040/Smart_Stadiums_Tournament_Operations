import { IAIProvider, AIResponse, aiProviderInstance } from '../providers/ai-provider';
import { PromptTemplates } from '../prompts/prompt-templates';
import { ragEngineInstance, RagEngine } from '../rag/rag-engine';
import { McpContext } from '../orchestrator/agent-orchestrator';

/**
 * Abstract base class for all specialized AI agents.
 * Provides constructor-injected AI provider and RAG engine dependencies.
 */
export abstract class BaseAgent {
  protected readonly provider: IAIProvider;
  protected readonly rag: RagEngine;

  constructor(
    provider: IAIProvider = aiProviderInstance,
    rag: RagEngine = ragEngineInstance
  ) {
    this.provider = provider;
    this.rag = rag;
  }

  /** Executes the agent's specialized analysis pipeline. */
  public abstract run(query: string, mcpContext: McpContext): Promise<AIResponse>;
}

/** Analyzes turnstile flows, identifies bottlenecks, and calculates congestion risk. */
export class CrowdIntelligenceAgent extends BaseAgent {
  public async run(query: string, mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('Crowd');
    const docs = this.rag.search(query, 2);
    const compressedDocs = this.rag.compressContext(docs);

    const userPrompt = `
      USER QUERY: ${query}
      
      RETRIEVED KNOWLEDGE DOCUMENTS:
      ${compressedDocs}

      LIVE TELEMETRY STATE:
      ${JSON.stringify(mcpContext.telemetry || {}, null, 2)}
      
      STADIUM GATES STATE:
      ${JSON.stringify(mcpContext.gates || [], null, 2)}

      Analyze turnstile flows, identify bottlenecks, calculate risk index (0-100), explain reasoning, and return recommendations.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}

/** Plans evacuation routes and emergency response deployment orders. */
export class EmergencyResponseAgent extends BaseAgent {
  public async run(query: string, mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('Emergency');
    const docs = this.rag.search(query, 3);
    const compressedDocs = this.rag.compressContext(docs);

    const userPrompt = `
      USER QUERY: ${query}
      
      RETRIEVED SAFETY MANUALS:
      ${compressedDocs}

      ACTIVE INCIDENTS RECORDED:
      ${JSON.stringify(mcpContext.incidents || [], null, 2)}
      
      STADIUM GATES:
      ${JSON.stringify(mcpContext.gates || [], null, 2)}

      Prioritize emergencies. Map evacuation zones. Define alternate safety routes. Outline clear deployment orders.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}

/** Optimizes volunteer roster assignments based on skills and location gaps. */
export class VolunteerCoordinatorAgent extends BaseAgent {
  public async run(query: string, mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('Volunteer');
    const docs = this.rag.search(query, 2);
    const compressedDocs = this.rag.compressContext(docs);

    const userPrompt = `
      USER QUERY: ${query}
      
      RELEVANT STAFF ROSTER GUIDES:
      ${compressedDocs}

      ACTIVE VOLUNTEER LIST:
      ${JSON.stringify(mcpContext.volunteers || [], null, 2)}
      
      ACTIVE INCIDENTS:
      ${JSON.stringify(mcpContext.incidents || [], null, 2)}

      Identify under-utilized volunteer agents. Recommend re-assignments based on skills and location gaps. State logical reasoning.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}

/** Evaluates power, water, and carbon metrics to recommend sustainability actions. */
export class SustainabilityAgent extends BaseAgent {
  public async run(query: string, mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('Sustainability');
    const docs = this.rag.search(query, 2);
    const compressedDocs = this.rag.compressContext(docs);

    const userPrompt = `
      USER QUERY: ${query}
      
      STADIUM GREEN ENERGY POLICY:
      ${compressedDocs}

      LIVE UTILITY TELEMETRY:
      ${JSON.stringify(mcpContext.telemetry || {}, null, 2)}

      Evaluate power grid load and water flow. Recommend actions to lower consumption. Detail expected carbon offset savings.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}

/** Provides voice-first layout directions and wheelchair accessibility routing. */
export class AccessibilityAgent extends BaseAgent {
  public async run(query: string, mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('Accessibility');
    const docs = this.rag.search(query, 2);
    const compressedDocs = this.rag.compressContext(docs);

    const userPrompt = `
      USER QUERY: ${query}
      
      ACCESSIBILITY MANUALS:
      ${compressedDocs}

      ACTIVE STADIUM PARAMETERS:
      ${JSON.stringify(mcpContext.telemetry || {}, null, 2)}

      Provide voice-first layout directions, details on wheelchair facilities, and high contrast routing steps.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}

/** Calculates parking lot capacities and advises shuttle re-routing. */
export class TransportationAgent extends BaseAgent {
  public async run(query: string, _mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('Transportation');
    const docs = this.rag.search(query, 2);
    const compressedDocs = this.rag.compressContext(docs);

    const userPrompt = `
      USER QUERY: ${query}
      
      TRANSIT INFORMATION:
      ${compressedDocs}

      Calculate lot capacities, analyze gate traffic bottlenecks, and advice shuttle re-routing times.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}

/** Generates structured operational briefings from telemetry history. */
export class AnalyticsAgent extends BaseAgent {
  public async run(query: string, mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('Analytics');
    const userPrompt = `
      USER QUERY: ${query}
      
      HISTORICAL TELEMETRY LOGS:
      ${JSON.stringify(mcpContext.telemetryHistory || [], null, 2)}

      Create a structured operational briefing summarizing spectator flow, energy efficiency, and security response times.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}

/** General-purpose operations copilot for tournament and facility queries. */
export class OperationsCopilot extends BaseAgent {
  public async run(query: string, mcpContext: McpContext): Promise<AIResponse> {
    const systemPrompt = PromptTemplates.getPrompt('General');
    const docs = this.rag.search(query, 2);
    const compressedDocs = this.rag.compressContext(docs);

    const userPrompt = `
      USER QUERY: ${query}
      
      KNOWLEDGE CONTEXT:
      ${compressedDocs}

      CURRENT MATCH SCHEDULES:
      ${JSON.stringify(mcpContext.matches || [], null, 2)}

      Answer general query about tournaments or facilities rules. Provide reasoning.
    `;

    return this.provider.generateText(userPrompt, systemPrompt);
  }
}
