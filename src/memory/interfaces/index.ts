export type MemoryTier = 'ephemeral' | 'contextual' | 'project' | 'preference' | 'core';

export interface MemoryRecord {
  id: string;
  content: string;
  tier: MemoryTier;
  projectId?: string;
  importance: number; // 0.0 to 1.0
  createdAt: number;
  lastAccessedAt: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface MemorySearchOptions {
  query: string;
  tier?: MemoryTier;
  projectId?: string;
  limit?: number;
  minScore?: number;
  purpose?: 'reasoning' | 'user_surface';
}

export interface MemorySearchResult {
  record: MemoryRecord;
  score: number;
  surfacable: boolean;
}

export interface IMemoryStore {
  readonly activationThreshold: number;
  readonly suppressionThreshold: number;

  search(options: MemorySearchOptions): Promise<MemorySearchResult[]>;
  store(record: Omit<MemoryRecord, 'id' | 'createdAt' | 'lastAccessedAt'>): Promise<MemoryRecord>;
  update(id: string, updates: Partial<MemoryRecord>): Promise<MemoryRecord>;
  delete(id: string): Promise<boolean>;
}
