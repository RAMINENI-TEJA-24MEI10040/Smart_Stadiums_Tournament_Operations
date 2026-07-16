/**
 * Calculates the cosine similarity score between two numeric vectors.
 * Returns a value between 0.0 (entirely orthogonal) and 1.0 (identical vector direction).
 * Handles division by zero (e.g. empty vectors) by returning a 0.0 similarity floor.
 * 
 * @param vecA Array of numeric components for vector A
 * @param vecB Array of numeric components for vector B
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}
