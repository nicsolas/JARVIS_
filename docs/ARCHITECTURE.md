# ARCHITECTURE.md — System Architecture & Subsystem Boundaries

## 1. High-Level Architecture

JARVIS is engineered as a modular, event-driven system built on micro-kernel principles. The core orchestrator manages state transitions, routes events between specialized subsystems, and enforces memory, routing, and security policies.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                  │
│       ┌──────────────────────────────┐       ┌──────────────────────────────┐   │
│       │    Desktop App (Tauri)       │       │  Mobile App (React Native)   │   │
│       └──────────────┬───────────────┘       └──────────────┬───────────────┘   │
└──────────────────────┼──────────────────────────────────────┼───────────────────┘
                       │ RPC / WebSocket / IPC Protocol       │
                       ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 JARVIS CORE                                     │
│                                                                                 │
│   ┌──────────────────────────┐   ┌──────────────────────────┐                   │
│   │   Subsystem Gateway &    │   │  Core Orchestration &    │                   │
│   │   Event Dispatcher       │   │  State Engine            │                   │
│   └────────────┬─────────────┘   └────────────┬─────────────┘                   │
│                │                              │                                 │
│                ▼                              ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐                   │
│   │                   Intelligence Pipeline                 │                   │
│   │  ┌────────────────────┐       ┌──────────────────────┐  │                   │
│   │  │ Model Router       │       │ Risk & Approval      │  │                   │
│   │  │ (Difficulty Engine)│       │ Engine               │  │                   │
│   │  └─────────┬──────────┘       └──────────┬───────────┘  │                   │
│   │            │                             │              │                   │
│   │            ▼                             ▼              │                   │
│   │  ┌───────────────────────────────────────────────────┐  │                   │
│   │  │ Semantic Vector Memory Engine (5-Tier Store)      │  │                   │
│   │  └───────────────────────────────────────────────────┘  │                   │
│   └────────────────────────────┬────────────────────────────┘                   │
└────────────────────────────────┼────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Voice & Calling │   │  AI Providers    │   │ Sandboxed Tool   │
│  Subsystem       │   │  (Cloud & Local) │   │ Runtime          │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Core Orchestrator & State Engine
* Responsible for maintaining session context, event routing, state machines, and lifecycle management.
* Ensures atomic transactions for system state changes and coordinates asynchronous tool executions.

### 2.2 Intelligence & Model Router (`docs/MODEL_ROUTING.md`)
* Classifies incoming tasks by **Difficulty** and **Risk**.
* Routes queries to deterministic local handlers, lightweight fast models, or deep reasoning engines.
* Decouples prompt construction from specific LLM provider APIs.

### 2.3 Semantic Vector Memory Engine (`docs/MEMORY.md`)
* Implements a 5-tier memory hierarchy (Ephemeral, Contextual, Project, Preference, Core).
* Performs vector embedding generation and multi-factor similarity/recency/importance scoring.
* Enforces strict suppression thresholds so non-pertinent memories are filtered out.

### 2.4 Risk & Approval Subsystem (`docs/APPROVALS.md`)
* Intercepts tool execution requests and classifies risk severity.
* Manages user authorization challenges (Auto, Notification, Biometric/Step-up).
* Maintains an immutable local append-only security log.

### 2.5 Voice & Calling Engine (`docs/VOICE.md`, `docs/CALLING.md`)
* Handles microphone input, Voice Activity Detection (VAD), Speech-to-Text (STT), and Text-to-Speech (TTS).
* Houses the WebRTC / LiveKit abstraction for real-time bidirectional in-app voice calls.

### 2.6 Tool Execution Runtime (`docs/TOOLS.md`)
* Registers local tool schemas (system controls, shell execution, file utilities, API integrations).
* Executes tools inside isolated process sandboxes with strict permission scopes.

---

## 3. Replaceability & Decoupling Matrix

To prevent vendor lock-in and ensure long-term stability, all primary components are accessed through abstract interface definitions:

| Interface Boundary | Preferred Implementation | Modular Fallback / Alternative | Strategy |
|---|---|---|---|
| **Vector Database** | **LanceDB** (Embedded, fast local vector engine) | **Qdrant** / Local File Store | Abstract `IVectorStore` interface |
| **Cloud AI Provider** | **Anthropic Claude** / **OpenAI API** | **Groq** / **DeepSeek** | Abstract `IAIProvider` interface |
| **Local AI Provider** | **Ollama** | **vLLM** / **llama.cpp** | Local OpenAI-compatible API bridge |
| **STT Engine** | **Whisper** (Local/API) | **Deepgram** / Browser WebSpeech | Abstract `ISpeechToText` interface |
| **TTS Engine** | **ElevenLabs** | **Piper** / Local System TTS | Abstract `ITextToSpeech` interface |
| **Desktop Shell** | **Tauri** (Rust + Lightweight Webview) | **Electron** | Shared React/TypeScript Frontend |
| **Mobile Client** | **React Native + Expo** | Swift/Kotlin Native | Shared API/WebSocket protocol |

---

## 4. End-to-End Task Lifecycle

1. **Input Ingestion**: User input received via voice (STT stream) or UI text input.
2. **Context Assembly**: Memory engine gathers relevant Contextual & Core memories, calculating retrieval scores and applying suppression rules.
3. **Difficulty & Risk Evaluation**:
   * *Is it deterministic?* $\rightarrow$ Execute directly via local script.
   * *Low risk?* $\rightarrow$ Route to designated AI model.
   * *High risk?* $\rightarrow$ Pause, generate execution plan, request user approval via client UI.
4. **Execution & Tool Call**: Subsystem runs tool in sandbox; audit log records inputs/outputs.
5. **Response Delivery**: Output streams back to UI client and/or TTS voice pipeline.
6. **Memory Encoding**: Memory engine extracts significant facts/outcomes and asynchronously writes updated vector embeddings to the memory store.
