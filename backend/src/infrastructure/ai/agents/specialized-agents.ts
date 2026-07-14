import { IAIProvider, aiProviderInstance } from '../providers/ai-provider';
import { PromptTemplates } from '../prompts/prompt-templates';
import { ragEngineInstance, RagEngine } from '../rag/rag-engine';

export abstract class BaseAgent {
  protected provider: IAIProvider;
  protected rag: RagEngine;

  constructor(
    provider: IAIProvider = aiProviderInstance,
    rag: RagEngine = ragEngineInstance
  ) {
    this.provider = provider;
    this.rag = rag;
  }

  public abstract run(query: string, mcpContext: any): Promise<any>;
}

export class CrowdIntelligenceAgent extends BaseAgent {
  public async run(query: string, mcpContext: any): Promise<any> {
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

export class EmergencyResponseAgent extends BaseAgent {
  public async run(query: string, mcpContext: any): Promise<any> {
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

export class VolunteerCoordinatorAgent extends BaseAgent {
  public async run(query: string, mcpContext: any): Promise<any> {
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

export class SustainabilityAgent extends BaseAgent {
  public async run(query: string, mcpContext: any): Promise<any> {
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

export class AccessibilityAgent extends BaseAgent {
  public async run(query: string, mcpContext: any): Promise<any> {
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

export class TransportationAgent extends BaseAgent {
  public async run(query: string, _mcpContext: any): Promise<any> {
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

export class AnalyticsAgent extends BaseAgent {
  public async run(query: string, mcpContext: any): Promise<any> {
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

export class OperationsCopilot extends BaseAgent {
  public async run(query: string, mcpContext: any): Promise<any> {
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
