import { dbFactoryInstance } from '../../database/db-factory';
import { sessionMemoryInstance } from '../memory/session-memory';
import { AiGuardrails } from '../guardrails/guardrails';
import { AiEvaluator } from '../evaluators/evaluator';
import {
  CrowdIntelligenceAgent,
  EmergencyResponseAgent,
  VolunteerCoordinatorAgent,
  SustainabilityAgent,
  AccessibilityAgent,
  TransportationAgent,
  AnalyticsAgent,
  OperationsCopilot,
  BaseAgent
} from '../agents/specialized-agents';

export interface OrchestrationResult {
  agentName: string;
  responseText: string;
  confidenceScore: number;
  suggestedTools: any[];
  metrics: {
    latencyMs: number;
    tokens: number;
    costUSD: number;
  };
  warnings?: string;
}

export class AgentOrchestrator {
  private crowdAgent = new CrowdIntelligenceAgent();
  private emergencyAgent = new EmergencyResponseAgent();
  private volunteerAgent = new VolunteerCoordinatorAgent();
  private sustainabilityAgent = new SustainabilityAgent();
  private accessibilityAgent = new AccessibilityAgent();
  private transportationAgent = new TransportationAgent();
  private analyticsAgent = new AnalyticsAgent();
  private copilotAgent = new OperationsCopilot();

  // Primary entry orchestrator workflow
  public async orchestrate(
    query: string,
    sessionId: string = 'default-session'
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();

    // 1. AI Safety Guardrails: Prompt Injection & Toxicity Blocker
    const injectionCheck = AiGuardrails.checkPromptInjection(query);
    if (!injectionCheck.passed) {
      return this.generateSecurityBlockedResult('Security Guardrail', injectionCheck.reason!, startTime);
    }

    const toxicityCheck = AiGuardrails.filterToxicity(query);
    if (!toxicityCheck.passed) {
      return this.generateSecurityBlockedResult('Safety Guardrail', toxicityCheck.reason!, startTime);
    }

    // 2. Sensitive Data Masking (PII)
    const sanitizedQuery = AiGuardrails.maskPII(query);

    // 3. Conversation Memory lookup
    sessionMemoryInstance.appendMessage(sessionId, 'user', sanitizedQuery);

    // 4. Intent Classification / Planner Router
    const agentType = this.classifyIntent(sanitizedQuery);
    const agent = this.resolveAgent(agentType);

    // 5. Gather Model Context Protocol (MCP) Environment Data
    const mcpContext = await this.gatherMcpContext();

    // 6. Execute Specialized Agent
    let responseText = '';
    let tokensCount = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let success = true;

    try {
      const response = await agent.run(sanitizedQuery, mcpContext);
      responseText = response.text;
      if (response.tokenCount) {
        tokensCount = response.tokenCount;
      }
    } catch (err) {
      success = false;
      responseText = JSON.stringify({
        error: 'System execution error in AI node provider.',
        message: err instanceof Error ? err.message : String(err)
      });
    }

    const latencyMs = Date.now() - startTime;

    // 7. Guardrail Output Validation (Hallucination scan & verification)
    const validation = AiGuardrails.validateOutput(responseText, mcpContext);
    const confidenceScore = AiGuardrails.calculateConfidenceScore(sanitizedQuery, responseText);
    const hallucinationFlagged = !validation.passed || (validation.confidenceScore !== undefined && validation.confidenceScore < 0.9);

    // 8. Log Metrics in AI Evaluator
    AiEvaluator.logMetric(
      tokensCount.promptTokens,
      tokensCount.completionTokens,
      latencyMs,
      success,
      hallucinationFlagged
    );

    // 9. Session Memory Append Response
    sessionMemoryInstance.appendMessage(sessionId, 'model', responseText);

    // 10. Parse Suggested Tools based on agent recommendation details
    const suggestedTools = this.extractSuggestedTools(responseText);

    const lastLog = AiEvaluator.getLogs().slice(-1)[0] || { costUSD: 0 };

    return {
      agentName: agentType,
      responseText,
      confidenceScore: validation.confidenceScore || confidenceScore,
      suggestedTools,
      metrics: {
        latencyMs,
        tokens: tokensCount.totalTokens,
        costUSD: lastLog.costUSD
      },
      warnings: validation.reason
    };
  }

  private classifyIntent(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('evacuate') || q.includes('fire') || q.includes('incident') || q.includes('medical') || q.includes('security') || q.includes('alert')) {
      return 'Emergency';
    }
    if (q.includes('congestion') || q.includes('gate') || q.includes('turnstile') || q.includes('queue') || q.includes('crowd') || q.includes('heatmap') || q.includes('occupancy')) {
      return 'Crowd';
    }
    if (q.includes('volunteer') || q.includes('staff') || q.includes('shift') || q.includes('roster')) {
      return 'Volunteer';
    }
    if (q.includes('sustainability') || q.includes('energy') || q.includes('power') || q.includes('water') || q.includes('co2') || q.includes('carbon')) {
      return 'Sustainability';
    }
    if (q.includes('accessibility') || q.includes('disabled') || q.includes('wheelchair') || q.includes('voice') || q.includes('contrast')) {
      return 'Accessibility';
    }
    if (q.includes('parking') || q.includes('shuttle') || q.includes('traffic') || q.includes('transport') || q.includes('bus')) {
      return 'Transportation';
    }
    if (q.includes('report') || q.includes('briefing') || q.includes('history') || q.includes('analytics') || q.includes('summary')) {
      return 'Analytics';
    }
    return 'General';
  }

  private resolveAgent(type: string): BaseAgent {
    switch (type) {
      case 'Crowd': return this.crowdAgent;
      case 'Emergency': return this.emergencyAgent;
      case 'Volunteer': return this.volunteerAgent;
      case 'Sustainability': return this.sustainabilityAgent;
      case 'Accessibility': return this.accessibilityAgent;
      case 'Transportation': return this.transportationAgent;
      case 'Analytics': return this.analyticsAgent;
      default: return this.copilotAgent;
    }
  }

  private async gatherMcpContext(): Promise<any> {
    const repos = dbFactoryInstance.getRepositories();
    const [gates, matches, incidents, volunteers, telemetry, telemetryHistory] = await Promise.all([
      repos.gateRepository.findAll(),
      repos.matchRepository.findAll(),
      repos.incidentRepository.findAll(),
      repos.volunteerRepository.findAll(),
      repos.telemetryRepository.getLatest(),
      repos.telemetryRepository.getHistory(10)
    ]);

    return {
      gates: gates.map(g => g.toJSON()),
      matches: matches.map(m => m.toJSON()),
      incidents: incidents.map(i => i.toJSON()),
      volunteers: volunteers.map(v => v.toJSON()),
      telemetry: telemetry ? telemetry.toJSON() : null,
      telemetryHistory: telemetryHistory.map(t => t.toJSON())
    };
  }

  private extractSuggestedTools(text: string): any[] {
    const tools: any[] = [];
    const lower = text.toLowerCase();

    // Check for Gate commands: e.g. "open North Gate 1"
    if (lower.includes('open') && lower.includes('gate')) {
      if (lower.includes('gate-1') || lower.includes('north gate 1')) {
        tools.push({ name: 'updateGateStatus', params: { gateId: 'gate-1', status: 'Open' } });
      }
      if (lower.includes('gate-2') || lower.includes('east gate 2')) {
        tools.push({ name: 'updateGateStatus', params: { gateId: 'gate-2', status: 'Open' } });
      }
      if (lower.includes('gate-3') || lower.includes('south gate 3')) {
        tools.push({ name: 'updateGateStatus', params: { gateId: 'gate-3', status: 'Open' } });
      }
      if (lower.includes('gate-4') || lower.includes('west gate 4')) {
        tools.push({ name: 'updateGateStatus', params: { gateId: 'gate-4', status: 'Open' } });
      }
    }

    // Check for Volunteer allocations: e.g. "reallocate Mark to Gate 3"
    if (lower.includes('reallocate') || lower.includes('assign')) {
      tools.push({
        name: 'reallocateVolunteer',
        params: {
          volunteerId: 'vol-3', // Sample default matching mock data
          section: 'Gate 3 Egress Corridor',
          task: 'Crowd load redirection guidance'
        }
      });
    }

    // Check for Emergency Reports
    if (lower.includes('file incident') || lower.includes('report incident') || lower.includes('emergency at')) {
      tools.push({
        name: 'fileIncident',
        params: {
          title: 'AI Alert: Evacuation Corridor Congestion',
          description: 'Emergency route congestion report flagged by AI analysis.',
          severity: 'High',
          location: 'South Hallway Corridor'
        }
      });
    }

    return tools;
  }

  private generateSecurityBlockedResult(
    agentName: string,
    reason: string,
    startTime: Date | number
  ): OrchestrationResult {
    return {
      agentName,
      responseText: JSON.stringify({
        status: 'Blocked',
        reason,
        code: 'SEC_BLOCK'
      }, null, 2),
      confidenceScore: 0.0,
      suggestedTools: [],
      metrics: {
        latencyMs: Date.now() - Number(startTime),
        tokens: 0,
        costUSD: 0
      }
    };
  }
}

export const agentOrchestratorInstance = new AgentOrchestrator();
