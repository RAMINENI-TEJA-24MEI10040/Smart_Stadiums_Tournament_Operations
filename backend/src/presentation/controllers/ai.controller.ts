import { Request, Response, NextFunction } from 'express';
import { agentOrchestratorInstance } from '../../infrastructure/ai/orchestrator/agent-orchestrator';
import { AiEvaluator } from '../../infrastructure/ai/evaluators/evaluator';
import { semanticCacheInstance } from '../../infrastructure/caching/semantic-cache';

export class AIController {
  public async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, sessionId } = req.body;
      const targetSession = sessionId || 'default-session';

      // Smart Caching: check semantic response cache first
      const cached = semanticCacheInstance.getSemanticPrompt(query);
      if (cached) {
        res.status(200).json({
          status: 'Success',
          source: 'Cache',
          data: JSON.parse(cached)
        });
        return;
      }

      const result = await agentOrchestratorInstance.orchestrate(query, targetSession);
      
      // Cache success responses semantically
      if (result.confidenceScore > 0.5) {
        semanticCacheInstance.setSemanticPrompt(query, JSON.stringify(result));
      }

      res.status(200).json({
        status: 'Success',
        source: 'Live Model',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = AiEvaluator.getMetricsSummary();
      res.status(200).json({
        status: 'Success',
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiControllerInstance = new AIController();
