export interface ModelCapability {
  id: string;
  name: string;
  providerId: string;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  tier: 'LOCAL' | 'FAST_CLOUD' | 'REASONING_CLOUD';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
}

export interface CompletionResponse {
  id: string;
  content: string;
  modelId: string;
  providerId: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAIProvider {
  readonly id: string;
  readonly capabilities: ModelCapability[];

  initialize(): Promise<void>;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  completeStream?(
    request: CompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<CompletionResponse>;
}
