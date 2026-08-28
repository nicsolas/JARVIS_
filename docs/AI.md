# AI.md — Multi-Provider AI Abstraction & Local/Cloud Models

## 1. Multi-Provider Architecture

JARVIS must **never** be hard-coded to a single AI vendor (e.g., OpenAI). The AI layer is designed as an open multi-provider engine capable of dynamically switching between local runtimes, low-cost fast providers, and high-reasoning cloud services.

```
                               ┌────────────────────────────────┐
                               │       JARVIS Model Router      │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       ▼                       ▼                       ▼
           ┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
           │     Local Engines     │ │ Low-Cost / Fast   │ │ High-Reasoning Cloud  │
           │  (Ollama, vLLM, cpp)  │ │ (Groq, DeepSeek)  │ │ (Anthropic, OpenAI)   │
           └───────────────────────┘ └───────────────────┘ └───────────────────────┘
```

---

## 2. Universal Provider Interface

All AI interactions flow through a unified interface abstraction layer (`IAIProvider`):

```typescript
export interface ModelCapability {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  tier: 'local' | 'fast' | 'reasoning';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  content: string;
  toolCalls?: unknown[];
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
  completeStream(
    request: CompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<CompletionResponse>;
}
```

---

## 3. Supported Provider Tiers & Rationale

### Tier 1: Local AI Engines (Privacy & Offline Independence)
* **Implementations**: **Ollama** (preferred default local runtime), **vLLM**, **llama.cpp**, **LocalAI**.
* **Rationale**: Enables zero-latency, private, offline execution for simple queries, local system commands, and background text processing without external bandwidth or API costs.

### Tier 2: Low-Cost / Fast Cloud Providers
* **Implementations**: **Groq**, **DeepSeek**, **Together AI**, **Mistral API**.
* **Rationale**: Delivers high-speed responses (sub-200ms TTFT) for straightforward queries, fast code formatting, and non-sensitive summarization tasks at minimal operational cost.

### Tier 3: Premium High-Reasoning Providers
* **Implementations**: **Anthropic Claude (3.5 Sonnet / Opus)**, **OpenAI (GPT-4o)**, **Google Gemini Pro**.
* **Rationale**: Reserved for complex software debugging, architectural reasoning, multi-step tool composition, and subtle contextual analysis.

---

## 4. Fallback & Resilience Strategy

JARVIS implements an automatic failover cascade when external providers experience rate limits, outages, or high latency:

```
 Primary Model (e.g. Anthropic Claude)
                 │
                 ▼ (If Timeout / 5xx / Rate-Limit)
 Secondary Model (e.g. OpenAI GPT-4o)
                 │
                 ▼ (If Network Unavailable)
 Local Engine (e.g. Ollama Llama-3)
                 │
                 ▼
 Return degraded output with offline alert UI state
```

1. **Circuit Breaker**: If a provider fails 3 consecutive requests, mark provider as `UNAVAILABLE` for 5 minutes.
2. **Graceful Degradation**: Fall back from Cloud Reasoning $\rightarrow$ Cloud Fast $\rightarrow$ Local Engine seamlessly.
3. **User Telemetry**: Display active provider badge on UI header (e.g., `Provider: Ollama (Local) [Offline Fallback]`).

---

## 5. Streaming & Context Optimization

* **Mandatory Streaming**: Audio TTS and UI message rendering **must** stream tokens in real-time.
* **Context Trimming**: Prioritize Core and active Contextual memories; trim older Ephemeral turns to fit exact model context windows.
