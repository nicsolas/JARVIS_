import { describe, it, expect, beforeEach } from 'vitest';
import {
  VectorMemoryStore,
  MockEmbeddingProvider,
  MemoryRecord,
  cosineSimilarity,
  MemoryScorer,
  TIER_WEIGHTS
} from '../src/memory/index.js';
import {
  JarvisCore,
  ModelRouter,
  ApprovalEngine,
  MockApprovalProvider,
  ToolRegistry,
  MockAIProvider,
  Logger,
  TaskRisk,
  TaskStatus
} from '../src/index.js';

describe('JARVIS Milestone 2: Vector Memory Engine Test Suite', () => {

  describe('1. Five Memory Tiers', () => {
    let store: VectorMemoryStore;

    beforeEach(() => {
      store = new VectorMemoryStore();
    });

    it('should support records in all 5 memory tiers (Working, Episodic, Semantic, Personal, Core)', async () => {
      const working = await store.store({ content: 'Current active conversation state', tier: 'working' });
      const episodic = await store.store({ content: 'Completed task: Refactored compiler module yesterday', tier: 'episodic' });
      const semantic = await store.store({ content: 'TypeScript strict null checks ensure safety', tier: 'semantic' });
      const personal = await store.store({ content: 'User prefers dark mode UI and Vim keybindings', tier: 'personal' });
      const core = await store.store({ content: 'Owner identity is Primary User', tier: 'core' });

      expect(working.tier).toBe('working');
      expect(episodic.tier).toBe('episodic');
      expect(semantic.tier).toBe('semantic');
      expect(personal.tier).toBe('personal');
      expect(core.tier).toBe('core');

      expect(await store.size()).toBe(5);
    });

    it('should assign appropriate tier weights to all memory tiers', () => {
      expect(TIER_WEIGHTS.core).toBeGreaterThan(TIER_WEIGHTS.personal);
      expect(TIER_WEIGHTS.personal).toBeGreaterThanOrEqual(TIER_WEIGHTS.preference);
      expect(TIER_WEIGHTS.semantic).toBeGreaterThan(TIER_WEIGHTS.episodic);
      expect(TIER_WEIGHTS.episodic).toBeGreaterThan(TIER_WEIGHTS.working);
    });

    it('should filter retrieval results by allowed tiers', async () => {
      await store.store({ content: 'Temporary task observation', tier: 'working' });
      await store.store({ content: 'Explicit system rule instruction', tier: 'core' });

      const coreResults = await store.search({ query: 'instruction', allowedTiers: ['core'] });
      expect(coreResults).toHaveLength(1);
      expect(coreResults[0].record.tier).toBe('core');
    });
  });

  describe('2. Embedding Abstraction & Local Provider', () => {
    let embeddingProvider: MockEmbeddingProvider;

    beforeEach(() => {
      embeddingProvider = new MockEmbeddingProvider(16);
    });

    it('should require no API key or network and produce deterministic vectors', async () => {
      const text = 'JARVIS personal assistant memory';
      const vec1 = await embeddingProvider.embed(text);
      const vec2 = await embeddingProvider.embed(text);

      expect(vec1).toEqual(vec2);
      expect(vec1).toHaveLength(16);
    });

    it('should produce normalized vectors with unit length', async () => {
      const vec = await embeddingProvider.embed('Test normalization vector length');
      const lengthSq = vec.reduce((sum, val) => sum + val * val, 0);
      expect(Math.sqrt(lengthSq)).toBeCloseTo(1.0, 5);
    });

    it('should show higher similarity for semantically/token-overlapping text', async () => {
      const vecA = await embeddingProvider.embed('TypeScript compiler errors');
      const vecB = await embeddingProvider.embed('TypeScript compiler warnings');
      const vecC = await embeddingProvider.embed('Cooking lasagna recipe in kitchen');

      const simAB = cosineSimilarity(vecA, vecB);
      const simAC = cosineSimilarity(vecA, vecC);

      expect(simAB).toBeGreaterThan(simAC);
    });
  });

  describe('3. Vector Similarity Utility', () => {
    it('should yield similarity = 1.0 for identical vectors', () => {
      const vec = [0.5, 0.5, 0.5, 0.5];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 5);
    });

    it('should handle orthogonal vectors yielding similarity = 0.0', () => {
      const vecA = [1.0, 0.0];
      const vecB = [0.0, 1.0];
      expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0.0, 5);
    });

    it('should handle opposite vectors yielding similarity = -1.0', () => {
      const vecA = [1.0, 0.0, -1.0];
      const vecB = [-1.0, 0.0, 1.0];
      expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1.0, 5);
    });

    it('should safely handle zero vectors without NaN/Infinity leakage', () => {
      const vecA = [0.0, 0.0, 0.0];
      const vecB = [1.0, 2.0, 3.0];
      const sim = cosineSimilarity(vecA, vecB);
      expect(sim).toBe(0.0);
      expect(Number.isNaN(sim)).toBe(false);
    });

    it('should reject dimension mismatches with explicit error', () => {
      const vecA = [1.0, 2.0];
      const vecB = [1.0, 2.0, 3.0];
      expect(() => cosineSimilarity(vecA, vecB)).toThrow('dimensions mismatch');
    });
  });

  describe('4. Deterministic Multi-Factor Scoring', () => {
    let scorer: MemoryScorer;

    beforeEach(() => {
      scorer = new MemoryScorer();
    });

    it('should produce deterministic score bounded in [0, 1]', () => {
      const record: MemoryRecord = {
        id: 'mem-1',
        content: 'Sample knowledge fact',
        tier: 'semantic',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        importance: 0.8,
        confidence: 0.9,
        relevance: 1.0,
        accessCount: 5
      };

      const breakdown = scorer.score(record, 0.85);

      expect(breakdown.finalScore).toBeGreaterThanOrEqual(0.0);
      expect(breakdown.finalScore).toBeLessThanOrEqual(1.0);
      expect(breakdown.similarity).toBe(0.85);
      expect(breakdown.importance).toBe(0.8);
      expect(breakdown.confidence).toBe(0.9);
    });

    it('should exhibit exponential recency decay over time', () => {
      const now = Date.now();
      const oneDay = 24 * 3600 * 1000;
      const tenDays = 10 * oneDay;

      const scoreNew = scorer.calculateRecencyScore(now, now);
      const score1Day = scorer.calculateRecencyScore(now - oneDay, now);
      const score10Days = scorer.calculateRecencyScore(now - tenDays, now);

      expect(scoreNew).toBeCloseTo(1.0, 5);
      expect(scoreNew).toBeGreaterThan(score1Day);
      expect(score1Day).toBeGreaterThan(score10Days);
    });

    it('should rank newer memories higher than older memories when all other factors are equal', async () => {
      const store = new VectorMemoryStore();
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;

      await store.add({
        id: 'old-mem',
        content: 'Server cluster A configuration settings',
        tier: 'semantic',
        createdAt: thirtyDaysAgo,
        updatedAt: thirtyDaysAgo,
        lastAccessedAt: thirtyDaysAgo,
        importance: 0.8,
        confidence: 0.8,
        relevance: 1.0,
        accessCount: 1
      });

      await store.add({
        id: 'new-mem',
        content: 'Server cluster B configuration parameters',
        tier: 'semantic',
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
        importance: 0.8,
        confidence: 0.8,
        relevance: 1.0,
        accessCount: 1
      });

      const results = await store.search({ query: 'Server cluster configuration' });

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0].record.id).toBe('new-mem');
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });
  });

  describe('5. Activation & Suppression Thresholds', () => {
    let store: VectorMemoryStore;

    beforeEach(() => {
      store = new VectorMemoryStore({
        activationThreshold: 0.72,
        suppressionThreshold: 0.50
      });
    });

    it('should mark score >= activationThreshold as active', async () => {
      await store.add({
        id: 'active-mem',
        content: 'Exact matched query text string for memory test',
        tier: 'core',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        importance: 1.0,
        confidence: 1.0,
        relevance: 1.0,
        accessCount: 10
      });

      const results = await store.search({ query: 'Exact matched query text string for memory test' });

      expect(results[0].score).toBeGreaterThanOrEqual(0.72);
      expect(results[0].active).toBe(true);
      expect(results[0].suppressed).toBe(false);
    });

    it('should suppress memories below suppression threshold or with low confidence', async () => {
      await store.add({
        id: 'low-conf-mem',
        content: 'Uncertain observation fact',
        tier: 'working',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        importance: 0.1,
        confidence: 0.2, // low confidence trigger
        relevance: 0.5,
        accessCount: 0
      });

      const results = await store.search({ query: 'Uncertain observation fact', minScore: 0.0 });

      expect(results[0].suppressed).toBe(true);
      expect(results[0].suppressionReason).toContain('Confidence 0.2 too low');
    });
  });

  describe('6. Reasoning vs Surfacing Distinction', () => {
    let store: VectorMemoryStore;

    beforeEach(() => {
      store = new VectorMemoryStore();
    });

    it('should allow memory to be reasoning eligible while not surfacing eligible', async () => {
      await store.add({
        id: 'internal-thought',
        content: 'Internal reasoning scratchpad note about user project',
        tier: 'working',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        importance: 0.6,
        confidence: 0.8,
        relevance: 1.0,
        accessCount: 1,
        reasoningEligible: true,
        surfacingEligible: false // explicit internal reasoning flag
      });

      const reasoningResults = await store.search({
        query: 'Internal reasoning scratchpad',
        purpose: 'reasoning'
      });

      expect(reasoningResults).toHaveLength(1);
      expect(reasoningResults[0].reasoningEligible).toBe(true);
      expect(reasoningResults[0].surfacingEligible).toBe(false);

      const surfacingResults = await store.search({
        query: 'Internal reasoning scratchpad',
        purpose: 'user_surface'
      });

      expect(surfacingResults).toHaveLength(0);
    });
  });

  describe('7. Conflict & Supersession Mechanism', () => {
    let store: VectorMemoryStore;

    beforeEach(() => {
      store = new VectorMemoryStore();
    });

    it('should allow newer higher-tier preference memory to supersede older preference memory', async () => {
      const oldMem = await store.store({
        content: 'User prefers light theme interface',
        tier: 'preference',
        importance: 0.7,
        confidence: 0.9
      });

      const newMem = await store.store({
        content: 'User prefers light theme interface', // high similarity
        tier: 'preference',
        importance: 0.9,
        confidence: 1.0
      });

      const retrievedOld = await store.get(oldMem.id);
      expect(retrievedOld?.isSuperseded).toBe(true);
      expect(retrievedOld?.supersededBy).toBe(newMem.id);
    });

    it('should PREVENT lower-tier memory from superseding or overwriting higher-tier core memory', async () => {
      const coreMem = await store.store({
        content: 'User primary editor is Vim editor',
        tier: 'core',
        importance: 1.0,
        confidence: 1.0
      });

      const workingMem = await store.store({
        content: 'User primary editor is Vim editor', // high similarity
        tier: 'working', // lower tier!
        importance: 0.5,
        confidence: 0.5
      });

      const retrievedCore = await store.get(coreMem.id);
      const retrievedWorking = await store.get(workingMem.id);

      expect(retrievedCore?.isSuperseded).toBe(false);
      expect(retrievedWorking?.isSuperseded).toBe(true);
      expect(retrievedWorking?.supersededBy).toBe(coreMem.id);
    });
  });

  describe('8. Retrieval Pipeline & Filters', () => {
    let store: VectorMemoryStore;

    beforeEach(async () => {
      store = new VectorMemoryStore();
      await store.store({ content: 'Project Alpha architecture docs', tier: 'project', projectId: 'alpha' });
      await store.store({ content: 'Project Beta architecture docs', tier: 'project', projectId: 'beta' });
    });

    it('should filter by projectId scope', async () => {
      const resultsAlpha = await store.search({ query: 'architecture docs', projectId: 'alpha' });

      expect(resultsAlpha).toHaveLength(1);
      expect(resultsAlpha[0].record.projectId).toBe('alpha');
    });

    it('should respect topK / limit parameter', async () => {
      const results = await store.search({ query: 'architecture docs', limit: 1 });
      expect(results).toHaveLength(1);
    });
  });

  describe('9. Memory Lifecycle & CRUD', () => {
    let store: VectorMemoryStore;

    beforeEach(() => {
      store = new VectorMemoryStore();
    });

    it('should support add, get, update, delete, clear, and size', async () => {
      const record = await store.store({
        content: 'Test CRUD content',
        tier: 'semantic'
      });

      expect(await store.size()).toBe(1);

      const retrieved = await store.get(record.id);
      expect(retrieved?.content).toBe('Test CRUD content');

      const updated = await store.update(record.id, { content: 'Updated CRUD content' });
      expect(updated.content).toBe('Updated CRUD content');

      const deleted = await store.delete(record.id);
      expect(deleted).toBe(true);
      expect(await store.size()).toBe(0);
    });

    it('should update lastAccessedAt and accessCount on active retrieval', async () => {
      const record = await store.add({
        id: 'access-track-mem',
        content: 'Tracking memory accesses in vector store',
        tier: 'semantic',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
        lastAccessedAt: Date.now() - 10000,
        importance: 0.9,
        confidence: 0.9,
        relevance: 1.0,
        accessCount: 0
      });

      const initialAccessCount = record.accessCount;
      const initialLastAccessed = record.lastAccessedAt;

      await store.search({ query: 'Tracking memory accesses in vector store' });

      const updatedRecord = await store.get(record.id);
      expect(updatedRecord?.accessCount).toBe(initialAccessCount + 1);
      expect(updatedRecord?.lastAccessedAt).toBeGreaterThan(initialLastAccessed);
    });
  });

  describe('10. Milestone 1 Integration Verification', () => {
    it('should seamlessly integrate VectorMemoryStore with JarvisCore', async () => {
      const vectorStore = new VectorMemoryStore();
      await vectorStore.store({
        content: 'User prefers Rust programming language',
        tier: 'preference',
        importance: 0.9
      });

      const core = new JarvisCore({
        modelRouter: new ModelRouter(),
        approvalEngine: new ApprovalEngine(TaskRisk.HIGH, new MockApprovalProvider(true)),
        toolRegistry: new ToolRegistry(),
        memoryStore: vectorStore, // VectorMemoryStore seamlessly plugged into IMemoryStore
        providers: [new MockAIProvider()],
        logger: new Logger('warn')
      });

      const task = await core.processRequest('Explain Rust ownership model');
      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.result?.success).toBe(true);
    });
  });
});
