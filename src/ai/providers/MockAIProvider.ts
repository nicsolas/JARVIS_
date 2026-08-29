import { IAIProvider, ModelCapability, CompletionRequest, CompletionResponse } from '../interfaces/index.js';

export class MockAIProvider implements IAIProvider {
  readonly id = 'mock-provider';
  readonly capabilities: ModelCapability[] = [
    {
      id: 'mock-fast-model',
      name: 'Mock Fast Model',
      providerId: 'mock-provider',
      contextWindow: 8192,
      supportsStreaming: true,
      supportsTools: true,
      tier: 'FAST_CLOUD'
    },
    {
      id: 'mock-reasoning-model',
      name: 'Mock Heavy Reasoning Model',
      providerId: 'mock-provider',
      contextWindow: 128000,
      supportsStreaming: true,
      supportsTools: true,
      tier: 'REASONING_CLOUD'
    }
  ];

  async initialize(): Promise<void> {
    // No-op for mock
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const lastUserMessage = [...request.messages].reverse().find(m => m.role === 'user')?.content || '';
    const selectedModel = request.modelId || 'mock-fast-model';

    return {
      id: `mock-completion-${Date.now()}`,
      content: `[Mock AI Response (${selectedModel})]: Processed query "${lastUserMessage}"`,
      modelId: selectedModel,
      providerId: this.id,
      usage: {
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25
      }
    };
  }
}
