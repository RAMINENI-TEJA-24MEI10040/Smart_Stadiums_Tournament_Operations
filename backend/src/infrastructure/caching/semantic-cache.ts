import { ragEngineInstance } from '../ai/rag/rag-engine';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  embedding?: number[];
}

export class SemanticCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private static instance: SemanticCache;

  private constructor() {}

  public static getInstance(): SemanticCache {
    if (!SemanticCache.instance) {
      SemanticCache.instance = new SemanticCache();
    }
    return SemanticCache.instance;
  }

  // Basic key-value set with TTL (in seconds)
  public set<T>(key: string, value: T, ttlSec: number = 300): void {
    const expiresAt = Date.now() + ttlSec * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  // Basic key-value get
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  // Semantic Prompt Cache: matches highly similar query patterns (cosine distance > 0.96)
  public getSemanticPrompt(query: string): string | null {
    const queryVector = ragEngineInstance.generateEmbedding(query);
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.embedding && key.startsWith('prompt_')) {
        if (Date.now() > entry.expiresAt) {
          this.cache.delete(key);
          continue;
        }

        const similarity = this.cosineSimilarity(queryVector, entry.embedding);
        if (similarity > 0.96) {
          console.log(`[Semantic Cache Hit] Matched query "${query}" to cached key "${key}" with similarity: ${similarity.toFixed(4)}`);
          return entry.value;
        }
      }
    }

    return null;
  }

  // Set Semantic Prompt completion
  public setSemanticPrompt(query: string, completion: string, ttlSec: number = 600): void {
    const queryVector = ragEngineInstance.generateEmbedding(query);
    const key = `prompt_${query.trim().toLowerCase().replace(/\W+/g, '_')}`;
    const expiresAt = Date.now() + ttlSec * 1000;

    this.cache.set(key, {
      value: completion,
      expiresAt,
      embedding: queryVector
    });
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) || 0;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const semanticCacheInstance = SemanticCache.getInstance();
