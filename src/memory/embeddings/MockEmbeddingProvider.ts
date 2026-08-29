import { IEmbeddingProvider } from '../interfaces/index.js';

export class MockEmbeddingProvider implements IEmbeddingProvider {
  readonly dimension: number;

  constructor(dimension = 16) {
    if (dimension <= 0) {
      throw new Error('Dimension must be a positive integer');
    }
    this.dimension = dimension;
  }

  async embed(text: string): Promise<number[]> {
    const vector = new Array(this.dimension).fill(0);
    const normalizedText = text.toLowerCase().trim();

    if (!normalizedText) {
      return this.normalize(vector);
    }

    // Split into tokens (alphanumeric words)
    const tokens = normalizedText.match(/\b[a-z0-9]+\b/g) || [normalizedText];

    for (const token of tokens) {
      const tokenVector = this.hashTokenToVector(token);
      for (let i = 0; i < this.dimension; i++) {
        vector[i] += tokenVector[i];
      }
    }

    return this.normalize(vector);
  }

  private hashTokenToVector(token: string): number[] {
    const vec = new Array(this.dimension).fill(0);
    for (let i = 0; i < token.length; i++) {
      const charCode = token.charCodeAt(i);
      const slot = (charCode * 31 + i) % this.dimension;
      const val = ((charCode * 17 + i * 13) % 100) / 100 - 0.5;
      vec[slot] += val;
    }
    return vec;
  }

  private normalize(vector: number[]): number[] {
    let sumSq = 0;
    for (const val of vector) {
      sumSq += val * val;
    }
    const magnitude = Math.sqrt(sumSq);

    if (magnitude === 0) {
      const fallback = new Array(this.dimension).fill(0);
      fallback[0] = 1.0; // Return unit basis vector if all zero
      return fallback;
    }

    return vector.map(val => val / magnitude);
  }
}
