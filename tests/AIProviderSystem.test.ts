import { describe, it, expect } from 'vitest';
import { AIProviderRegistry, OllamaLocalProvider } from '../src/ai/registry/AIProviderRegistry.js';
import { MockAIProvider } from '../src/ai/providers/MockAIProvider.js';

describe('M3 & M4 AI Provider & Model Router Test Suite', () => {
  it('should register providers and auto-fallback to available models', async () => {
    const registry = new AIProviderRegistry();
    const ollama = new OllamaLocalProvider();
    const cloudMock = new MockAIProvider();

    registry.registerProvider(ollama);
    registry.registerProvider(cloudMock);

    expect(registry.getAllProviders().length).toBe(2);

    const models = await ollama.listLocalModels();
    expect(models).toContain('llama3:8b');

    const res = await registry.executeWithFallback({
      messages: [{ role: 'user', content: 'Test prompt' }]
    }, 'ollama-local');

    expect(res.providerId).toBe('ollama-local');
  });

  it('should fallback to cloud provider if primary local provider fails', async () => {
    const registry = new AIProviderRegistry();
    const cloudMock = new MockAIProvider();
    registry.registerProvider(cloudMock);

    const res = await registry.executeWithFallback({
      messages: [{ role: 'user', content: 'Test prompt' }]
    }, 'non-existent-local-provider');

    expect(res.providerId).toBe(cloudMock.id);
  });
});
