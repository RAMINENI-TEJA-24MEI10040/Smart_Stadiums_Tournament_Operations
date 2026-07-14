import * as os from 'os';
import { AiEvaluator } from '../ai/evaluators/evaluator';

export interface SystemHealth {
  status: 'Healthy' | 'Degraded' | 'Critical';
  uptimeSec: number;
  memoryUsagePercentage: number;
  cpuLoadPercentage: number;
  activeDbConnections: number;
  errorsLogged: number;
  aiMetrics: any;
}

export class TelemetryProvider {
  private static apiLatencies: number[] = [];
  private static errorCount: number = 0;
  private static activeConnectionsCount: number = 0;

  // Log API response duration
  public static logApiDuration(ms: number): void {
    this.apiLatencies.push(ms);
    // Limit log size to last 50 entries
    if (this.apiLatencies.length > 50) {
      this.apiLatencies.shift();
    }
  }

  // Increment error registry
  public static logError(): void {
    this.errorCount += 1;
  }

  // Track active connection pool offsets
  public static incrementActiveConnections(): void {
    this.activeConnectionsCount += 1;
  }

  public static decrementActiveConnections(): void {
    this.activeConnectionsCount = Math.max(0, this.activeConnectionsCount - 1);
  }

  // Health check metric compiler
  public static getSystemHealth(): SystemHealth {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;

    // CPU calculations
    const cpus = os.cpus();
    let totalMs = 0;
    let idleMs = 0;
    cpus.forEach(cpu => {
      totalMs += Object.values(cpu.times).reduce((a, b) => a + b, 0);
      idleMs += cpu.times.idle;
    });
    const cpuLoad = 100 - (idleMs / (totalMs || 1)) * 100;

    const aiSummary = AiEvaluator.getMetricsSummary();

    let status: 'Healthy' | 'Degraded' | 'Critical' = 'Healthy';
    if (memPercent > 92 || this.errorCount > 25) {
      status = 'Critical';
    } else if (memPercent > 80 || this.errorCount > 10) {
      status = 'Degraded';
    }

    return {
      status,
      uptimeSec: Math.round(os.uptime()),
      memoryUsagePercentage: Number(memPercent.toFixed(2)),
      cpuLoadPercentage: Number(cpuLoad.toFixed(2)),
      activeDbConnections: this.activeConnectionsCount,
      errorsLogged: this.errorCount,
      aiMetrics: aiSummary
    };
  }

  public static getAverageApiLatencyMs(): number {
    if (this.apiLatencies.length === 0) return 0;
    const total = this.apiLatencies.reduce((sum, v) => sum + v, 0);
    return Math.round(total / this.apiLatencies.length);
  }

  public static clear(): void {
    this.apiLatencies = [];
    this.errorCount = 0;
    this.activeConnectionsCount = 0;
  }
}
