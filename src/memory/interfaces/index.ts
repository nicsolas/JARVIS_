export type MemoryTier =
  | 'working'
  | 'episodic'
  | 'semantic'
  | 'personal'
  | 'core'
  | 'ephemeral'
  | 'contextual'
  | 'project'
  | 'preference';

export interface MemoryRecord {
  id: string;
  content: string;
  tier: MemoryTier;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  importance: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  relevance: number;  // 0.0 to 1.0
  accessCount: number;
  source?: string;
  projectId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  supersededBy?: string;
  isSuperseded?: boolean;
  reasoningEligible?: boolean;
  surfacingEligible?: boolean;
  suppressed?: boolean;
}

export interface IEmbeddingProvider {
  readonly dimension: number;
  embed(text: string): Promise<number[]>;
}

export interface MemoryScoreBreakdown {
  similarity: number;
  relevance: number;
  importance: number;
  confidence: number;
  recencyScore: number;
  accessScore: number;
  tierWeight: number;
  finalScore: number;
}

export interface MemorySearchOptions {
  query: string;
  tier?: MemoryTier;
  allowedTiers?: MemoryTier[];
  projectId?: string;
  limit?: number;
  topK?: number;
  minScore?: number;
  purpose?: 'reasoning' | 'user_surface';
  reasoningMode?: boolean;
  surfacingMode?: boolean;
}

export interface MemorySearchResult {
  record: MemoryRecord;
  score: number;
  surfacable: boolean;
  active: boolean;
  suppressed: boolean;
  reasoningEligible: boolean;
  surfacingEligible: boolean;
  scoreBreakdown?: MemoryScoreBreakdown;
  suppressionReason?: string;
}

export interface IMemoryStore {
  readonly activationThreshold: number;
  readonly suppressionThreshold: number;

  add?(memory: MemoryRecord): Promise<MemoryRecord>;
  store(recordInput: Partial<MemoryRecord> & { content: string; tier: MemoryTier }): Promise<MemoryRecord>;
  get?(id: string): Promise<MemoryRecord | null>;
  update(id: string, updates: Partial<MemoryRecord>): Promise<MemoryRecord>;
  delete(id: string): Promise<boolean>;
  search(options: MemorySearchOptions): Promise<MemorySearchResult[]>;
  retrieve?(query: string, options?: Omit<MemorySearchOptions, 'query'>): Promise<MemorySearchResult[]>;
  clear?(): Promise<void>;
  size?(): Promise<number>;
}
