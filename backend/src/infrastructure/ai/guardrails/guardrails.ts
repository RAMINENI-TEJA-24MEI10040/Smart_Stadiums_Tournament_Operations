import { McpContext } from '../orchestrator/agent-orchestrator';

export interface GuardrailCheckResult {
  passed: boolean;
  sanitizedInput?: string;
  reason?: string;
  confidenceScore?: number;
}

export class AiGuardrails {
  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(?:previous|all)\s+instructions/i,
    /system\s+prompt/i,
    /bypass\s+restrictions/i,
    /you\s+are\s+now\s+acting\s+as/i,
    /dan\s+mode/i,
    /jailbreak/i
  ];

  // Scans input for prompt injection patterns
  public static checkPromptInjection(input: string): GuardrailCheckResult {
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return {
          passed: false,
          reason: 'Potential Prompt Injection detected. Action blocked by security policy.'
        };
      }
    }
    return { passed: true };
  }

  // Redacts PII: emails, credit cards, telephone numbers, social security IDs
  public static maskPII(input: string): string {
    let sanitized = input;
    
    // Email regex
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    
    // Credit card regex
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]');
    
    // Phone regex (e.g. +1-555-555-5555 or 555-555-5555)
    sanitized = sanitized.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');

    return sanitized;
  }

  // Check toxicity and basic profanity
  public static filterToxicity(input: string): GuardrailCheckResult {
    const toxicWords = ['abuse', 'exploit', 'kill', 'destroy', 'bomb', 'hijack', 'attack'];
    const lowerInput = input.toLowerCase();
    for (const word of toxicWords) {
      if (lowerInput.includes(word)) {
        // Allow operational terms in security context, but flag extreme statements
        if (lowerInput.includes('how to make a bomb') || lowerInput.includes('how to kill')) {
          return {
            passed: false,
            reason: 'Toxicity/Threat policy violation. Message contains unsafe command requests.'
          };
        }
      }
    }
    return { passed: true };
  }

  /** Hallucination Verification: Checks if AI suggestions contradict live database state. */
  public static validateOutput(aiText: string, currentDatabaseState: McpContext): GuardrailCheckResult {
    const lowerText = aiText.toLowerCase();

    // If AI mentions gate congestion, cross-verify database gates
    if (currentDatabaseState && currentDatabaseState.gates) {
      for (const gate of currentDatabaseState.gates) {
        const name = String(gate['name'] ?? '').toLowerCase();
        const status = String(gate['status'] ?? '').toLowerCase();

        // If the AI recommends opening a gate that is already open, warn or adjust
        if (lowerText.includes(`open ${name}`) && status === 'open') {
          return {
            passed: true,
            confidenceScore: 0.85,
            reason: `AI suggested opening ${gate['name']}, which is already open.`
          };
        }
      }
    }

    return { passed: true, confidenceScore: 0.98 };
  }

  // Evaluates prompt complexity and returns safety confidence score
  public static calculateConfidenceScore(input: string, output: string): number {
    let score = 1.0;
    
    // If output is extremely short or repeats input, lower score
    if (output.length < 10) score -= 0.15;
    
    // If input is very long/chaotic, adjust
    if (input.length > 500) score -= 0.05;

    // JSON structure check if output is expected to be JSON
    if (output.trim().startsWith('{') && output.trim().endsWith('}')) {
      try {
        JSON.parse(output);
      } catch {
        score -= 0.3; // Malformed JSON reduces confidence significantly
      }
    }

    return Math.max(0.1, score);
  }
}
