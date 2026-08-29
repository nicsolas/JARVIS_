/**
 * Computes cosine similarity between two numeric vectors.
 *
 * @param vecA First vector
 * @param vecB Second vector
 * @returns Similarity score in range [-1.0, 1.0] (or [0, 1] for non-negative embeddings)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB) {
    throw new Error('Vectors cannot be null or undefined');
  }

  if (vecA.length === 0 || vecB.length === 0) {
    throw new Error('Vectors cannot be empty');
  }

  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimensions mismatch: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      throw new Error(`Invalid vector value at index ${i}: NaN or Infinity encountered`);
    }

    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const magA = Math.sqrt(normA);
  const magB = Math.sqrt(normB);

  // Handle zero vectors safely without NaN/Infinity leakage
  if (magA === 0 || magB === 0) {
    return 0.0;
  }

  const similarity = dotProduct / (magA * magB);

  // Clamp numerical inaccuracies to [-1.0, 1.0]
  if (!Number.isFinite(similarity)) return 0.0;
  return Math.max(-1.0, Math.min(1.0, similarity));
}
