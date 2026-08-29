import { describe, it, expect } from 'vitest';
import { VectorMemoryEngine } from '../src/memory/engine/VectorMemoryEngine.js';

describe('M2 Vector Memory Engine Test Suite', () => {
  it('should store and retrieve memories across 5 tiers', async () => {
    const memory = new VectorMemoryEngine(0.70, 0.40);

    await memory.store({ content: 'User prefers dark theme', tier: 'preference', importance: 0.9 });
    await memory.store({ content: 'Project JARVIS built with Tauri', tier: 'project', projectId: 'jarvis', importance: 0.8 });
    await memory.store({ content: 'Foundational User Identity: Owner Alex', tier: 'core', importance: 1.0 });

    const results = async () => memory.search({ query: 'theme preference', purpose: 'reasoning' });
    const res = await results();

    expect(res.length).toBeGreaterThan(0);
    expect(res[0].record.content).toContain('dark theme');
  });

  it('should differentiate between surfacable and suppressed reasoning context', async () => {
    const memory = new VectorMemoryEngine(0.80, 0.40);

    await memory.store({ content: 'User likes coffee in the morning', tier: 'preference', importance: 0.5 });

    const reasoningSearch = await memory.search({ query: 'coffee morning', purpose: 'reasoning' });
    const surfaceSearch = await memory.search({ query: 'coffee morning', purpose: 'user_surface' });

    expect(reasoningSearch.length).toBe(1);
    expect(surfaceSearch.length).toBe(1);
    expect(surfaceSearch[0].surfacable).toBeDefined();
  });

  it('should consolidate ephemeral and contextual memories', async () => {
    const memory = new VectorMemoryEngine();
    await memory.store({ content: 'High priority preference', tier: 'contextual', importance: 0.9 });

    const report = await memory.consolidateMemories();
    expect(report.consolidatedCount).toBe(1);
  });
});
