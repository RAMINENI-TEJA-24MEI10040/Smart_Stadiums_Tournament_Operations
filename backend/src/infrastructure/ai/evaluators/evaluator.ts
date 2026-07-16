export interface AiMetricLog {
  timestamp: Date;
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
  latencyMs: number;
  success: boolean;
  hallucinationFlagged: boolean;
}

/** Aggregated AI performance metrics summary. */
export interface AiMetricsSummary {
  totalRequests: number;
  averageLatencyMs: number;
  totalTokensConsumed: number;
  totalCostUSD: number;
  hallucinationRate: number;
  averageAccuracy: number;
}

export class AiEvaluator {
  private static logs: AiMetricLog[] = [];
  
  /** Gemini 1.5 Flash Pricing – input cost per 1K tokens. */
  private static readonly INPUT_COST_PER_K = 0.000075; 
  /** Gemini 1.5 Flash Pricing – output cost per 1K tokens. */
  private static readonly OUTPUT_COST_PER_K = 0.0003; 

  public static logMetric(
    promptTokens: number,
    completionTokens: number,
    latencyMs: number,
    success: boolean,
    hallucinationFlagged: boolean
  ): void {
    const inputCost = (promptTokens / 1000) * this.INPUT_COST_PER_K;
    const outputCost = (completionTokens / 1000) * this.OUTPUT_COST_PER_K;
    const totalCost = inputCost + outputCost;

    this.logs.push({
      timestamp: new Date(),
      promptTokens,
      completionTokens,
      costUSD: totalCost,
      latencyMs,
      success,
      hallucinationFlagged
    });
  }

  /** Returns an aggregated summary of all logged AI metrics. */
  public static getMetricsSummary(): AiMetricsSummary {
    const totalRequests = this.logs.length;
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        averageLatencyMs: 0,
        totalTokensConsumed: 0,
        totalCostUSD: 0,
        hallucinationRate: 0,
        averageAccuracy: 100
      };
    }

    const totalTokens = this.logs.reduce((sum, l) => sum + l.promptTokens + l.completionTokens, 0);
    const totalCost = this.logs.reduce((sum, l) => sum + l.costUSD, 0);
    const totalLatency = this.logs.reduce((sum, l) => sum + l.latencyMs, 0);
    const hallucinations = this.logs.filter(l => l.hallucinationFlagged).length;
    const failures = this.logs.filter(l => !l.success).length;

    const averageLatency = totalLatency / totalRequests;
    const hallucinationRate = (hallucinations / totalRequests) * 100;
    const successRate = ((totalRequests - failures) / totalRequests) * 100;

    return {
      totalRequests,
      averageLatencyMs: Math.round(averageLatency),
      totalTokensConsumed: totalTokens,
      totalCostUSD: Number(totalCost.toFixed(6)),
      hallucinationRate: Number(hallucinationRate.toFixed(2)),
      averageAccuracy: Number(successRate.toFixed(2)) // Success rate acts as proxy for accuracy
    };
  }

  public static getLogs(): AiMetricLog[] {
    return this.logs;
  }

  public static clear(): void {
    this.logs = [];
  }
}
