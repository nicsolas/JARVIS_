import { MemoryRecord, MemoryScoreBreakdown, MemoryTier } from '../interfaces/index.js';

export interface ScorerWeights {
  similarity: number;  // w1 = 0.40
  relevance: number;   // w2 = 0.15
  importance: number;  // w3 = 0.15
  confidence: number;  // w4 = 0.10
  recency: number;     // w5 = 0.10
  access: number;      // w6 = 0.05
  tierWeight: number;  // w7 = 0.05
}

export const DEFAULT_WEIGHTS: ScorerWeights = {
  similarity: 0.40,
  relevance: 0.15,
  importance: 0.15,
  confidence: 0.10,
  recency: 0.10,
  access: 0.05,
  tierWeight: 0.05
};

export const TIER_WEIGHTS: Record<MemoryTier, number> = {
  core: 1.0,
  personal: 0.9,
  preference: 0.9,
  semantic: 0.8,
  project: 0.8,
  episodic: 0.7,
  contextual: 0.7,
  working: 0.6,
  ephemeral: 0.6
};

export class MemoryScorer {
  private weights: ScorerWeights;
  private halfLifeMs: number;

  constructor(weights: ScorerWeights = DEFAULT_WEIGHTS, halfLifeHours = 72) {
    this.weights = weights;
    // halfLifeHours converted to milliseconds for exponential recency decay
    this.halfLifeMs = halfLifeHours * 3600 * 1000;
  }

  /**
   * Calculates exponential recency decay score in range [0, 1].
   * Decay formula: Score = e^(-lambda * t) where lambda = ln(2) / halfLifeMs
   */
  public calculateRecencyScore(lastAccessedAt: number, now: number = Date.now()): number {
    const ageMs = Math.max(0, now - lastAccessedAt);
    const lambda = Math.LN2 / this.halfLifeMs;
    const recency = Math.exp(-lambda * ageMs);
    return Math.max(0.0, Math.min(1.0, recency));
  }

  /**
   * Calculates access frequency score bounded in [0, 1].
   * Uses logarithmic scaling for diminishing returns on repeated access.
   */
  public calculateAccessScore(accessCount: number): number {
    if (accessCount <= 0) return 0.0;
    // log2(count + 1) / log2(100) capped at 1.0
    const score = Math.log2(accessCount + 1) / Math.log2(100);
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Computes the composite multi-factor retrieval score for a memory record.
   */
  public score(
    record: MemoryRecord,
    similarity: number,
    now: number = Date.now()
  ): MemoryScoreBreakdown {
    const normSimilarity = Math.max(0.0, Math.min(1.0, (similarity + 1) / 2 > 0.5 ? similarity : Math.max(0, similarity)));
    const relevance = record.relevance ?? 1.0;
    const importance = record.importance ?? 0.5;
    const confidence = record.confidence ?? 0.8;

    const recencyScore = this.calculateRecencyScore(record.lastAccessedAt || record.createdAt, now);
    const accessScore = this.calculateAccessScore(record.accessCount || 0);
    const tierWeight = TIER_WEIGHTS[record.tier] ?? 0.7;

    const finalScore =
      this.weights.similarity * normSimilarity +
      this.weights.relevance * relevance +
      this.weights.importance * importance +
      this.weights.confidence * confidence +
      this.weights.recency * recencyScore +
      this.weights.access * accessScore +
      this.weights.tierWeight * tierWeight;

    const boundedFinalScore = Math.max(0.0, Math.min(1.0, finalScore));

    return {
      similarity: normSimilarity,
      relevance,
      importance,
      confidence,
      recencyScore,
      accessScore,
      tierWeight,
      finalScore: boundedFinalScore
    };
  }
}
