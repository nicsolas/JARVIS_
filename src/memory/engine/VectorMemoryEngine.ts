import { IMemoryStore, MemoryRecord, MemorySearchOptions, MemorySearchResult, MemoryTier } from '../interfaces/index.js';

export interface MemoryScoringFactors {
  similarity: number;
  contextRelevance: number;
  recency: number;
  importance: number;
  confidence: number;
}

export class VectorMemoryEngine implements IMemoryStore {
  readonly activationThreshold: number;
  readonly suppressionThreshold: number;
  private records: Map<string, MemoryRecord> = new Map();

  constructor(activationThreshold = 0.72, suppressionThreshold = 0.50) {
    this.activationThreshold = activationThreshold;
    this.suppressionThreshold = suppressionThreshold;
  }

  async store(recordInput: Omit<MemoryRecord, 'id' | 'createdAt' | 'lastAccessedAt'>): Promise<MemoryRecord> {
    const now = Date.now();
    const record: MemoryRecord = {
      ...recordInput,
      id: `mem_${now}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      lastAccessedAt: now,
      importance: recordInput.importance ?? 0.5
    };
    this.records.set(record.id, record);
    return record;
  }

  calculateScoring(record: MemoryRecord, query: string, options: MemorySearchOptions): { totalScore: number; factors: MemoryScoringFactors } {
    const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const contentLower = record.content.toLowerCase();

    // 1. Similarity score (token match approximation or vector similarity)
    let matchCount = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) matchCount++;
    }
    const similarity = queryWords.length > 0 ? matchCount / queryWords.length : 0.5;

    // 2. Context relevance
    let contextRelevance = 0.7;
    if (options.projectId && record.projectId === options.projectId) {
      contextRelevance += 0.25;
    }
    if (options.tier && record.tier === options.tier) {
      contextRelevance += 0.1;
    }
    contextRelevance = Math.min(1.0, contextRelevance);

    // 3. Recency decay (exponential decay half-life 7 days)
    const ageInHours = (Date.now() - record.lastAccessedAt) / (1000 * 60 * 60);
    const recency = Math.exp(-ageInHours / (24 * 7));

    // 4. Importance (from record)
    const importance = Math.max(0.1, Math.min(1.0, record.importance));

    // 5. Confidence score based on tier stability
    const confidenceByTier: Record<MemoryTier, number> = {
      core: 0.95,
      preference: 0.90,
      project: 0.85,
      contextual: 0.75,
      ephemeral: 0.60
    };
    const confidence = confidenceByTier[record.tier] || 0.70;

    // Weighted composite score formula
    const totalScore = similarity * 0.4 + contextRelevance * 0.2 + recency * 0.15 + importance * 0.15 + confidence * 0.1;

    return {
      totalScore: Number(totalScore.toFixed(4)),
      factors: { similarity, contextRelevance, recency, importance, confidence }
    };
  }

  async search(options: MemorySearchOptions): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = [];

    for (const record of this.records.values()) {
      if (options.tier && record.tier !== options.tier) continue;
      if (options.projectId && record.projectId !== options.projectId) continue;

      const { totalScore } = this.calculateScoring(record, options.query, options);

      // Suppression threshold: remember more than exposed; don't return suppressed memories if below threshold
      if (totalScore < this.suppressionThreshold) continue;

      const surfacable = totalScore >= this.activationThreshold && options.purpose === 'user_surface';

      results.push({
        record,
        score: totalScore,
        surfacable
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.limit || 5);
  }

  async consolidateMemories(): Promise<{ consolidatedCount: number; prunedCount: number }> {
    const now = Date.now();
    let prunedCount = 0;
    let consolidatedCount = 0;

    for (const [id, record] of Array.from(this.records.entries())) {
      // Ephemeral memories older than 24 hours are pruned
      if (record.tier === 'ephemeral' && now - record.createdAt > 24 * 60 * 60 * 1000) {
        this.records.delete(id);
        prunedCount++;
      }
      // Contextual memories accessed frequently get promoted to Preference or Core
      else if (record.tier === 'contextual' && record.importance >= 0.8) {
        this.records.set(id, { ...record, tier: 'preference' });
        consolidatedCount++;
      }
    }

    return { consolidatedCount, prunedCount };
  }

  async update(id: string, updates: Partial<MemoryRecord>): Promise<MemoryRecord> {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Memory record ${id} not found`);

    const updated: MemoryRecord = {
      ...existing,
      ...updates,
      lastAccessedAt: Date.now()
    };
    this.records.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}
