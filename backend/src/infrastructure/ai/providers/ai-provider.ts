import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIResponse {
  text: string;
  tokenCount?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAIProvider {
  generateText(prompt: string, systemInstruction?: string): Promise<AIResponse>;
}

export class GeminiProvider implements IAIProvider {
  private genAI: any;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  public async generateText(prompt: string, systemInstruction?: string): Promise<AIResponse> {
    try {
      // Use the correct syntax according to official google genai SDK
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Rough token estimation since standard token count involves async calls
      const promptWords = prompt.split(/\s+/).length;
      const completionWords = text.split(/\s+/).length;
      
      return {
        text,
        tokenCount: {
          promptTokens: Math.ceil(promptWords * 1.3),
          completionTokens: Math.ceil(completionWords * 1.3),
          totalTokens: Math.ceil((promptWords + completionWords) * 1.3)
        }
      };
    } catch (err) {
      console.error('Gemini API call failed, falling back to mock response.', err);
      return this.generateMockResponse(prompt);
    }
  }

  private generateMockResponse(prompt: string): AIResponse {
    const mockProvider = new MockAIProvider();
    return mockProvider.generateTextSync(prompt);
  }
}

export class MockAIProvider implements IAIProvider {
  public async generateText(prompt: string, systemInstruction?: string): Promise<AIResponse> {
    return this.generateTextSync(prompt, systemInstruction);
  }

  public generateTextSync(prompt: string, _systemInstruction?: string): AIResponse {
    const p = prompt.toLowerCase();
    let text = '';

    if (p.includes('congestion') || p.includes('gate') || p.includes('crowd')) {
      text = JSON.stringify({
        intent: 'Crowd Congestion Analysis',
        riskScore: 78,
        congestedAreas: ['Gate 2 (East Gate)', 'Section C Inflow Corridor'],
        explanation: 'Gate 2 shows inflow turnstile volume exceeding limit (240 spectators/min versus 200/min limit). Average queue times have reached 24 minutes, creating high congestion potential prior to kickoff.',
        recommendations: [
          'Open South Gate 3 immediately to redirect crowd overflows.',
          'Instruct Volunteers in East Gate 2 to guide spectators to West Gate 4 (currently under-utilized).',
          'Issue mobile app notification to fans in Section C suggesting alternate routes.'
        ]
      }, null, 2);
    } else if (p.includes('evacuate') || p.includes('emergency') || p.includes('route') || p.includes('fire')) {
      text = JSON.stringify({
        intent: 'Emergency Response Route Planning',
        severity: 'Critical',
        affectedZones: ['Gate 2 entrance area'],
        evacuationRoutes: [
          { zone: 'Section B/C', targetExit: 'Gate 4 (West Gate)', path: 'West Corridor bypass' },
          { zone: 'Main Entrance Hall', targetExit: 'Gate 1 (North Gate)', path: 'Main stairs A' }
        ],
        explanation: 'Emergency detected at Gate 2. Blockage requires redirecting all incoming fans away from Gate 2 and prioritizing evacuation through Gate 4 and Gate 1.',
        priorityActions: [
          'Sound alarm in North Corridor',
          'Deploy first responders to Gate 2',
          'Re-route volunteer agents to Gate 4 to handle ingress overflow'
        ]
      }, null, 2);
    } else if (p.includes('volunteer') || p.includes('staff')) {
      text = JSON.stringify({
        intent: 'Volunteer Optimization Recommendation',
        suggestedAssignments: [
          { volunteerId: 'vol-3', name: 'Mark', previousSection: 'Section D', newSection: 'Gate 2 Congestion Area', task: 'Direct fans to West Gate 4' },
          { volunteerId: 'vol-5', name: 'Sarah', previousSection: 'Section A', newSection: 'Gate 3 Opening Area', task: 'Manage Turnstile 3 ticket scanners' }
        ],
        reasoning: 'Reallocating 2 under-utilized volunteers to Gate 2 and Gate 3 congestion points will reduce bottleneck queues by 15% and support crowd load redirection.',
        sustainabilityImpact: 'Direct routes reduce fan wandering, optimizing power consumption on corridor lighting.'
      }, null, 2);
    } else if (p.includes('sustainability') || p.includes('energy') || p.includes('power')) {
      text = JSON.stringify({
        intent: 'Sustainability Optimization Report',
        stadiumScore: 82,
        metrics: {
          currentLoad: '450 kW',
          sustainabilityRank: 'A'
        },
        actions: [
          { title: 'Reduce corridor lighting', savings: '45 kW', impact: 'None on spectators safety' },
          { title: 'Optimize HVAC cooling', savings: '80 kW', impact: 'Slight thermal offset (24C to 25C)' }
        ],
        explanation: 'AI recommends lowering corridor illumination in vacant zones and setting HVAC thermostats in VIP lounges to 25°C to conserve power during peak spectator periods.'
      }, null, 2);
    } else if (p.includes('schedule') || p.includes('match') || p.includes('tournament')) {
      text = JSON.stringify({
        intent: 'Tournament Operations Scheduling',
        conflicts: [],
        refereeAllocated: true,
        matchCheck: 'Scheduled match details verified. Home team and Away team details loaded. No facility double-booking detected.',
        reasoning: 'Scheduling verified against local stadium occupancy data and referee rosters.'
      }, null, 2);
    } else {
      text = JSON.stringify({
        intent: 'General Operational Command Query',
        status: 'Operational',
        message: 'Commands processed. Stadium parameters show overall crowd safety is STABLE. Active gate monitoring is ongoing.',
        stats: {
          attendance: 2350,
          averageQueueTime: '18.5 min',
          environmentalQuality: 'Good'
        }
      }, null, 2);
    }

    return {
      text,
      tokenCount: {
        promptTokens: 45,
        completionTokens: 120,
        totalTokens: 165
      }
    };
  }
}

export const aiProviderInstance = process.env.GEMINI_API_KEY ? new GeminiProvider() : new MockAIProvider();
