import { cosineSimilarity } from '../../../shared/math-utils';

export interface DocumentChunk {
  id: string;
  text: string;
  source: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export class RagEngine {
  private chunks: DocumentChunk[] = [];
  
  constructor() {
    this.seedKnowledgeBase();
  }

  private seedKnowledgeBase(): void {
    const rawDocs = [
      {
        source: 'stadium_map.txt',
        text: 'Gate 1 is located in the North Zone. It serves as the primary ingress point for VIPs and corporate boxes. Near Gate 1 is Entrance Lounge A. General evacuation routes from North Zone go through Gate 1.',
        metadata: { zone: 'North', category: 'map' }
      },
      {
        source: 'stadium_map.txt',
        text: 'Gate 2 is in the East Zone. It handles high-volume spectator ingress from the main transit station. Queue lines here frequently block East Corridor. Evacuation points for East Zone are directed toward Gate 1 and Gate 4.',
        metadata: { zone: 'East', category: 'map' }
      },
      {
        source: 'stadium_map.txt',
        text: 'Gate 3 is in the South Zone. It is closed by default and opened only for emergency egress or high occupancy overflows. Egress route goes directly to parking lot C.',
        metadata: { zone: 'South', category: 'map' }
      },
      {
        source: 'stadium_map.txt',
        text: 'Gate 4 is in the West Zone. It handles light spectator ingress and contains accessibility ramps for wheelchair access. Connects directly to West bypass walkway.',
        metadata: { zone: 'West', category: 'map' }
      },
      {
        source: 'emergency_procedures.txt',
        text: 'FIRE CODE: In case of fire alarms, initiate strobe lights. Direct all spectators to the nearest open gate. Do not use elevators. Sound alarms in adjacent zones. Open Gate 3 South egress immediately.',
        metadata: { category: 'safety', code: 'FIRE' }
      },
      {
        source: 'emergency_procedures.txt',
        text: 'CROWD CONTROL: Turnstile flow rates above 200 people per minute indicate congestion. Open secondary gates. Deploy crowd operations team to section bottlenecks to guide spectators.',
        metadata: { category: 'safety', code: 'CROWD' }
      },
      {
        source: 'sustainability_guidelines.txt',
        text: 'ENERGY OPTIMIZATION: Reduce corridor lighting load by 50% in vacant areas. Set HVAC cooling parameters to 25°C inside VIP lounges when empty to maintain efficient green operations status.',
        metadata: { category: 'sustainability' }
      }
    ];

    this.chunks = rawDocs.map((doc, idx) => {
      const chunk: DocumentChunk = {
        id: `chunk-${idx}`,
        text: doc.text,
        source: doc.source,
        metadata: doc.metadata,
        embedding: this.generateEmbedding(doc.text)
      };
      return chunk;
    });
  }

  // A robust local TF-IDF style vector generator
  public generateEmbedding(text: string): number[] {
    const vocab = ['gate', 'north', 'east', 'south', 'west', 'fire', 'alarm', 'evacuate', 'crowd', 'congestion', 'sustainability', 'hvac', 'energy', 'volunteer', 'referee', 'match'];
    const tokens = text.toLowerCase().split(/\W+/);
    const embedding = new Array(vocab.length).fill(0);
    
    tokens.forEach(token => {
      const idx = vocab.indexOf(token);
      if (idx >= 0) {
        embedding[idx] += 1;
      }
    });

    // Normalize vector
    const mag = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map(val => val / mag);
  }

  /**
   * Hybrid Search: Keyword frequency score + Semantic similarity vector score.
   * 
   * @param query The operator search prompt string
   * @param limit Maximum chunk elements to retrieve
   */
  public search(query: string, limit: number = 3): DocumentChunk[] {
    const queryVector = this.generateEmbedding(query);
    const queryTerms = query.toLowerCase().split(/\W+/);

    const scored = this.chunks.map(chunk => {
      // Vector semantic similarity
      const semanticScore = cosineSimilarity(queryVector, chunk.embedding || []);

      // Keyword term matching frequency
      const chunkTokens = chunk.text.toLowerCase().split(/\W+/);
      let keywordMatches = 0;
      queryTerms.forEach(term => {
        if (term.length > 2 && chunkTokens.includes(term)) {
          keywordMatches += 1;
        }
      });
      const keywordScore = keywordMatches / (chunkTokens.length || 1);

      // Hybrid combined score
      const hybridScore = (semanticScore * 0.7) + (keywordScore * 0.3);

      return { chunk, score: hybridScore };
    });

    // Re-ranking based on score
    const sorted = scored.sort((a, b) => b.score - a.score);

    // Apply limit and filter low similarity chunks
    return sorted
      .filter(item => item.score > 0.05)
      .slice(0, limit)
      .map(item => item.chunk);
  }

  // Context Compression: Takes chunks and packs them into a compressed prompt string
  public compressContext(chunks: DocumentChunk[]): string {
    if (chunks.length === 0) return 'No context documents retrieved.';
    return chunks.map(c => `[Source: ${c.source}] ${c.text}`).join('\n\n');
  }
}

export const ragEngineInstance = new RagEngine();
