import { IMemoryStore, MemoryRecord, MemorySearchOptions, MemorySearchResult } from '../interfaces/index.js';

export class MockMemoryStore implements IMemoryStore {
  readonly activationThreshold: number;
  readonly suppressionThreshold: number;
  private records: Map<string, MemoryRecord> = new Map();

  constructor(activationThreshold = 0.72, suppressionThreshold = 0.50) {
    this.activationThreshold = activationThreshold;
    this.suppressionThreshold = suppressionThreshold;
  }

  async store(recordInput: Partial<MemoryRecord> & { content: string; tier: MemoryRecord['tier'] }): Promise<MemoryRecord> {
    const now = Date.now();
    const record: MemoryRecord = {
      ...recordInput,
      id: recordInput.id || `mem-${now}-${Math.random().toString(36).substring(2, 7)}`,
      content: recordInput.content,
      tier: recordInput.tier,
      createdAt: recordInput.createdAt ?? now,
      updatedAt: now,
      lastAccessedAt: recordInput.lastAccessedAt ?? now,
      importance: recordInput.importance ?? 0.5,
      confidence: recordInput.confidence ?? 0.8,
      relevance: recordInput.relevance ?? 1.0,
      accessCount: recordInput.accessCount ?? 0,
      reasoningEligible: recordInput.reasoningEligible ?? true,
      surfacingEligible: recordInput.surfacingEligible ?? true
    };
    this.records.set(record.id, record);
    return record;
  }

  async search(options: MemorySearchOptions): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = [];
    const queryLower = options.query.toLowerCase();

    for (const record of this.records.values()) {
      if (options.tier && record.tier !== options.tier) continue;
      if (options.projectId && record.projectId !== options.projectId) continue;

      let score = 0;
      if (record.content.toLowerCase().includes(queryLower)) {
        score = 0.85;
      } else {
        score = 0.40;
      }

      const suppressed = score < this.suppressionThreshold || record.suppressed === true;
      if (suppressed) continue;

      const active = score >= this.activationThreshold;
      const surfacable = active && !suppressed && options.purpose === 'user_surface';

      results.push({
        record,
        score,
        surfacable,
        active,
        suppressed,
        reasoningEligible: record.reasoningEligible ?? true,
        surfacingEligible: record.surfacingEligible ?? true
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, options.limit || 5);
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
