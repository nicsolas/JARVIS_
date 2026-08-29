import {
  IMemoryStore,
  MemoryRecord,
  MemorySearchOptions,
  MemorySearchResult,
  MemoryTier,
  IEmbeddingProvider
} from '../interfaces/index.js';
import { MockEmbeddingProvider } from '../embeddings/MockEmbeddingProvider.js';
import { cosineSimilarity } from '../utils/similarity.js';
import { MemoryScorer, TIER_WEIGHTS } from '../scoring/MemoryScorer.js';

export interface VectorMemoryStoreOptions {
  activationThreshold?: number;
  suppressionThreshold?: number;
  embeddingProvider?: IEmbeddingProvider;
  scorer?: MemoryScorer;
}

export class VectorMemoryStore implements IMemoryStore {
  readonly activationThreshold: number;
  readonly suppressionThreshold: number;
  private records: Map<string, MemoryRecord> = new Map();
  private embeddingProvider: IEmbeddingProvider;
  private scorer: MemoryScorer;

  constructor(options: VectorMemoryStoreOptions = {}) {
    this.activationThreshold = options.activationThreshold ?? 0.72;
    this.suppressionThreshold = options.suppressionThreshold ?? 0.50;
    this.embeddingProvider = options.embeddingProvider ?? new MockEmbeddingProvider();
    this.scorer = options.scorer ?? new MemoryScorer();
  }

  /**
   * Adds or updates a complete memory record in store.
   */
  async add(memoryInput: MemoryRecord): Promise<MemoryRecord> {
    if (!memoryInput.id) {
      throw new Error('Memory record must have an id');
    }

    if (memoryInput.confidence !== undefined && (memoryInput.confidence < 0 || memoryInput.confidence > 1)) {
      throw new Error('Memory confidence must be between 0.0 and 1.0');
    }

    // Embedding generation if missing
    let embedding = memoryInput.embedding;
    if (!embedding || embedding.length === 0) {
      embedding = await this.embeddingProvider.embed(memoryInput.content);
    }

    const now = Date.now();
    const record: MemoryRecord = {
      ...memoryInput,
      embedding,
      createdAt: memoryInput.createdAt ?? now,
      updatedAt: now,
      lastAccessedAt: memoryInput.lastAccessedAt ?? now,
      importance: memoryInput.importance ?? 0.5,
      confidence: memoryInput.confidence ?? 0.8,
      relevance: memoryInput.relevance ?? 1.0,
      accessCount: memoryInput.accessCount ?? 0,
      isSuperseded: memoryInput.isSuperseded ?? false,
      reasoningEligible: memoryInput.reasoningEligible ?? true,
      surfacingEligible: memoryInput.surfacingEligible ?? true
    };

    // Check conflict / supersession against existing records
    this.handleSupersession(record);

    this.records.set(record.id, record);
    return record;
  }

  /**
   * High-level helper conforming to IMemoryStore interface for adding new records.
   */
  async store(recordInput: Partial<MemoryRecord> & { content: string; tier: MemoryTier }): Promise<MemoryRecord> {
    const now = Date.now();
    const id = recordInput.id || `mem_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const embedding = recordInput.embedding || (await this.embeddingProvider.embed(recordInput.content));

    const record: MemoryRecord = {
      id,
      content: recordInput.content,
      tier: recordInput.tier,
      embedding,
      createdAt: recordInput.createdAt ?? now,
      updatedAt: now,
      lastAccessedAt: recordInput.lastAccessedAt ?? now,
      importance: recordInput.importance ?? 0.5,
      confidence: recordInput.confidence ?? 0.8,
      relevance: recordInput.relevance ?? 1.0,
      accessCount: recordInput.accessCount ?? 0,
      source: recordInput.source,
      projectId: recordInput.projectId,
      tags: recordInput.tags ?? [],
      metadata: recordInput.metadata ?? {},
      isSuperseded: recordInput.isSuperseded ?? false,
      reasoningEligible: recordInput.reasoningEligible ?? true,
      surfacingEligible: recordInput.surfacingEligible ?? true
    };

    return this.add(record);
  }

  async get(id: string): Promise<MemoryRecord | null> {
    const record = this.records.get(id);
    if (!record) return null;
    return { ...record };
  }

  async update(id: string, updates: Partial<MemoryRecord>): Promise<MemoryRecord> {
    const existing = this.records.get(id);
    if (!existing) {
      throw new Error(`Memory record with id "${id}" not found`);
    }

    let embedding = existing.embedding;
    if (updates.content && updates.content !== existing.content && !updates.embedding) {
      embedding = await this.embeddingProvider.embed(updates.content);
    } else if (updates.embedding) {
      embedding = updates.embedding;
    }

    const now = Date.now();
    const updated: MemoryRecord = {
      ...existing,
      ...updates,
      embedding,
      updatedAt: now
    };

    this.records.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }

  async size(): Promise<number> {
    return this.records.size;
  }

  /**
   * Main retrieval pipeline implementation.
   */
  async retrieve(query: string, options: Omit<MemorySearchOptions, 'query'> = {}): Promise<MemorySearchResult[]> {
    return this.search({ ...options, query });
  }

  async search(options: MemorySearchOptions): Promise<MemorySearchResult[]> {
    const query = options.query;
    const queryEmbedding = await this.embeddingProvider.embed(query);
    const results: MemorySearchResult[] = [];
    const now = Date.now();

    for (const record of this.records.values()) {
      // Tier filtering
      if (options.tier && record.tier !== options.tier) continue;
      if (options.allowedTiers && !options.allowedTiers.includes(record.tier)) continue;

      // Scope/Project filtering
      if (options.projectId && record.projectId && record.projectId !== options.projectId) {
        continue;
      }

      // Calculate vector similarity
      let similarity = 0;
      if (record.embedding && record.embedding.length === queryEmbedding.length) {
        similarity = cosineSimilarity(queryEmbedding, record.embedding);
      }

      // Multi-factor scoring
      const scoreBreakdown = this.scorer.score(record, similarity, now);
      const finalScore = scoreBreakdown.finalScore;

      // Minimum score filter check
      if (options.minScore !== undefined && finalScore < options.minScore) {
        continue;
      }

      // Check active status
      const active = finalScore >= this.activationThreshold;

      // Suppression Evaluation
      let suppressed = record.suppressed ?? false;
      let suppressionReason: string | undefined = undefined;

      if (record.isSuperseded) {
        suppressed = true;
        suppressionReason = 'Superseded by newer/stronger memory';
      } else if (finalScore < this.suppressionThreshold) {
        suppressed = true;
        suppressionReason = `Score ${finalScore.toFixed(3)} below suppression threshold ${this.suppressionThreshold}`;
      } else if (record.confidence < 0.3) {
        suppressed = true;
        suppressionReason = `Confidence ${record.confidence} too low (< 0.3)`;
      }

      // Reasoning vs Surfacing eligibility
      const isUserSurfacingRequest = options.purpose === 'user_surface' || options.surfacingMode === true;
      const isReasoningRequest = options.purpose === 'reasoning' || options.reasoningMode === true || !isUserSurfacingRequest;

      const reasoningEligible = (record.reasoningEligible ?? true) && !record.isSuperseded;
      const surfacingEligible = (record.surfacingEligible ?? true) && !suppressed && active;

      const surfacable = active && !suppressed && surfacingEligible;

      // Filter based on purpose mode if requested
      if (isUserSurfacingRequest && !surfacable) {
        continue;
      }

      if (isReasoningRequest && !reasoningEligible) {
        continue;
      }

      // Track memory access on active/surfaced retrieval
      if (active && !suppressed) {
        record.lastAccessedAt = now;
        record.accessCount = (record.accessCount || 0) + 1;
      }

      results.push({
        record,
        score: finalScore,
        surfacable,
        active,
        suppressed,
        reasoningEligible,
        surfacingEligible,
        scoreBreakdown,
        suppressionReason
      });
    }

    // Rank results by score descending
    results.sort((a, b) => b.score - a.score);

    const limit = options.limit ?? options.topK ?? 5;
    return results.slice(0, limit);
  }

  /**
   * Conflict & Supersession logic.
   * Lower tier memories cannot supersede or overwrite higher tier memories.
   */
  private handleSupersession(newRecord: MemoryRecord): void {
    const newTierWeight = TIER_WEIGHTS[newRecord.tier] ?? 0.5;

    for (const existing of this.records.values()) {
      if (existing.id === newRecord.id || existing.isSuperseded) continue;

      const existingTierWeight = TIER_WEIGHTS[existing.tier] ?? 0.5;

      // Similarity check between existing and new memory content
      if (existing.embedding && newRecord.embedding && existing.embedding.length === newRecord.embedding.length) {
        const sim = cosineSimilarity(existing.embedding, newRecord.embedding);

        // If high similarity (> 0.85) indicating conflicting/updated fact
        if (sim > 0.85) {
          // Rule: Lower-tier memory CANNOT overwrite or supersede a higher-tier memory
          if (newTierWeight < existingTierWeight) {
            // New memory is lower tier -> suppress new memory instead or preserve higher tier
            newRecord.isSuperseded = true;
            newRecord.supersededBy = existing.id;
            newRecord.suppressed = true;
            break;
          } else {
            // New memory is higher or equal tier -> supersedes existing old memory
            existing.isSuperseded = true;
            existing.supersededBy = newRecord.id;
            existing.suppressed = true;
          }
        }
      }
    }
  }
}
